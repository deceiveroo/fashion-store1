import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, verificationTokens } from '@/lib/schema';
import { and, eq, gt, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendEmail, renderResetPasswordEmail } from '@/lib/email';

// Two-step password reset:
//   1) POST { email }                 → always returns 200, generates token only if user exists, sends email.
//   2) POST { email, token, newPassword } → verifies token + updates password.

const TOKEN_TTL_MINUTES = 30;
const RESET_PURPOSE = 'password-reset';

function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function buildResetUrl(token: string, email: string): string {
  const base = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const u = new URL('/auth/reset-password', base);
  u.searchParams.set('token', token);
  u.searchParams.set('email', email);
  return u.toString();
}

function validatePassword(pwd: unknown): string | null {
  if (typeof pwd !== 'string') return 'Пароль должен быть строкой';
  if (pwd.length < 8) return 'Пароль должен содержать минимум 8 символов';
  if (!/[a-zA-Zа-яА-Я]/.test(pwd)) return 'Пароль должен содержать хотя бы одну букву';
  if (!/[0-9]/.test(pwd)) return 'Пароль должен содержать хотя бы одну цифру';
  return null;
}

async function requestReset(email: string) {
  const normalized = email.toLowerCase().trim();

  const userData = await db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    .where(sql`lower(${users.email}) = ${normalized}`)
    .limit(1);

  if (userData.length === 0) {
    // Don't reveal whether email exists. Always pretend success.
    return;
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expires = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);

  const identifier = `${RESET_PURPOSE}:${normalized}`;

  // Replace any existing reset tokens for this user.
  await db.delete(verificationTokens).where(eq(verificationTokens.identifier, identifier));

  await db.insert(verificationTokens).values({
    identifier,
    token: tokenHash,
    expires,
  });

  const resetUrl = buildResetUrl(rawToken, normalized);
  const { html, text } = renderResetPasswordEmail({
    name: userData[0].name,
    resetUrl,
    expiresMinutes: TOKEN_TTL_MINUTES,
  });

  await sendEmail({
    to: userData[0].email,
    subject: 'Сброс пароля — Fashion Store',
    html,
    text,
    tags: [{ name: 'category', value: 'password-reset' }],
  });
}

async function confirmReset(email: string, token: string, newPassword: string) {
  const normalized = email.toLowerCase().trim();
  const tokenHash = hashToken(token);
  const identifier = `${RESET_PURPOSE}:${normalized}`;

  const [row] = await db
    .select()
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, identifier),
        eq(verificationTokens.token, tokenHash),
        gt(verificationTokens.expires, new Date())
      )
    )
    .limit(1);

  if (!row) {
    return { ok: false, status: 400, message: 'Ссылка для сброса недействительна или просрочена' };
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await db
    .update(users)
    .set({ password: hashed, updatedAt: new Date() })
    .where(sql`lower(${users.email}) = ${normalized}`);

  // Single-use token: drop it after a successful change.
  await db.delete(verificationTokens).where(eq(verificationTokens.identifier, identifier));

  return { ok: true, status: 200, message: 'Пароль успешно изменён' };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, token, newPassword } = body || {};

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ message: 'Email обязателен' }, { status: 400 });
    }

    // Step 2: verification + change.
    if (token && newPassword) {
      const pwdError = validatePassword(newPassword);
      if (pwdError) {
        return NextResponse.json({ message: pwdError }, { status: 400 });
      }
      const result = await confirmReset(email, String(token), newPassword);
      return NextResponse.json({ message: result.message }, { status: result.status });
    }

    // Step 1: request — always 200 to avoid leaking which emails exist.
    await requestReset(email);
    return NextResponse.json({
      message: 'Если такой email зарегистрирован, мы отправили инструкции на почту',
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[reset-password] Error:', errorMessage);
    return NextResponse.json({ message: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
