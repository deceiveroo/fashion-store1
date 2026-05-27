import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

// GET /api/user/2fa/status — quick "is 2FA enabled for me?" lookup.
export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [u] = await db.select({ twoFactorSecret: users.twoFactorSecret }).from(users).where(eq(users.id, user.id)).limit(1);
  return NextResponse.json({ enabled: Boolean(u?.twoFactorSecret) });
}
