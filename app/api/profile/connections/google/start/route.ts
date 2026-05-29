import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { SignJWT } from 'jose';

export const dynamic = 'force-dynamic';

/**
 * GET /api/profile/connections/google/start — старт привязки Google к текущему аккаунту.
 * Это ОТДЕЛЬНЫЙ OAuth-флоу (не вход): возвращаемся в callback и пишем связь в accounts,
 * не переключая сессию и не меняя аватар. Требует, чтобы в Google Console был добавлен
 * redirect URI: {origin}/api/profile/connections/google/callback
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  const origin = new URL(req.url).origin;
  if (!session?.user?.id) {
    return NextResponse.redirect(`${origin}/auth/signin?redirect=/profile`);
  }
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(`${origin}/profile?link=google_unconfigured`);
  }

  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
  const state = await new SignJWT({ uid: session.user.id, mode: 'link-google' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('10m')
    .sign(secret);

  const redirectUri = `${origin}/api/profile/connections/google/callback`;
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('state', state);
  url.searchParams.set('prompt', 'select_account');
  url.searchParams.set('access_type', 'online');

  return NextResponse.redirect(url.toString());
}
