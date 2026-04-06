import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supportChatMessages, supportChatSessions } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const fallbackResponses: Record<string, string> = {
  'доставка': "Мы предлагаем несколько вариантов доставки:\n\n Курьерская доставка - 1-3 дня (бесплатно от 5000₽)\n Почта России - 5-10 дней (от 300₽)\n Самовывоз из магазина - бесплатно",
  'возврат': "Вы можете вернуть товар в течение 14 дней с момента получения:\n\n Товар не должен быть в употреблении\n Сохранены бирки и упаковка\n Есть чек или подтверждение заказа",
  'оплата': "Доступные способы оплаты:\n\n Банковские карты (Visa, MasterCard, МИР)\n Наличные при получении\n Apple Pay / Google Pay",
  'размер': "Для подбора размера:\n\n Используйте таблицу размеров на странице товара\n Измерьте свои параметры\n Напишите нам - поможем с выбором!",
  'заказ': "Оформление заказа:\n\n1 Добавьте товары в корзину\n2 Перейдите в корзину и нажмите Оформить\n3 Заполните данные доставки\n4 Выберите способ оплаты",
  'скидка': "Актуальные акции:\n\n Скидка 10% на первый заказ (промокод: FIRST10)\n Бесплатная доставка от 5000₽\n Сезонные распродажи до -50%",
};

function findBestResponse(message: string): string | null {
  const lower = message.toLowerCase();
  for (const [keyword, response] of Object.entries(fallbackResponses)) {
    if (lower.includes(keyword)) return response;
  }
  return null;
}

async function saveMessage(sessionId: string, message: string, sender: 'user' | 'ai' | 'admin', aiModel: string | null) {
  try {
    const existing = await db.select().from(supportChatSessions).where(eq(supportChatSessions.sessionId, sessionId)).limit(1);
    if (existing.length === 0) {
      await db.insert(supportChatSessions).values({
        id: crypto.randomUUID(), sessionId, status: 'active', messageCount: 1,
        firstMessage: sender === 'user' ? message : null, lastMessageAt: new Date(),
        createdAt: new Date(), updatedAt: new Date(),
      });
    } else {
      await db.update(supportChatSessions).set({
        messageCount: (existing[0]?.messageCount || 0) + 1,
        lastMessageAt: new Date(), updatedAt: new Date(),
      }).where(eq(supportChatSessions.sessionId, sessionId));
    }
    await db.insert(supportChatMessages).values({
      id: crypto.randomUUID(), sessionId, message, sender, aiModel, createdAt: new Date(),
    });
  } catch (error: any) {
    console.error('[CHAT] DB save error:', error.message);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, sessionId } = await request.json();
    if (!message || !sessionId) {
      return NextResponse.json({ error: 'Message and sessionId required' }, { status: 400 });
    }

    await saveMessage(sessionId, message, 'user', null);

    // Check if admin has taken over
    try {
      const session = await db.select().from(supportChatSessions).where(eq(supportChatSessions.sessionId, sessionId)).limit(1);
      if (session[0]?.aiDisabled) {
        return NextResponse.json({ message: ' Ваш запрос передан оператору. Пожалуйста, подождите...', takenOver: true });
      }
    } catch {
      console.log('[CHAT] Could not check takeover status');
    }

    let aiMessage = '';
    let aiModel = 'fallback';

    // Try Vercel AI Gateway first
    const gatewayKey = process.env.VERCEL_AI_GATEWAY_KEY;
    if (gatewayKey) {
      try {
        const openai = createOpenAI({
          baseURL: 'https://ai-gateway.vercel.sh/v1',
          apiKey: gatewayKey,
        });

        const result = await generateText({
          model: openai('gpt-4o-mini'),
          system: 'Ты AI-ассистент магазина одежды ELEVATE. Отвечай кратко и дружелюбно на русском языке. Помогай с вопросами о доставке, возврате, размерах, оплате и товарах.',
          prompt: message,
          maxTokens: 300,
        });

        if (result.text) {
          aiMessage = result.text;
          aiModel = 'vercel-gateway-gpt4o-mini';
        }
      } catch (error: any) {
        console.log('[CHAT] Vercel AI Gateway error:', error.message);
      }
    }

    // Fallback to direct OpenAI
    if (!aiMessage) {
      const openaiKey = process.env.OPENAI_API_KEY;
      if (openaiKey) {
        try {
          const openai = createOpenAI({ apiKey: openaiKey });
          const result = await generateText({
            model: openai('gpt-4o-mini'),
            system: 'Ты AI-ассистент магазина одежды ELEVATE. Отвечай кратко на русском.',
            prompt: message,
            maxTokens: 300,
          });
          if (result.text) { aiMessage = result.text; aiModel = 'openai'; }
        } catch { console.log('[CHAT] OpenAI error'); }
      }
    }

    // Keyword fallback
    if (!aiMessage) {
      const fallback = findBestResponse(message);
      if (fallback) { aiMessage = fallback; aiModel = 'fallback'; }
      else {
        aiMessage = "Спасибо за вопрос! \n\nЯ могу помочь с:\n Доставкой\n Возвратом\n Оплатой\n Размерами\n Скидками\n\nИли свяжитесь:\n support@elevate.com\n +7 (800) 123-45-67";
        aiModel = 'fallback';
      }
    }

    await saveMessage(sessionId, aiMessage, 'ai', aiModel);
    return NextResponse.json({ message: aiMessage });

  } catch (error: any) {
    console.error('[CHAT] Error:', error.message);
    return NextResponse.json({ message: 'Извините, произошла ошибка. Свяжитесь с поддержкой: support@elevate.com' });
  }
}