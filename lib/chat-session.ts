import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { supportChatSessions } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { getJwtSecretRaw } from '@/lib/jwt-secret';

// Goal: every chat write/read is bound to *exactly one* identity, server-side:
//   - logged-in users          → their userId (they always reuse the same support session row)
//   - anonymous visitors       → an HMAC-signed cookie value, set httpOnly so it can't be tampered with from JS
//
// The client may send a sessionId in the body, but we IGNORE it and trust only what we resolve here.

const COOKIE_NAME = 'chat_sid';
const COOKIE_TTL = 60 * 60 * 24 * 90; // 90 days

function sign(value: string): string {
  return crypto.createHmac('sha256', getJwtSecretRaw()).update(value).digest('hex').slice(0, 32);
}

function verifySigned(signed: string): string | null {
  // Format: <random>.<sig>
  const idx = signed.lastIndexOf('.');
  if (idx <= 0) return null;
  const value = signed.slice(0, idx);
  const sig = signed.slice(idx + 1);
  if (sign(value) !== sig) return null;
  return value;
}

function makeGuestSid(): string {
  const random = crypto.randomBytes(18).toString('hex'); // 36 chars
  return `${random}.${sign(random)}`;
}

export interface ResolvedChatSession {
  sessionId: string;       // string used as PK in support_chat_sessions.session_id
  userId: string | null;   // null for guests
  isNew: boolean;          // true if we just minted a fresh sessionId / cookie
  guestCookieToSet?: { value: string; maxAge: number };
}

export async function resolveChatSession(_req?: NextRequest): Promise<ResolvedChatSession> {
  const session = await auth();
  const userId = session?.user?.id || null;

  if (userId) {
    // Stable per-user session. We use a deterministic id derived from userId so we
    // never produce two rows for the same person across logins from different devices.
    const sessionId = `u_${userId}`;
    const [existing] = await db
      .select({ id: supportChatSessions.id })
      .from(supportChatSessions)
      .where(eq(supportChatSessions.sessionId, sessionId))
      .limit(1);
    return {
      sessionId,
      userId,
      isNew: !existing,
    };
  }

  // Anonymous: read signed cookie or mint a new one.
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  if (raw) {
    const verified = verifySigned(raw);
    if (verified) {
      return {
        sessionId: `g_${verified}`,
        userId: null,
        isNew: false,
      };
    }
    // Tampered or wrong-signature cookie — fall through to mint new.
  }

  const fresh = makeGuestSid();
  const valuePart = fresh.slice(0, fresh.lastIndexOf('.'));
  return {
    sessionId: `g_${valuePart}`,
    userId: null,
    isNew: true,
    guestCookieToSet: { value: fresh, maxAge: COOKIE_TTL },
  };
}

// Helper to apply the guest cookie on a NextResponse.
export function applyChatCookie(res: { cookies: { set: (name: string, value: string, opts?: any) => void } }, payload?: ResolvedChatSession['guestCookieToSet']) {
  if (!payload) return;
  res.cookies.set(COOKIE_NAME, payload.value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: payload.maxAge,
  });
}

export const CHAT_COOKIE_NAME = COOKIE_NAME;
