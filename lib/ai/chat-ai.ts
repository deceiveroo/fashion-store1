// Builds the prompt and orchestrates a single AI reply for the support chat.
//
// Context assembled per message:
//   - System prompt: store persona + policy distilled from the curated FAQ
//     (lib/chat-auto-responses) so the model stays on-policy on shipping/returns/
//     payment, plus an optional admin override.
//   - Conversation history (mapped from support_chat_messages).
//   - For logged-in users: their recent orders + items, so "где мой заказ" is
//     answered with real data. Guests get FAQ-grounded answers only.
//   - Product matches for the current question (name/description search).
//
// The caller (app/api/chat/route.ts) is responsible for the aiDisabled gate and
// for falling back to findAutoResponse() if this throws/returns null.

import { db } from '@/lib/db';
import {
  orders, orderItems, products, categories, coupons, settings,
  cartItems, userWishlistItems, productVariants, users, supportChatMessages,
} from '@/lib/schema';
import { eq, asc, desc, and, isNotNull, isNull, or, ilike, gt, lte, inArray, sql } from 'drizzle-orm';
import { AUTO_RESPONSES } from '@/lib/chat-auto-responses';
import { cacheGet, cacheSet } from '@/lib/redis';
import { getActiveAiContext } from './registry';
import type { AiMessage, AiGenerateResult } from './types';

const MAX_HISTORY_MESSAGES = 12; // cap context size / cost
const MAX_ORDERS = 5;
const MAX_PRODUCTS = 6;
const MAX_CATEGORIES = 30;
const MAX_COUPONS = 10;

// Store-facts block is the same for everyone and changes rarely — cache it so we
// don't hit the DB (categories + coupons + settings) on every single message.
const STORE_CTX_CACHE_KEY = 'ai:store-context:v1';
const STORE_CTX_TTL_SEC = 60;

// Human-readable RU labels for the order status enums (lib/schema orderStatusEnum
// / paymentStatusEnum) so the model speaks to customers, not in DB codes.
const ORDER_STATUS_RU: Record<string, string> = {
  pending: 'в обработке',
  processing: 'собирается',
  shipped: 'отправлен',
  delivered: 'доставлен',
  cancelled: 'отменён',
  returned: 'оформлен возврат',
};
const PAYMENT_STATUS_RU: Record<string, string> = {
  pending: 'ожидает оплаты',
  paid: 'оплачен',
  failed: 'оплата не прошла',
  refunded: 'деньги возвращены',
};

// Sentinel the model appends when it wants to hand the chat to a human.
// Stripped from the visible reply before saving (the customer never sees it).
const ESCALATE_MARKER = /\[\[\s*ESCALATE\s*\]\]/gi;

// Default hand-off shown to the customer when escalation happens but the model
// produced no visible text of its own.
const DEFAULT_HANDOFF = 'Передаю ваш вопрос оператору — он скоро подключится. 👨‍💼';

/** Conservative detector for an explicit "I want a human" request. */
function looksLikeHumanRequest(message: string): boolean {
  const m = message.toLowerCase();
  return /(оператор|менеджер|живой человек|реальн[ыо][йм] человек|позов(и|ите)|жалоб|верните (мне )?деньги|обман|мошенн)/.test(m);
}

/** Built-in FAQ distilled into a compact policy block (fallback knowledge base). */
export function builtinKnowledgeBase(): string {
  return AUTO_RESPONSES.map((r) => `• [${r.category}] ${r.response.replace(/\n+/g, ' ')}`).join('\n');
}

