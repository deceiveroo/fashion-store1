import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supportChatMessages, supportChatSessions, chatSessions, messages as messagesSchema } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { processAIResponse } from '@/lib/ai/support-processor';

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

async function callCloudflareAI(message: string): Promise<string | null> {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!token || !accountId) return null;

  try {
    const res = await fetch(
      'https://api.cloudflare.com/client/v4/accounts/' + accountId + '/ai/run/@cf/meta/llama-3.3-70b-instruct-fp8-fast',
      {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'Ты AI-ассистент магазина одежды ELEVATE. Отвечай кратко и дружелюбно на русском языке. Помогай с вопросами о доставке, возврате, размерах, оплате и товарах. Не отвечай на темы не связанные с магазином.',
            },
            { role: 'user', content: message },
          ],
          max_tokens: 300,
        }),
      }
    );

    if (!res.ok) {
      console.error('[CHAT] Cloudflare AI error:', res.status, await res.text());
      return null;
    }

    const data = await res.json();
    return data?.result?.response || null;
  } catch (error: any) {
    console.error('[CHAT] Cloudflare AI exception:', error.message);
    return null;
  }
}

// Helper function to get or create a numeric session ID for the chatSessions table
async function getOrCreateNumericSession(sessionId: string) {
  // Attempt to convert the string sessionId to a numeric ID
  // If it's already numeric, return it
  const numericId = parseInt(sessionId);
  if (!isNaN(numericId)) {
    return numericId;
  }

  // Otherwise, try to find a corresponding record in chatSessions table
  // If not found, create a new entry
  try {
    // Check if we have a mapping for this string session ID
    // Since the chatSessions table uses numeric IDs, we'll create a mapping
    // We'll use a hash of the string sessionId to generate a consistent numeric ID
    let hash = 0;
    for (let i = 0; i < sessionId.length; i++) {
      const char = sessionId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }

    // Ensure the hash is positive and within reasonable bounds
    const numericSessionId = Math.abs(hash) % 1000000000; // Limit to 9 digits

    // Check if this session already exists in the chatSessions table
    const existingSession = await db.select().from(chatSessions).where(eq(chatSessions.id, numericSessionId)).limit(1);
    
    if (existingSession.length === 0) {
      // Create a new session in the chatSessions table
      await db.insert(chatSessions).values({
        id: numericSessionId,
        status: 'ai', // Default to AI mode
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    return numericSessionId;
  } catch (error) {
    console.error('[CHAT] Error getting/creating numeric session:', error);
    // Return a default value in case of error
    return 1; // Default to 1 if anything goes wrong
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

    // Check if we need to transfer to operator
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('оператор') || lowerMessage.includes('человек') || lowerMessage.includes('помогите')) {
      // Get or create the numeric session ID
      const numericSessionId = await getOrCreateNumericSession(sessionId);
      
      // Update session to waiting status in the main chatSessions table
      await db
        .update(chatSessions)
        .set({ status: 'waiting', updatedAt: new Date() })
        .where(eq(chatSessions.id, numericSessionId));
        
      return NextResponse.json({ 
        message: 'Передаю ваш запрос специалисту. Ожидайте ответа в течение нескольких минут.', 
        takenOver: true 
      });
    }

    let aiMessage = '';
    let aiModel = 'fallback';

    // Try AI processor first
    try {
      // Get the numeric session ID for the AI processor
      const numericSessionId = await getOrCreateNumericSession(sessionId);
      
      const aiResponse = await processAIResponse(message, numericSessionId);
      if (aiResponse.text) {
        aiMessage = aiResponse.text;
        aiModel = 'gpt-4o-mini';
        
        // If AI indicates low confidence, suggest operator
        if (aiResponse.fallback) {
          // Update session to waiting status
          await db
            .update(chatSessions)
            .set({ status: 'waiting', updatedAt: new Date() })
            .where(eq(chatSessions.id, numericSessionId));
            
          aiMessage += '\n\nЕсли вам нужна помощь от специалиста, нажмите кнопку "Позвать оператора".';
        }
      }
    } catch (error) {
      console.error('[CHAT] AI Processor error:', error);
    }

    // If AI processor didn't work, try Cloudflare Workers AI
    if (!aiMessage) {
      const cfResponse = await callCloudflareAI(message);
      if (cfResponse) {
        aiMessage = cfResponse;
        aiModel = 'cloudflare-llama-3.3-70b-fast';
      }
    }

    // Keyword fallback if both AIs failed
    if (!aiMessage) {
      const fallback = findBestResponse(message);
      if (fallback) {
        aiMessage = fallback;
        aiModel = 'fallback';
      } else {
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