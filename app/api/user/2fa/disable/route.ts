import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { verifyTotp } from '@/lib/totp';

// POST /api/user/2fa/disable
// Body: { password: string, code?: string }
// Requires the user's current password AND, if 2FA is currently enabled, a valid TOTP code.
export async function POST(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const password = typeof body?.password === 'string' ? body.password : '';
  const code = typeof body?.code === 'string' ? body.code.trim() : '';

  if (!password) {
    return NextResponse.json({ error: 'Подтвердите паролем' }, { status: 400 });
  }

  const [u] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  if (!u || !u.password) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const ok = await bcrypt.compare(password, u.password);
  if (!ok) return NextResponse.json({ error: 'Неверный пароль' }, { status: 401 });

  if (!u.twoFactorSecret) {
    return NextResponse.json({ ok: true, message: '2FA уже отключена' });
  }

  if (!code || !verifyTotp(u.twoFactorSecret, code)) {
    return NextResponse.json({ error: 'Введите текущий код 2FA' }, { status: 400 });
  }

  await db.update(users).set({ twoFactorSecret: null, updatedAt: new Date() }).where(eq(users.id, user.id));
  return NextResponse.json({ ok: true });
}
