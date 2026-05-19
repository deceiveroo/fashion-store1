import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supportChatSessions } from '@/lib/schema';
import { eq } from 'drizzle-orm';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID; // Your Telegram user ID

async function sendTelegramMessage(chatId: string, text: string, replyMarkup?: object) {
  if (!BOT_TOKEN) return null;
  const body: any = { chat_id: chatId, text, parse_mode: 'HTML' };
  if (replyMarkup) body.reply_markup = replyMarkup;

  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

// Called when user clicks "Позвать оператора" or creates order support request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, userMessage, userName, userEmail, title, message, priority, chatLink, orderId, orderNumber } = body;

    if (!BOT_TOKEN || !ADMIN_CHAT_ID) {
      return NextResponse.json({ error: 'Telegram not configured' }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fashion-store1-seven.vercel.app';

    // New format for order support
    if (title && message) {
      const isHighPriority = priority === 'high';
      const emoji = isHighPriority ? '🚨' : '🔔';
      const priorityText = isHighPriority ? '<b>СРОЧНО!</b>' : '';
      
      const text = [
        `${emoji} <b>${title}</b> ${priorityText}`,
        '',
        message,
        '',
        chatLink ? `🔗 <a href="${chatLink}">Открыть чат</a>` : '',
        orderId ? `📦 Заказ: #${orderNumber || orderId.slice(0, 8).toUpperCase()}` : '',
      ].filter(Boolean).join('\n');

      const keyboard = {
        inline_keyboard: [[
          { text: '✅ Ответить', url: chatLink || `${appUrl}/admin/support-chats` },
          { text: '📋 Все чаты', url: `${appUrl}/admin/support-chats` },
        ]],
      };

      await sendTelegramMessage(ADMIN_CHAT_ID, text, keyboard);
      return NextResponse.json({ success: true });
    }

    // Legacy format
    const text = [
      '🔔 <b>Новый запрос оператора!</b>',
      '',
      `👤 Пользователь: ${userName || userEmail || 'Гость'}`,
      userEmail ? `📧 Email: ${userEmail}` : '',
      `💬 Сообщение: <i>${userMessage}</i>`,
      '',
      `🔗 <a href="${appUrl}/admin/support-chats">Открыть чат в админке</a>`,
      `📋 Session ID: <code>${sessionId}</code>`,
    ].filter(Boolean).join('\n');

    const keyboard = {
      inline_keyboard: [[
        { text: '✅ Перехватить чат', callback_data: `takeover:${sessionId}` },
        { text: '👁 Открыть', url: `${appUrl}/admin/support-chats` },
      ]],
    };

    await sendTelegramMessage(ADMIN_CHAT_ID, text, keyboard);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[TELEGRAM NOTIFY]', errorMessage);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}
