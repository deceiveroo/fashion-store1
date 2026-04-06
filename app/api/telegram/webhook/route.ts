import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supportChatSessions, supportChatMessages } from '@/lib/schema';
import { eq } from 'drizzle-orm';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

async function sendTelegramMessage(chatId: string, text: string) {
  if (!BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
}

async function answerCallback(callbackQueryId: string, text: string) {
  if (!BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  });
}

export async function POST(request: NextRequest) {
  try {
    const update = await request.json();

    // Handle callback query (button press)
    if (update.callback_query) {
      const { id, data, from } = update.callback_query;
      
      if (data?.startsWith('takeover:')) {
        const sessionId = data.replace('takeover:', '');
        
        // Take over the chat
        await db.update(supportChatSessions).set({
          aiDisabled: true,
          takenOverAt: new Date(),
          updatedAt: new Date(),
        }).where(eq(supportChatSessions.sessionId, sessionId));

        await answerCallback(id, '✅ Чат перехвачен! AI отключён.');
        await sendTelegramMessage(
          from.id.toString(),
          `✅ Вы перехватили чат <code>${sessionId}</code>\n\nТеперь отвечайте командой:\n<code>/reply ${sessionId} ваш ответ</code>`
        );
      }
      return NextResponse.json({ ok: true });
    }

    // Handle text message from admin
    if (update.message) {
      const { text, from, chat } = update.message;
      
      // Only process messages from admin
      if (ADMIN_CHAT_ID && chat.id.toString() !== ADMIN_CHAT_ID) {
        return NextResponse.json({ ok: true });
      }

      // /reply sessionId message
      if (text?.startsWith('/reply ')) {
        const parts = text.substring(7).split(' ');
        const sessionId = parts[0];
        const message = parts.slice(1).join(' ');

        if (!sessionId || !message) {
          await sendTelegramMessage(chat.id.toString(), '❌ Формат: /reply SESSION_ID ваш ответ');
          return NextResponse.json({ ok: true });
        }

        // Save admin message to DB
        await db.insert(supportChatMessages).values({
          id: crypto.randomUUID(),
          sessionId,
          message,
          sender: 'admin',
          aiModel: null,
          createdAt: new Date(),
        });

        // Update session
        const session = await db.select().from(supportChatSessions)
          .where(eq(supportChatSessions.sessionId, sessionId)).limit(1);
        
        if (session.length > 0) {
          await db.update(supportChatSessions).set({
            messageCount: (session[0].messageCount || 0) + 1,
            lastMessageAt: new Date(),
            updatedAt: new Date(),
          }).where(eq(supportChatSessions.sessionId, sessionId));
        }

        await sendTelegramMessage(chat.id.toString(), `✅ Сообщение отправлено пользователю`);
      }

      // /status - show active chats
      if (text === '/status') {
        const activeSessions = await db.select().from(supportChatSessions)
          .where(eq(supportChatSessions.status, 'active'));
        
        const msg = activeSessions.length === 0
          ? '📭 Нет активных чатов'
          : `📬 Активных чатов: ${activeSessions.length}\n\n` +
            activeSessions.map(s => 
              `• ${s.userEmail || 'Гость'} — ${s.messageCount || 0} сообщ.\n  ID: <code>${s.sessionId}</code>`
            ).join('\n\n');
        
        await sendTelegramMessage(chat.id.toString(), msg);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[TELEGRAM WEBHOOK]', error.message);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}

// Register webhook endpoint
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'register') {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fashion-store1-seven.vercel.app';
    const webhookUrl = `${appUrl}/api/telegram/webhook`;
    
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl }),
    });
    const data = await res.json();
    return NextResponse.json(data);
  }

  if (action === 'info') {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
    const data = await res.json();
    return NextResponse.json(data);
  }

  return NextResponse.json({ message: 'Use ?action=register or ?action=info' });
}
