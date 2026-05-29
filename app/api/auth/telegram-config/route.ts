import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/telegram-config — доступность Telegram-входа, определяемая в РАНТАЙМЕ.
 *
 * Зачем: раньше кнопка «Войти через Telegram» читала build-time переменную
 * NEXT_PUBLIC_TELEGRAM_BOT_ID. Такие переменные инлайнятся на этапе `next build`,
 * поэтому если их не добавить в Vercel ДО сборки — кнопка «молча» выключается на
 * проде (что и происходило: Google работал через runtime getProviders(), а Telegram
 * нет). Здесь мы читаем серверный TELEGRAM_BOT_TOKEN в рантайме и выводим bot_id из
 * него (формат токена: `<bot_id>:<hash>`), так что для работы достаточно одного
 * серверного секрета — NEXT_PUBLIC_* больше не обязателен.
 */
export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  // bot_id — числовой префикс токена бота. Допускаем явный override через env.
  const derivedBotId = token && token.includes(':') ? token.split(':')[0] : null;
  const botId = process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID || process.env.TELEGRAM_BOT_ID || derivedBotId || null;

  return NextResponse.json({
    enabled: Boolean(token && botId),
    botId,
  });
}
