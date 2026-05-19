import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const session = await auth();
  
  // Проверяем аутентификацию
  if (!session?.user) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  const userRole = (session.user as any).role;
  
  // Доступ только для admin, manager и support
  if (!['admin', 'manager', 'support'].includes(userRole)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/support/:path*',
};
