import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supportChatMessages, supportChatSessions } from '@/lib/schema';
import { eq, asc } from 'drizzle-orm';

const KB: Record<string, string> = {
  'доставка': ' Доставка:\n Курьер 1-3 дня (бесплатно от 5000₽)\n Почта 5-10 дней (от 300₽)\n Самовывоз  бесплатно',
  'возврат': ' Возврат в течение 14 дней:\n Товар без следов использования\n Сохранены бирки и упаковка\n Есть чек или подтверждение',
  'оплата': ' Оплата:\n Карты Visa/MasterCard/МИР\n Наличные при получении\n Apple Pay / Google Pay',
  'размер': ' Размеры:\n Таблица размеров на странице товара\n Напишите нам  поможем с выбором!',
  'заказ': ' Заказ:\n1. Добавьте в корзину\n2. Оформите заказ\n3. Укажите адрес\n4. Выберите оплату',
  'скидка': ' Скидки:\n -10% на первый заказ (FIRST10)\n Бесплатная доставка от 5000₽\n Сезонные распродажи до -50%',
};

function getAIResponse(msg: string): string {
  const lower = msg.toLowerCase();
  for (const [k, v] of Object.entries(KB)) {
    if (lower.includes(k)) return v;
  }
  return ' Я помогу с:\n Доставкой\n Возвратом\n Оплатой\n Размерами\n\nИли: support@elevate.com / +7 (800) 123-45-67';
}

async function upsertSession(sessionId: string, firstMsg?: string) {
  const existing = await db.select().from(supportChatSessions)
    .where(eq(supportChatSessions.sessionId, sessionId)).limit(1);
  if (existing.length === 0) {
    await db.insert(supportChatSessions).values({
      id: crypto.randomUUID(), sessionId, status: 'active',
      messageCount: 1, firstMessage: firstMsg || null,
      lastMessageAt: new Date(), createdAt: new Date(), updatedAt: new Date(),
    });
  } else {
    await db.update(supportChatSessions).set({
      messageCount: (existing[0].messageCount || 0) + 1,
      lastMessageAt: new Date(), updatedAt: new Date(),
    }).where(eq(supportChatSessions.sessionId, sessionId));
  }
}

async function saveMsg(sessionId: string, message: string, sender: 'user' | 'ai' | 'admin', aiModel?: string) {
  await db.insert(supportChatMessages).values({
    id: crypto.randomUUID(), sessionId, message, sender,
    aiModel: aiModel || null, createdAt: new Date(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const { message, sessionId } = await req.json();
    if (!message?.trim() || !sessionId) {
      return NextResponse.json({ error: 'message and sessionId required' }, { status: 400 });
    }

    await upsertSession(sessionId, message);
    await saveMsg(sessionId, message, 'user');

    const [session] = await db.select().from(supportChatSessions)
      .where(eq(supportChatSessions.sessionId, sessionId)).limit(1);

    if (session?.aiDisabled) {
      return NextResponse.json({ takenOver: true, message: ' Оператор подключён. Ожидайте ответа...' });
    }

    let reply = '';
    const cfToken = process.env.CLOUDFLARE_API_TOKEN;
    const cfAccount = process.env.CLOUDFLARE_ACCOUNT_ID;

    if (cfToken && cfAccount) {
      try {
        const r = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${cfAccount}/ai/run/@cf/meta/llama-3.3-70b-instruct-fp8-fast`,
          {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${cfToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [
                { role: 'system', content: 'Ты помощник магазина одежды ELEVATE. Отвечай кратко и по-русски. Помогай с доставкой, возвратом, размерами, оплатой.' },
                { role: 'user', content: message },
              ],
              max_tokens: 200,
            }),
          }
        );
        if (r.ok) {
          const d = await r.json();
          reply = d?.result?.response || '';
        }
      } catch {}
    }

    if (!reply) reply = getAIResponse(message);

    await saveMsg(sessionId, reply, 'ai', 'cf-llama');
    return NextResponse.json({ message: reply });

  } catch (e: any) {
    console.error('[CHAT POST]', e.message);
    return NextResponse.json({ message: 'Ошибка. Попробуйте позже.' });
  }
}

export async function GET(req: NextRequest) {
  try {
    const sessionId = new URL(req.url).searchParams.get('sessionId');
    if (!sessionId) return NextResponse.json({ messages: [] });
    const messages = await db.select().from(supportChatMessages)
      .where(eq(supportChatMessages.sessionId, sessionId))
      .orderBy(asc(supportChatMessages.createdAt));
    return NextResponse.json({ messages });
  } catch {
    return NextResponse.json({ messages: [] });
  }
}