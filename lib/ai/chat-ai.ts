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
import { orders, orderItems, products, categories, coupons, settings, supportChatMessages } from '@/lib/schema';
import { eq, desc, and, isNotNull, isNull, or, ilike, gt, inArray, sql } from 'drizzle-orm';
import { AUTO_RESPONSES } from '@/lib/chat-auto-responses';
import { cacheGet, cacheSet } from '@/lib/redis';
import { getActiveAiContext } from './registry';
import type { AiMessage } from './types';

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

/** Compact summary of the user's recent orders for grounding. */
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

  const parts: string[] = [];
  for (const o of rows) {
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

    parts.push(
      `Заказ №${o.orderNumber ?? o.id.slice(0, 8)} от ${created}: статус «${statusRu}», оплата «${payRu}», ` +
        `доставка «${o.deliveryMethod ?? '—'}»${city}, сумма ${fmtMoney(o.total, o.currency ?? 'RUB')}. Товары: ${itemList || '—'}.`,
    );
  }

  const header =
    totalCount > rows.length
      ? `=== ЗАКАЗЫ КЛИЕНТА (всего заказов: ${totalCount}, показаны последние ${rows.length}; реальные данные, используй для ответов про заказы) ===`
      : '=== ЗАКАЗЫ КЛИЕНТА (реальные данные, используй для ответов про заказы) ===';
  return `${header}\n${parts.join('\n')}`;
}

/** Naive product search by the user's message keywords (name/description/brand/color). */
async function buildProductsContext(message: string): Promise<string | null> {
  const terms = message
    .toLowerCase()
    .replace(/[^a-zа-я0-9\s]/gi, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 4)
    .slice(0, 4);

  if (terms.length === 0) return null;

  const conditions = terms.flatMap((t) => [
    ilike(products.name, `%${t}%`),
    ilike(products.description, `%${t}%`),
    ilike(products.brand, `%${t}%`),
    ilike(products.color, `%${t}%`),
  ]);

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
    .where(and(eq(products.isActive, true), or(...conditions)))
    .limit(MAX_PRODUCTS);

  if (rows.length === 0) return null;

  const list = rows
    .map((p) => {
      const meta = [p.brand, p.color, p.category].filter(Boolean).join(', ');
      const avail = p.inStock && (p.stock ?? 0) > 0 ? 'в наличии' : 'нет в наличии';
      return `${p.name}${meta ? ` (${meta})` : ''} — ${fmtMoney(p.price)}, ${avail} (/products/${p.slug})`;
    })
    .join('\n');

  return `=== ПОДХОДЯЩИЕ ТОВАРЫ (по запросу клиента, реальные данные) ===\n${list}`;
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
    const { provider, systemPrompt: override, knowledgeBase } = ctx;

    const [history, storeCtx, ordersCtx, productsCtx] = await Promise.all([
      buildHistory(sessionId),
      buildStoreContext().catch(() => null),
      userId ? buildOrdersContext(userId).catch(() => null) : Promise.resolve(null),
      buildProductsContext(message).catch(() => null),
    ]);

    let systemContent = buildBaseSystemPrompt(knowledgeBase);
    if (override && override.trim()) systemContent += `\n\n=== ДОПОЛНИТЕЛЬНЫЕ ИНСТРУКЦИИ ===\n${override.trim()}`;
    if (storeCtx) systemContent += `\n\n${storeCtx}`;
    if (ordersCtx) systemContent += `\n\n${ordersCtx}`;
    if (productsCtx) systemContent += `\n\n${productsCtx}`;
    if (!userId) {
      systemContent +=
        '\n\nКлиент НЕ авторизован — данных о его заказах нет. Если спрашивает про свой заказ, попроси войти в личный кабинет или назвать номер заказа, либо предложи подключить оператора.';
    }

    const messages: AiMessage[] = [{ role: 'system', content: systemContent }, ...history];
    // History already includes the latest user message (persisted before this call);
    // guard against an empty/duplicate tail.
    if (history.length === 0 || history[history.length - 1].content !== message) {
      messages.push({ role: 'user', content: message });
    }

    const result = await provider.generate(messages);
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
