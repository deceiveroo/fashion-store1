import { Bot, InlineKeyboard, webhookCallback } from 'grammy';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { chatSessions, messages, operators } from '@/lib/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { processAIResponse } from '@/lib/ai/support-processor';

// Initialize the bot with the token from environment variables
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is not set in environment variables');
}

const bot = new Bot(BOT_TOKEN);

// Helper functions
async function getOrCreateSession(tgId: number, username?: string) {
  let [session] = await db.select().from(chatSessions).where(eq(chatSessions.telegramUserId, tgId)).limit(1);
  if (!session || session.status === 'closed') {
    [session] = await db.insert(chatSessions).values({ 
      telegramUserId: tgId, 
      username, 
      status: 'ai' 
    }).returning();
  }
  return session;
}

async function updateSessionStatus(tgId: number, status: string) {
  await db.update(chatSessions)
    .set({ status, updatedAt: new Date() })
    .where(eq(chatSessions.telegramUserId, tgId));
}

async function notifyOperators(userId: number, username: string, chatId: number, lastMessage: string) {
  const onlineOps = await db.select().from(operators).where(eq(operators.status, 'online'));
  
  // Create notification message
  const notificationMessage = `🔔 Новый запрос #${userId} | 👤 @${username} | 💬 "${lastMessage.slice(0, 100)}${lastMessage.length > 100 ? '...' : ''}"`;
  
  for (const op of onlineOps) {
    try {
      await bot.api.sendMessage(
        op.telegramUserId, 
        notificationMessage,
        {
          reply_markup: new InlineKeyboard()
            .text('👨‍💼 Взять', `take_chat:${userId}`)
            .text('📋 В очередь', 'queue')
        }
      );
    } catch (error) {
      console.error(`Failed to notify operator ${op.telegramUserId}:`, error);
    }
  }
}

// Command handlers
bot.command('start', async (ctx) => {
  const session = await getOrCreateSession(ctx.from!.id, ctx.from!.username);
  
  await ctx.reply('👋 Привет! Я помощник магазина Fashion Store. Чем могу помочь?', {
    reply_markup: new InlineKeyboard()
      .text('🤖 Спросить бота', 'ai_mode')
      .text('👨‍💼 Позвать оператора', 'request_operator')
  });
});

bot.command('help', async (ctx) => {
  await ctx.reply(
    '📚 Доступные команды:\n' +
    '/start - начать диалог\n' +
    '/help - показать справку\n\n' +
    '💡 Вы также можете использовать кнопки для переключения режимов.'
  );
});

// Callback query handlers
bot.callbackQuery('ai_mode', async (ctx) => {
  await updateSessionStatus(ctx.from!.id, 'ai');
  await ctx.editMessageText('✅ Режим бота активен. Задавайте вопросы!');
});

bot.callbackQuery('request_operator', async (ctx) => {
  const userId = ctx.from!.id;
  await updateSessionStatus(userId, 'waiting');
  
  await ctx.editMessageText('⏳ Передаю специалисту. Обычно отвечаем за 2–5 минут.');
  
  // Notify operators
  await notifyOperators(userId, ctx.from!.username || 'anon', ctx.chat.id, 'Запрос оператора через кнопку');
});

bot.callbackQuery(/^take_chat:(\d+)$/, async (ctx) => {
  const targetUserId = Number(ctx.match![1]);
  const operatorId = ctx.from!.id;
  
  // Check if operator exists in DB, otherwise create
  let [op] = await db.select().from(operators).where(eq(operators.telegramUserId, operatorId));
  if (!op) {
    [op] = await db.insert(operators)
      .values({ 
        telegramUserId: operatorId, 
        name: ctx.from!.first_name, 
        status: 'online' 
      })
      .returning();
  }
  
  // Update session to human mode
  await db.update(chatSessions)
    .set({ 
      status: 'human', 
      operatorId: op?.id || null, 
      updatedAt: new Date() 
    })
    .where(eq(chatSessions.telegramUserId, targetUserId));
    
  await ctx.answerCallbackQuery('✅ Диалог взят');
  await bot.api.sendMessage(targetUserId, '👋 Оператор подключился. Пишите, отвечу в реальном времени.');
});

