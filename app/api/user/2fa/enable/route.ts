import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { verifyTotp } from '@/lib/totp';

// POST /api/user/2fa/enable
// Body: { secret: string, code: string }
// Verifies the code against the secret and, if valid, persists the secret to the user.
// The frontend obtained `secret` earlier from /api/user/2fa/setup.
export async function POST(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const secret = typeof body?.secret === 'string' ? body.secret.trim() : '';
  const code = typeof body?.code === 'string' ? body.code.trim() : '';
  if (!secret || !code) {
    return NextResponse.json({ error: 'Передайте secret и code' }, { status: 400 });
  }

  if (!verifyTotp(secret, code)) {
    return NextResponse.json({ error: 'Неверный код' }, { status: 400 });
  }

  const [u] = await db.select({ twoFactorSecret: users.twoFactorSecret }).from(users).where(eq(users.id, user.id)).limit(1);
  if (!u) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (u.twoFactorSecret) {
    return NextResponse.json({ error: '2FA уже включена' }, { status: 409 });
  }

  await db.update(users).set({ twoFactorSecret: secret, updatedAt: new Date() }).where(eq(users.id, user.id));
  return NextResponse.json({ ok: true });
}
