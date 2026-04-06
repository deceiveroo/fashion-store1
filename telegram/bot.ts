import { Telegraf } from 'telegraf';
import { db } from '@/lib/db';
import { supportChatSessions, supportChatMessages } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';

// Initialize bot with token from environment
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// Start command handler
bot.start((ctx) => {
  ctx.reply('Добро пожаловать в службу поддержки Fashion Store!');
});

// Handle callback queries (like takeover button)
bot.on('callback_query', async (ctx) => {
  try {
    const callbackData = ctx.callbackQuery?.data;
    if (!callbackData) return;

    if (callbackData.startsWith('takeover:')) {
      const sessionId = callbackData.split(':')[1];
      if (!sessionId) return;

      // Update session to assign this admin
      await db
        .update(supportChatSessions)
        .set({
          takenOverBy: ctx.from?.id.toString(),
          takenOverAt: new Date(),
          status: 'active',
        })
        .where(eq(supportChatSessions.sessionId, sessionId));

      // Send confirmation message
      ctx.reply(`Вы взяли сессию ${sessionId} в работу. Для ответа пользователю используйте команду /reply_${sessionId} ваше сообщение`);
    } else if (callbackData.startsWith('resolve:')) {
      const sessionId = callbackData.split(':')[1];
      if (!sessionId) return;

      // Mark session as resolved
      await db
        .update(supportChatSessions)
        .set({
          status: 'resolved',
          resolvedAt: new Date(),
          resolvedBy: ctx.from?.id.toString(),
        })
        .where(eq(supportChatSessions.sessionId, sessionId));

      ctx.reply(`Сессия ${sessionId} отмечена как решенная.`);
    }
  } catch (error) {
    console.error('Error handling callback query:', error);
    ctx.reply('Произошла ошибка при обработке запроса.');
  }
});

// Command to reply to a specific session
bot.command(/^reply_(.+)$/, async (ctx) => {
  try {
    // Extract session ID and message from command
    const command = ctx.message?.text || '';
    const match = command.match(/\/reply_(\w+)\s+(.+)/);
    
    if (!match) {
      ctx.reply('Неправильный формат команды. Используйте: /reply_SESSIONID ваше сообщение');
      return;
    }

    const [, sessionId, message] = match;
    if (!sessionId || !message) {
      ctx.reply('Неправильный формат команды. Используйте: /reply_SESSIONID ваше сообщение');
      return;
    }

    // Get session details
    const session = await db
      .select()
      .from(supportChatSessions)
      .where(eq(supportChatSessions.sessionId, sessionId))
      .limit(1);

    if (session.length === 0) {
      ctx.reply(`Сессия ${sessionId} не найдена.`);
      return;
    }

    // Create admin message record
    await db.insert(supportChatMessages).values({
      id: crypto.randomUUID(),
      sessionId,
      message,
      sender: 'admin',
      createdAt: new Date(),
    });

    // Here you would send the message to the user via your frontend or another channel
    // For now, we'll just confirm internally that the message was recorded
    ctx.reply(`Сообщение для сессии ${sessionId} отправлено:`);
    ctx.reply(message);
  } catch (error) {
    console.error('Error replying to session:', error);
    ctx.reply('Произошла ошибка при отправке сообщения.');
  }
});

// Launch the bot
export default bot;