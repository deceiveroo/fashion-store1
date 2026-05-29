import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { accounts, users } from '@/lib/schema';
import { and, eq, ne } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/profile/connections/google — отвязать Google.
 * Защита: нельзя отвязать единственный способ входа.
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
    .where(and(eq(accounts.userId, userId), ne(accounts.provider, 'google')));
  if (!hasRealPassword && otherLinks.length === 0) {
    return NextResponse.json(
      { error: 'Это ваш единственный способ входа. Сначала задайте пароль или привяжите другой аккаунт.' },
      { status: 400 }
    );
  }

  await db.delete(accounts).where(and(eq(accounts.userId, userId), eq(accounts.provider, 'google')));
  return NextResponse.json({ success: true });
}