bot.callbackQuery('queue', async (ctx) => {
  await ctx.answerCallbackQuery('✅ Запрос добавлен в очередь');
});

// Message handlers
bot.on('message:text', async (ctx) => {
  const text = ctx.message.text;
  const userId = ctx.from!.id;
  const username = ctx.from!.username;
  
  // Get or create session
  const session = await getOrCreateSession(userId, username);
  
  // Save user message
  await db.insert(messages).values({ 
    sessionId: session.id, 
    role: 'user', 
    content: text 
  });

  if (session.status === 'human') {
    // Forward to operator
    if (session.operatorId) {
      const [op] = await db.select().from(operators).where(eq(operators.id, session.operatorId));
      if (op) {
        try {
          await bot.api.sendMessage(
            op.telegramUserId, 
            `💬 Клиент #${session.id} (@${username || 'unknown'}):\n${text}`, 
            {
              reply_parameters: { message_id: ctx.message.message_id }
            }
          );
        } catch (error) {
          console.error('Failed to forward message to operator:', error);
        }
      }
    }
  } 
  else if (session.status === 'ai') {
    // Process with AI
    try {
      const aiResult = await processAIResponse(text, session.id);
      
      await ctx.reply(aiResult.text);
      
      // Save AI response
      await db.insert(messages).values({ 
        sessionId: session.id, 
        role: 'ai', 
        content: aiResult.text, 
        meta: { confidence: aiResult.confidence, fallback: aiResult.fallback } 
      });

      // Auto-fallback if confidence is low
      if (aiResult.fallback) {
        await updateSessionStatus(userId, 'waiting');
        await notifyOperators(userId, username || 'anon', ctx.chat.id, text);
      }
    } catch (error) {
      console.error('AI processing error:', error);
      await ctx.reply('Произошла ошибка при обработке вашего запроса. Попробуйте снова или вызовите оператора.');
    }
  }
  else if (session.status === 'waiting') {
    await ctx.reply('⏳ Ваш запрос уже в очереди. Ожидайте подключения оператора.');
  }
});

// Operator reply handler (when operator replies to forwarded message)
bot.on('message:text').filter(
  (ctx) => ctx.message.reply_to_message?.from?.is_bot === true, 
  async (ctx) => {
    // This handles operator replies to forwarded user messages
    const originalMsg = ctx.message.reply_to_message;
    if (!originalMsg?.text?.includes('Клиент #')) return;
    
    // Extract user ID from the forwarded message
    const match = originalMsg.text?.match(/Клиент #(\d+)/);
    if (!match) return;
    
    const targetUserIdStr = match[1];
    const targetUserId = parseInt(targetUserIdStr, 10);
    
    if (isNaN(targetUserId)) return;
    
    // Find the active session for this user
    const [session] = await db.select().from(chatSessions)
      .where(
        and(
          eq(chatSessions.telegramUserId, targetUserId), 
          eq(chatSessions.status, 'human')
        )
      )
      .limit(1);
    
    if (session && ctx.message.text) {
      try {
        await bot.api.sendMessage(session.telegramUserId, ctx.message.text);
        await db.insert(messages).values({ 
          sessionId: session.id, 
          role: 'operator', 
          content: ctx.message.text 
        });
      } catch (error) {
        console.error('Failed to send message to user:', error);
      }
    }
  }
);

// Export the webhook handler
export const POST = webhookCallback(bot, 'std/http');

// Additional helper functions for keeping the bot alive
export async function keepAlive() {
  try {
    await bot.api.getMe();
    console.log('Telegram bot is alive and connected');
    return true;
  } catch (error) {
    console.error('Telegram bot connection failed:', error);
    return false;
  }
}