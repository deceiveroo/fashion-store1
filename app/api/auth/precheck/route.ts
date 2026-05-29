// app/api/auth/precheck/route.ts
// Лёгкая предпроверка перед входом: валиден ли пароль и нужен ли код 2FA.
// Нужна потому, что NextAuth (Auth.js v5) намеренно скрывает причину отказа authorize
// (всегда 'CredentialsSignin'), и на клиенте нельзя отличить «неверный пароль» от
// «нужен код 2FA». Возвращаем минимум: { valid, twoFactorRequired }.
// Rate-limit накладывается middleware (/api/auth/* → 10 req/60s/IP).
import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ valid: false, twoFactorRequired: false }, { status: 400 });
    }

    const normalized = String(email).toLowerCase().trim();
    const [user] = await db
      .select({ password: users.password, twoFactorSecret: users.twoFactorSecret })
      .from(users)
      .where(sql`lower(${users.email}) = ${normalized}`)
      .limit(1);

    if (!user?.password) {
      return NextResponse.json({ valid: false, twoFactorRequired: false });
    }

    const ok = await compare(String(password), user.password);
    if (!ok) {
      return NextResponse.json({ valid: false, twoFactorRequired: false });
    }

    return NextResponse.json({ valid: true, twoFactorRequired: Boolean(user.twoFactorSecret) });
  } catch (error) {
    console.error('[AUTH] precheck error:', error);
    return NextResponse.json({ valid: false, twoFactorRequired: false }, { status: 500 });
  }
}
