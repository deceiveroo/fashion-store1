import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import {
  verifyTelegramAuth,
  isTelegramAuthFresh,
  upsertTelegramUser,
  pickTelegramFields,
} from '@/lib/telegram-auth';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'secret';

// Legacy/standalone endpoint: возвращает собственный JWT (для не-NextAuth клиентов).
// Основной путь входа через Telegram теперь — NextAuth-провайдер 'telegram' (см. lib/auth.ts),
// который создаёт полноценную сессию. Этот роут оставлен для обратной совместимости.
export async function POST(request: NextRequest) {
  try {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      return NextResponse.json({ error: 'Telegram bot not configured' }, { status: 500 });
    }

    const raw = await request.json();
    const data = pickTelegramFields(raw);

    if (!verifyTelegramAuth(data)) {
      return NextResponse.json({ error: 'Invalid Telegram data' }, { status: 401 });
    }

    if (!isTelegramAuthFresh(data.auth_date)) {
      return NextResponse.json({ error: 'Telegram data expired' }, { status: 401 });
    }

    const user = await upsertTelegramUser(data);

    const token = jwt.sign(
      { userId: user.id, email: user.email, telegramId: data.id },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return NextResponse.json({ success: true, token, userId: user.id });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[TELEGRAM AUTH] Error:', errorMessage);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
