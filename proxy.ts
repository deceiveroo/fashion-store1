import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const path = req.nextUrl.pathname;

  // Allow access to admin login page (keep for backward compat)
  if (path === '/admin/login') {
    // If already authenticated as admin, redirect to dashboard
    if (token && ['admin', 'manager', 'support'].includes((token.role as string) ?? '')) {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    }
    // Otherwise redirect to main signin
    const url = new URL('/auth/signin', req.url);
    url.searchParams.set('callbackUrl', '/admin/dashboard');
    return NextResponse.redirect(url);
  }

  // Not authenticated - redirect to main signin with callback to admin
  if (!token) {
    const url = new URL('/auth/signin', req.url);
    url.searchParams.set('callbackUrl', req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated but wrong role
  const role = token.role as string | undefined;
  if (!['admin', 'manager', 'support'].includes(role ?? '')) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};