import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const path = req.nextUrl.pathname;

  // Allow access to admin login page
  if (path === '/admin/login') {
    // If already authenticated as admin, redirect to dashboard
    if (token && ['admin', 'manager', 'support'].includes((token.role as string) ?? '')) {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    }
    return NextResponse.next();
  }

  // Not authenticated - redirect to admin login
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = '/admin/login';
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