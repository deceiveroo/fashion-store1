import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { accounts, users } from '@/lib/schema';
import { and, eq, ne } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { verifyTelegramAuth, isTelegramAuthFresh, pickTelegramFields } from '@/lib/telegram-auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/profile/connections/telegram — привязать Telegram к ТЕКУЩЕМУ аккаунту.
 * Принимает payload Telegram Login Widget, проверяет подпись и сохраняет связь в accounts.
 * НЕ создаёт новый аккаунт и НЕ меняет аватар/профиль пользователя.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ error: 'Telegram не настроен' }, { status: 500 });
  }

  const raw = await req.json();
  const data = pickTelegramFields(raw);
  if (!data.id || !data.hash || !verifyTelegramAuth(data)) {
    return NextResponse.json({ error: 'Неверные данные Telegram' }, { status: 401 });
  }
  if (!isTelegramAuthFresh(data.auth_date)) {
    return NextResponse.json({ error: 'Данные Telegram устарели, попробуйте ещё раз' }, { status: 401 });
  }

  const telegramId = data.id;
  const label = data.username ? `@${data.username}` : [data.first_name, data.last_name].filter(Boolean).join(' ') || `id ${telegramId}`;

  // Этот Telegram уже привязан к ДРУГОМУ пользователю?
  const existing = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.provider, 'telegram'), eq(accounts.providerAccountId, telegramId)))
    .limit(1);
  if (existing.length > 0 && existing[0].userId !== userId) {
    return NextResponse.json({ error: 'Этот Telegram уже привязан к другому аккаунту' }, { status: 409 });
  }

  // Снимаем прежнюю Telegram-привязку этого пользователя (если была) и ставим новую.
  await db.delete(accounts).where(and(eq(accounts.userId, userId), eq(accounts.provider, 'telegram')));
  await db.insert(accounts).values({
    id: crypto.randomUUID(),
    userId,
    type: 'telegram',
    provider: 'telegram',
    providerAccountId: telegramId,
    session_state: label,
  });

  return NextResponse.json({ success: true, label });
}

/**
 * DELETE /api/profile/connections/telegram — отвязать Telegram.
 * Защита: нельзя отвязать единственный способ входа (нет пароля и нет других связей).
 */
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  const [user] = await db.select({ password: users.password, email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
  const hasRealPassword = Boolean(user?.password) && !String(user?.email || '').endsWith('@telegram.user');
  const otherLinks = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(and(eq(accounts.userId, userId), ne(accounts.provider, 'telegram')));
  if (!hasRealPassword && otherLinks.length === 0) {
    return NextResponse.json(
      { error: 'Это ваш единственный способ входа. Сначала задайте пароль или привяжите другой аккаунт.' },
      { status: 400 }
    );
  }

  await db.delete(accounts).where(and(eq(accounts.userId, userId), eq(accounts.provider, 'telegram')));
  return NextResponse.json({ success: true });
}
