import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { accounts } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

/**
 * GET /api/profile/connections/google/callback — приём ответа Google и сохранение связи.
 * Меняет ТОЛЬКО таблицу accounts; users/userProfiles (аватар, имя) не трогаются.
 */
export async function GET(req: NextRequest) {
  const origin = new URL(req.url).origin;
  const back = (status: string) => NextResponse.redirect(`${origin}/profile?link=${status}`);

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    if (url.searchParams.get('error') || !code || !state) return back('google_cancelled');

    // Проверяем state → достаём userId текущего пользователя.
    let userId: string;
    try {
      const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
      const { payload } = await jwtVerify(state, secret);
      if (payload.mode !== 'link-google' || !payload.uid) return back('google_error');
      userId = String(payload.uid);
    } catch {
      return back('google_error');
    }

    const redirectUri = `${origin}/api/profile/connections/google/callback`;
    // Обмен кода на токены.
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenRes.ok) return back('google_error');
    const tokens = await tokenRes.json();

    // Получаем профиль Google (sub + email).
    const infoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!infoRes.ok) return back('google_error');
    const info = await infoRes.json();
    const sub = String(info.sub || '');
    const email = info.email ? String(info.email) : null;
    if (!sub) return back('google_error');

    // Этот Google уже привязан к другому аккаунту?
    const existing = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.provider, 'google'), eq(accounts.providerAccountId, sub)))
      .limit(1);
    if (existing.length > 0 && existing[0].userId !== userId) {
      return back('google_taken');
    }

    await db.delete(accounts).where(and(eq(accounts.userId, userId), eq(accounts.provider, 'google')));
    await db.insert(accounts).values({
      id: crypto.randomUUID(),
      userId,
      type: 'oauth',
      provider: 'google',
      providerAccountId: sub,
      access_token: tokens.access_token ?? null,
      id_token: tokens.id_token ?? null,
      scope: tokens.scope ?? null,
      token_type: tokens.token_type ?? null,
      session_state: email,
    });

    return back('google_ok');
  } catch (error) {
    console.error('[connections/google/callback] error:', error);
    return back('google_error');
  }
}