function buildBaseSystemPrompt(knowledgeBase?: string | null): string {
  // Prefer the admin-edited knowledge base; fall back to the curated FAQ so the
  // model repeats our real terms instead of inventing them.
  const kb = knowledgeBase && knowledgeBase.trim() ? knowledgeBase.trim() : builtinKnowledgeBase();

  return [
    'Ты — «ELEVATE AI», вежливый ассистент службы поддержки интернет-магазина одежды ELEVATE.',
    'Ты помогаешь с: статусом и составом заказов клиента, доставкой и возвратами, оплатой, размерами, подбором товаров и наличием, действующими промокодами и контактами магазина.',
    'Отвечай кратко, дружелюбно и по делу, на языке клиента (обычно русский).',
    'Используй факты из базы знаний и блоков данных ниже как ИСТИНУ (правила магазина, «О магазине», заказы клиента, подходящие товары).',
    'КРИТИЧЕСКИ ВАЖНО: НИКОГДА не выдумывай телефон, email, адрес, цену, срок, размер скидки, промокод или услугу. Бери их ТОЛЬКО из блоков ниже. Если нужных данных нет — честно скажи, что уточнишь, и предложи подключить оператора. Лучше честное «не знаю», чем выдуманный факт.',
    'Если в блоке «О магазине» нет телефона/почты — не придумывай их, а предложи написать в этот чат оператору.',
    'Если вопрос требует живого оператора (сложный/спорный возврат, жалоба, конфликт, индивидуальный случай) ИЛИ клиент прямо просит человека, ИЛИ ты не можешь помочь — вежливо сообщи клиенту, что подключаешь оператора, и в САМОМ КОНЦЕ ответа добавь ОТДЕЛЬНОЙ СТРОКОЙ ровно: [[ESCALATE]]. Этот маркер служебный — клиент его не увидит, по нему система позовёт оператора. Не добавляй маркер, если справляешься сам.',
    'Не запрашивай и не раскрывай платёжные данные карт. Не обещай того, чего нет в правилах.',
    'Форматируй ответ в Markdown, можно с эмодзи, но без избыточности.',
    '',
    '=== БАЗА ЗНАНИЙ (правила магазина) ===',
    kb,
  ].join('\n');
}

function fmtMoney(v: string | null | undefined, currency = 'RUB'): string {
  if (!v) return '—';
  const n = Number(v);
  return Number.isFinite(n) ? `${n.toLocaleString('ru-RU')} ${currency}` : `${v} ${currency}`;
}

/** Render one order (with its items) into a single grounding line. */
async function orderToLine(o: typeof orders.$inferSelect): Promise<string> {
  const items = await db
    .select({
      name: orderItems.productName,
      qty: orderItems.quantity,
      size: orderItems.size,
      color: orderItems.color,
      price: orderItems.price,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, o.id))
    .limit(20);

  const itemList = items
    .map((it) => `${it.name}${it.size ? ` (размер ${it.size})` : ''}${it.color ? `, ${it.color}` : ''} ×${it.qty}`)
    .join('; ');

  const created = o.createdAt ? new Date(o.createdAt).toLocaleDateString('ru-RU') : '—';
  const statusRu = ORDER_STATUS_RU[o.status] ?? o.status;
  const payRu = o.paymentStatus ? (PAYMENT_STATUS_RU[o.paymentStatus] ?? o.paymentStatus) : '—';
  // recipient is a free-form JSON blob: {firstName, lastName, phone, email, address, city}
  const rec = (o.recipient ?? null) as { city?: string; address?: string } | null;
  const city = rec?.city ? `, город: ${rec.city}` : '';

  return (
    `Заказ №${o.orderNumber ?? o.id.slice(0, 8)} от ${created}: статус «${statusRu}», оплата «${payRu}», ` +
    `доставка «${o.deliveryMethod ?? '—'}»${city}, сумма ${fmtMoney(o.total, o.currency ?? 'RUB')}. Товары: ${itemList || '—'}.`
  );
}

