import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const path = req.nextUrl.pathname;
  
  // Allow access to login page
  if (path === '/admin/login') {
    return NextResponse.next();
  }
  
  // Check if user is authenticated
  if (!token) {
    // Redirect to login if not authenticated
    const url = req.nextUrl.clone();
    url.pathname = '/admin/login';
    return NextResponse.redirect(url);
  }
  
  // Check user role
  const role = token.role as string | undefined;
  if (!['admin', 'manager', 'support'].includes(role ?? '')) {
    // Return 401 if user doesn't have required role
    return NextResponse.rewrite(new URL('/401', req.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};