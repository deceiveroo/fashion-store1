import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { accounts } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/profile/connections — статус привязанных аккаунтов текущего пользователя.
 * Связи хранятся в таблице accounts (provider = 'google' | 'telegram'); аватар/профиль
 * пользователя НЕ трогаются. session_state используем как человекочитаемую подпись
 * (email для Google, @username/имя для Telegram).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rows = await db.select().from(accounts).where(eq(accounts.userId, session.user.id));
  const google = rows.find((r) => r.provider === 'google');
  const telegram = rows.find((r) => r.provider === 'telegram');

  return NextResponse.json({
    google: google
      ? { connected: true, label: google.session_state || google.providerAccountId }
      : { connected: false },
    telegram: telegram
      ? { connected: true, label: telegram.session_state || telegram.providerAccountId }
      : { connected: false },
  });
}
