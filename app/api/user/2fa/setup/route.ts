import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { generateTotpSecret, buildOtpAuthUrl } from '@/lib/totp';

// POST /api/user/2fa/setup
// Generates a fresh TOTP secret for the current user.
// IMPORTANT: secret is NOT persisted yet — the user must confirm a code via /enable first.
// We return the secret + otpauth URL (for QR) once; the client is expected to keep it
// in memory while the user scans/enters the code.
export async function POST(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [u] = await db.select({ twoFactorSecret: users.twoFactorSecret, email: users.email }).from(users).where(eq(users.id, user.id)).limit(1);
  if (!u) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (u.twoFactorSecret) {
    return NextResponse.json({ error: '2FA уже включена. Сначала отключите её.' }, { status: 409 });
  }

  const secret = generateTotpSecret();
  const otpauth = buildOtpAuthUrl({
    issuer: process.env.TOTP_ISSUER || 'Fashion Store',
    account: u.email || user.id,
    secret,
  });

  return NextResponse.json({ secret, otpauth });
}