/** Compact summary of the logged-in user's recent orders for grounding. */
async function buildOrdersContext(userId: string): Promise<string | null> {
  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt))
    .limit(MAX_ORDERS);

  if (rows.length === 0) return null;

  // Total order count (so the model can say "у вас всего N заказов", not just the
  // recent slice). Best-effort: falls back to the slice length.
  let totalCount = rows.length;
  try {
    const [c] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(orders)
      .where(eq(orders.userId, userId));
    if (c?.n) totalCount = Number(c.n);
  } catch {
    /* keep slice length */
  }

  const parts = await Promise.all(rows.map((o) => orderToLine(o)));

  const header =
    totalCount > rows.length
      ? `=== ЗАКАЗЫ КЛИЕНТА (всего заказов: ${totalCount}, показаны последние ${rows.length}; реальные данные, используй для ответов про заказы) ===`
      : '=== ЗАКАЗЫ КЛИЕНТА (реальные данные, используй для ответов про заказы) ===';
  return `${header}\n${parts.join('\n')}`;
}

/**
 * Guest order lookup: a not-logged-in customer can ask about an order by giving
 * BOTH its number and the email it was placed with. We only reveal the order when
 * the email matches (guestEmail or the owning user's email) — number alone is not
 * enough, so this can't be used to enumerate other people's orders.
 */
async function buildGuestOrderContext(message: string): Promise<string | null> {
  // Order numbers look like "ELV-260608-2Z11".
  const numbers = (message.toUpperCase().match(/ELV-\d{6}-[A-Z0-9]{4}/g) ?? []).slice(0, 3);
  const emailMatch = message.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  const email = emailMatch ? emailMatch[0].toLowerCase() : null;

  if (numbers.length === 0) return null;

  // Number given but no email → guide the model to ask for it (privacy gate).
  if (!email) {
    return (
      '=== ПРОВЕРКА ЗАКАЗА ГОСТЯ ===\n' +
      'Клиент назвал номер заказа, но не указал email. Для безопасности попроси указать email, ' +
      'на который оформлялся заказ, — без подтверждения email не раскрывай данные заказа.'
    );
  }

  const rows = await db
    .select({ order: orders, userEmail: users.email })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .where(inArray(orders.orderNumber, numbers))
    .limit(3);

  // Reveal only orders whose email matches what the customer provided.
  const matched = rows.filter((r) => {
    const ge = r.order.guestEmail?.toLowerCase();
    const ue = r.userEmail?.toLowerCase();
    return ge === email || ue === email;
  });

  if (matched.length === 0) {
    return (
      '=== ПРОВЕРКА ЗАКАЗА ГОСТЯ ===\n' +
      `Заказ с таким номером и email не найден. Попроси клиента перепроверить номер (формат ELV-XXXXXX-XXXX) ` +
      'и email, либо предложи войти в личный кабинет или подключить оператора. Не выдумывай статус.'
    );
  }

  const parts = await Promise.all(matched.map((r) => orderToLine(r.order)));
  return `=== ЗАКАЗ ПО НОМЕРУ (email подтверждён, реальные данные) ===\n${parts.join('\n')}`;
}

/** Pull a price ceiling out of phrases like "до 5000", "дешевле 3 тыс", "до 5к". */
function extractPriceMax(message: string): number | null {
  const m = message.toLowerCase().replace(/\s/g, '');
  const match = m.match(/(?:до|дешевле|менее|меньше|under|<)(\d+)(к|k|тыс)?/);
  if (!match) return null;
  let n = parseInt(match[1], 10);
  if (!Number.isFinite(n)) return null;
  if (match[2]) n *= 1000; // "5к" / "5 тыс" → 5000
  if (n < 100) return null; // ignore things like "до 14 дней"
  return n;
}

/** Heuristic: customer is asking for a suggestion rather than a specific item. */
function looksLikeRecommend(message: string): boolean {
  return /(посовету|порекоменд|рекоменд|подбери|подобрать|что выбрать|что есть|что купить|ассортимент|каталог|новинк|хит|бестселлер|популярн|образ)/i.test(
    message,
  );
}

/**
 * Product search / recommendations for the current question. Matches by
 * name/description/brand/color, honours a price ceiling ("до 5000"), and for
 * generic "посоветуйте"/price-only asks returns in-stock items (featured first).
 */
