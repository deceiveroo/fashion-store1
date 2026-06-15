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
import { orders, orderItems, products, supportChatMessages } from '@/lib/schema';
import { eq, desc, and, isNotNull, or, ilike } from 'drizzle-orm';
import { AUTO_RESPONSES } from '@/lib/chat-auto-responses';
import { getActiveProvider, getSystemPromptOverride } from './registry';
import type { AiMessage } from './types';

const MAX_HISTORY_MESSAGES = 12; // cap context size / cost
const MAX_ORDERS = 5;
const MAX_PRODUCTS = 5;

function buildBaseSystemPrompt(): string {
  // Distill the curated FAQ into a compact policy block so the model repeats our
  // real terms instead of inventing them.
  const faqBlock = AUTO_RESPONSES.map((r) => `• [${r.category}] ${r.response.replace(/\n+/g, ' ')}`).join('\n');

  return [
    'Ты — вежливый ассистент службы поддержки интернет-магазина одежды ELEVATE.',
    'Отвечай кратко, дружелюбно и по делу, на языке клиента (обычно русский).',
    'Используй факты из базы знаний ниже как ИСТИНУ о правилах магазина (доставка, возвраты, оплата, размеры).',
    'Не выдумывай сроки, цены и условия, которых нет в базе знаний или в данных заказа.',
    'Если вопрос требует действий оператора-человека (сложный возврат, спор, индивидуальный случай) — скажи, что подключишь оператора.',
    'Не запрашивай и не раскрывай платёжные данные карт. Не обещай того, чего нет в правилах.',
    'Форматируй ответ в Markdown, можно с эмодзи, но без избыточности.',
    '',
    '=== БАЗА ЗНАНИЙ (правила магазина) ===',
    faqBlock,
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
    parts.push(
      `Заказ №${o.orderNumber ?? o.id.slice(0, 8)} от ${created}: статус «${o.status}», оплата «${o.paymentStatus ?? '—'}», ` +
        `доставка «${o.deliveryMethod ?? '—'}», сумма ${fmtMoney(o.total, o.currency ?? 'RUB')}. Товары: ${itemList || '—'}.`,
    );
  }

  return `=== ЗАКАЗЫ КЛИЕНТА (реальные данные, используй для ответов про заказы) ===\n${parts.join('\n')}`;
}

/** Naive product search by the user's message keywords. */
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
  ]);

  const rows = await db
    .select({
      name: products.name,
      price: products.price,
      stock: products.stock,
      inStock: products.inStock,
      slug: products.slug,
    })
    .from(products)
    .where(and(eq(products.isActive, true), or(...conditions)))
    .limit(MAX_PRODUCTS);

  if (rows.length === 0) return null;

  const list = rows
    .map(
      (p) =>
        `${p.name} — ${fmtMoney(p.price)}, ${p.inStock && (p.stock ?? 0) > 0 ? 'в наличии' : 'нет в наличии'} (/products/${p.slug})`,
    )
    .join('\n');

  return `=== ПОДХОДЯЩИЕ ТОВАРЫ (по запросу клиента) ===\n${list}`;
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

/**
 * Produce an AI reply, or null if no provider is active / generation failed.
 * Never throws — the caller falls back to findAutoResponse on null.
 */
export async function generateAiReply({ sessionId, userId, message }: GenerateAiReplyArgs): Promise<string | null> {
  try {
    const provider = await getActiveProvider();
    if (!provider) return null;

    const [override, history, ordersCtx, productsCtx] = await Promise.all([
      getSystemPromptOverride(),
      buildHistory(sessionId),
      userId ? buildOrdersContext(userId).catch(() => null) : Promise.resolve(null),
      buildProductsContext(message).catch(() => null),
    ]);

    let systemContent = buildBaseSystemPrompt();
    if (override && override.trim()) systemContent += `\n\n=== ДОПОЛНИТЕЛЬНЫЕ ИНСТРУКЦИИ ===\n${override.trim()}`;
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
    return result.text || null;
  } catch (e) {
    console.error('[AI REPLY] generation failed:', e instanceof Error ? e.message : e);
    return null;
  }
}
