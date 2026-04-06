import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(req: NextRequest) {
  const isSecure = req.nextUrl.protocol === 'https:';

  // NextAuth uses different cookie names for HTTP vs HTTPS
  const cookieName = isSecure
    ? '__Secure-next-auth.session-token'
    : 'next-auth.session-token';

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName,
  });

  const path = req.nextUrl.pathname;

  // /admin/login - redirect to main signin
  if (path === '/admin/login') {
    if (token && ['admin', 'manager', 'support'].includes((token.role as string) ?? '')) {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    }
    const url = new URL('/auth/signin', req.url);
    url.searchParams.set('callbackUrl', '/admin/dashboard');
    return NextResponse.redirect(url);
  }

  // Not authenticated
  if (!token) {
    const url = new URL('/auth/signin', req.url);
    url.searchParams.set('callbackUrl', req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Wrong role
  const role = token.role as string | undefined;
  if (!['admin', 'manager', 'support'].includes(role ?? '')) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