async function buildProductsContext(message: string): Promise<string | null> {
  const terms = message
    .toLowerCase()
    .replace(/[^a-zа-я0-9\s]/gi, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 4)
    .slice(0, 4);

  const priceMax = extractPriceMax(message);
  const recommend = looksLikeRecommend(message);

  // Nothing to search on — skip the block entirely.
  if (terms.length === 0 && priceMax == null && !recommend) return null;

  const filters = [eq(products.isActive, true)];

  if (terms.length > 0) {
    const kw = or(
      ...terms.flatMap((t) => [
        ilike(products.name, `%${t}%`),
        ilike(products.description, `%${t}%`),
        ilike(products.brand, `%${t}%`),
        ilike(products.color, `%${t}%`),
      ]),
    );
    if (kw) filters.push(kw);
  } else {
    // Pure recommendation / price query — only suggest items actually in stock.
    filters.push(eq(products.inStock, true));
  }

  if (priceMax != null) filters.push(lte(products.price, String(priceMax)));

  const rows = await db
    .select({
      name: products.name,
      price: products.price,
      stock: products.stock,
      inStock: products.inStock,
      slug: products.slug,
      brand: products.brand,
      color: products.color,
      category: categories.name,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(...filters))
    .orderBy(desc(products.featured), desc(products.inStock), asc(products.price))
    .limit(MAX_PRODUCTS);

  if (rows.length === 0) return null;

  const list = rows
    .map((p) => {
      const meta = [p.brand, p.color, p.category].filter(Boolean).join(', ');
      const avail = p.inStock && (p.stock ?? 0) > 0 ? 'в наличии' : 'нет в наличии';
      return `${p.name}${meta ? ` (${meta})` : ''} — ${fmtMoney(p.price)}, ${avail} (/products/${p.slug})`;
    })
    .join('\n');

  const cap = priceMax != null ? ` до ${fmtMoney(String(priceMax))}` : '';
  return `=== ПОДХОДЯЩИЕ ТОВАРЫ (по запросу клиента${cap}, реальные данные; предлагай со ссылками) ===\n${list}`;
}

/** Store facts every customer may ask about: contacts, categories, live promo codes. */
async function buildStoreContext(): Promise<string | null> {
  // Cache the rendered block briefly — it's identical for every customer.
  const cached = await cacheGet<string>(STORE_CTX_CACHE_KEY).catch(() => null);
  if (cached) return cached;

  const lines: string[] = [];

  // 1) Store name + real contacts from the settings table (admin-managed).
  try {
    const rows = await db
      .select({ key: settings.key, value: settings.value })
      .from(settings)
      .where(inArray(settings.key, ['store_name', 'store_contact_phone', 'store_contact_email']));
    const m: Record<string, string> = {};
    rows.forEach((r) => { if (r.value) m[r.key] = r.value; });

    if (m.store_name) lines.push(`Название магазина: ${m.store_name}`);
    const contacts: string[] = [];
    if (m.store_contact_phone) contacts.push(`телефон ${m.store_contact_phone}`);
    if (m.store_contact_email) contacts.push(`email ${m.store_contact_email}`);
    if (contacts.length) lines.push(`Контакты для связи: ${contacts.join(', ')}`);
  } catch {
    /* ignore — block is optional */
  }

  // 2) Active product categories.
  try {
    const cats = await db
      .select({ name: categories.name })
      .from(categories)
      .where(eq(categories.isActive, true))
      .limit(MAX_CATEGORIES);
    const names = cats.map((c) => c.name).filter(Boolean);
    if (names.length) lines.push(`Категории товаров: ${names.join(', ')}.`);
  } catch {
    /* ignore */
  }

  // 3) Live promo codes (active and not expired).
  try {
    const now = new Date();
    const rows = await db
      .select({
        code: coupons.code,
        discount: coupons.discount,
        type: coupons.type,
        minOrder: coupons.minOrder,
        expiresAt: coupons.expiresAt,
      })
      .from(coupons)
      .where(and(eq(coupons.active, true), or(isNull(coupons.expiresAt), gt(coupons.expiresAt, now))))
      .limit(MAX_COUPONS);

    if (rows.length) {
      const promos = rows.map((c) => {
        const amount = c.type === 'fixed' ? `−${fmtMoney(String(c.discount))}` : `−${c.discount}%`;
        const cond = c.minOrder ? ` (от ${fmtMoney(String(c.minOrder))})` : '';
        const till = c.expiresAt ? ` (до ${new Date(c.expiresAt).toLocaleDateString('ru-RU')})` : '';
        return `${c.code} — ${amount}${cond}${till}`;
      });
      lines.push(`Действующие промокоды: ${promos.join('; ')}.`);
    } else {
      lines.push('Действующих промокодов сейчас нет — не придумывай их.');
    }
  } catch {
    /* ignore */
  }

  if (lines.length === 0) return null;

  const block = `=== О МАГАЗИНЕ (реальные данные, используй вместо догадок) ===\n${lines.join('\n')}`;
  await cacheSet(STORE_CTX_CACHE_KEY, block, STORE_CTX_TTL_SEC).catch(() => {});
  return block;
}

/** Logged-in user's cart + wishlist, so the AI can act like a shopping assistant. */
async function buildShoppingContext(userId: string): Promise<string | null> {
  const lines: string[] = [];

  // Cart (with product name/price and the chosen size/color from the variant).
  try {
    const cart = await db
      .select({
        name: products.name,
        price: products.price,
        slug: products.slug,
        qty: cartItems.quantity,
        size: productVariants.size,
        color: productVariants.color,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .leftJoin(productVariants, eq(cartItems.variantId, productVariants.id))
      .where(eq(cartItems.userId, userId))
      .limit(20);

    if (cart.length) {
      const items = cart.map((c) => {
        const variant = [c.size ? `размер ${c.size}` : null, c.color].filter(Boolean).join(', ');
        return `${c.name}${variant ? ` (${variant})` : ''} ×${c.qty} — ${fmtMoney(c.price)} (/products/${c.slug})`;
      });
      const total = cart.reduce((s, c) => s + Number(c.price || 0) * (c.qty || 1), 0);
      lines.push(`В корзине (${cart.length}): ${items.join('; ')}. Примерная сумма: ${fmtMoney(String(total))}.`);
    }
  } catch {
    /* ignore — block is optional */
  }

  // Wishlist (favourites).
  try {
    const wl = await db
      .select({ name: products.name, slug: products.slug, price: products.price })
      .from(userWishlistItems)
      .innerJoin(products, eq(userWishlistItems.productId, products.id))
      .where(eq(userWishlistItems.userId, userId))
      .limit(10);

    if (wl.length) {
      const items = wl.map((w) => `${w.name} — ${fmtMoney(w.price)} (/products/${w.slug})`);
      lines.push(`В избранном (${wl.length}): ${items.join('; ')}.`);
    }
  } catch {
    /* ignore */
  }

  if (lines.length === 0) return null;
  return `=== КОРЗИНА И ИЗБРАННОЕ КЛИЕНТА (реальные данные) ===\n${lines.join('\n')}`;
}

/** Load and map recent conversation history into model messages. */
async function buildHistory(sessionId: string): Promise<AiMessage[]> {
  const rows = await db
    .select({ message: supportChatMessages.message, sender: supportChatMessages.sender, createdAt: supportChatMessages.createdAt })
    .from(supportChatMessages)
    .where(and(eq(supportChatMessages.sessionId, sessionId), isNotNull(supportChatMessages.message)))
    .orderBy(desc(supportChatMessages.createdAt))
    .limit(MAX_HISTORY_MESSAGES);

  // rows are newest-first; reverse to chronological order.
  return rows
    .reverse()
    .map((r) => ({
      role: r.sender === 'user' ? ('user' as const) : ('assistant' as const),
      content: r.message,
    }));
}

export interface GenerateAiReplyArgs {
  sessionId: string;
  userId: string | null;
  /** The latest user message (already persisted by the caller). */
  message: string;
}

export interface AiReplyResult {
  /** Visible reply text (escalation marker already stripped). */
  text: string;
  /** True when the chat should be handed off to a human operator. */
  escalate: boolean;
}

/**
 * Produce an AI reply, or null if no provider is active / generation failed.
 * Never throws — the caller falls back to findAutoResponse on null.
 */
export async function generateAiReply({ sessionId, userId, message }: GenerateAiReplyArgs): Promise<AiReplyResult | null> {
  try {
    const ctx = await getActiveAiContext();
    if (!ctx) return null;
    const { providers, systemPrompt: override, knowledgeBase } = ctx;

    const [history, storeCtx, shoppingCtx, ordersCtx, guestOrderCtx, productsCtx] = await Promise.all([
      buildHistory(sessionId),
      buildStoreContext().catch(() => null),
      userId ? buildShoppingContext(userId).catch(() => null) : Promise.resolve(null),
      userId ? buildOrdersContext(userId).catch(() => null) : Promise.resolve(null),
      userId ? Promise.resolve(null) : buildGuestOrderContext(message).catch(() => null),
      buildProductsContext(message).catch(() => null),
    ]);

    let systemContent = buildBaseSystemPrompt(knowledgeBase);
    if (override && override.trim()) systemContent += `\n\n=== ДОПОЛНИТЕЛЬНЫЕ ИНСТРУКЦИИ ===\n${override.trim()}`;
    if (storeCtx) systemContent += `\n\n${storeCtx}`;
    if (shoppingCtx) systemContent += `\n\n${shoppingCtx}`;
    if (ordersCtx) systemContent += `\n\n${ordersCtx}`;
    if (guestOrderCtx) systemContent += `\n\n${guestOrderCtx}`;
    if (productsCtx) systemContent += `\n\n${productsCtx}`;
    if (!userId && !guestOrderCtx) {
      systemContent +=
        '\n\nКлиент НЕ авторизован. Про личные заказы данных нет. Если спрашивает про свой заказ — попроси назвать номер заказа (формат ELV-XXXXXX-XXXX) ВМЕСТЕ с email, на который он оформлен, либо войти в личный кабинет, либо предложи оператора.';
    }

    const messages: AiMessage[] = [{ role: 'system', content: systemContent }, ...history];
    // History already includes the latest user message (persisted before this call);
    // guard against an empty/duplicate tail.
    if (history.length === 0 || history[history.length - 1].content !== message) {
      messages.push({ role: 'user', content: message });
    }

    // Try providers in order (active → other enabled → env) so a single backend
    // outage degrades to the next provider, not to the dumb keyword responder.
    let result: AiGenerateResult | null = null;
    for (const provider of providers) {
      try {
        result = await provider.generate(messages);
        break;
      } catch (e) {
        console.error('[AI REPLY] provider failed, trying next:', e instanceof Error ? e.message : e);
      }
    }
    if (!result) return null; // every provider failed → caller falls back to findAutoResponse

    let text = (result.text || '').trim();

    // Escalation is requested either by the model's sentinel or by an explicit
    // "I want a human" message from the customer (safety net).
    const escalate = ESCALATE_MARKER.test(text) || looksLikeHumanRequest(message);
    text = text.replace(ESCALATE_MARKER, '').trim();

    if (!text) {
      if (escalate) return { text: DEFAULT_HANDOFF, escalate: true };
      return null; // empty model output → caller falls back to findAutoResponse
    }
    return { text, escalate };
  } catch (e) {
    console.error('[AI REPLY] generation failed:', e instanceof Error ? e.message : e);
    return null;
  }
}
