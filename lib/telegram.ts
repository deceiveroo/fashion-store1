// Fire-and-forget Telegram alert to operators when a chat needs a human.
//
// Env-gated: silently no-ops if TELEGRAM_BOT_TOKEN / TELEGRAM_ADMIN_CHAT_ID are
// not set, so the AI escalation path never fails because of missing Telegram
// config. Mirrors the message format used by app/api/telegram/notify.

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export interface OperatorAlertArgs {
  sessionId: string;
  userName?: string | null;
  userEmail?: string | null;
  /** The customer message that triggered the hand-off. */
  lastMessage?: string | null;
  /** Short human-readable reason, e.g. "ИИ передал диалог оператору". */
  reason?: string;
}

/**
 * Notify operators (via Telegram) that a support chat needs a human.
 * Never throws — callers can fire-and-forget.
 */
export async function sendOperatorAlert(args: OperatorAlertArgs): Promise<void> {
  if (!BOT_TOKEN || !ADMIN_CHAT_ID) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://e1evate.vercel.app';
  const chatLink = `${appUrl}/admin/support-chats`;

  const text = [
    '🔔 <b>Чату нужен оператор</b>',
    args.reason ? `<i>${escapeHtml(args.reason)}</i>` : '',
    '',
    `👤 ${escapeHtml(args.userName || args.userEmail || 'Гость')}`,
    args.lastMessage ? `💬 ${escapeHtml(args.lastMessage.slice(0, 300))}` : '',
    '',
    `🔗 <a href="${chatLink}">Открыть чаты</a>`,
  ]
    .filter(Boolean)
    .join('\n');

  const keyboard = {
    inline_keyboard: [
      [
        { text: '✅ Перехватить', callback_data: `takeover:${args.sessionId}` },
        { text: '👁 Открыть', url: chatLink },
      ],
    ],
  };

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT_ID,
        text,
        parse_mode: 'HTML',
        reply_markup: keyboard,
      }),
    });
  } catch (e) {
    console.error('[TELEGRAM ALERT] failed:', e instanceof Error ? e.message : e);
  }
}
