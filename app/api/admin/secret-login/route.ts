import { NextResponse } from 'next/server';
import { auth, signIn } from '@/lib/auth';

// GET /api/admin/secret-login - Secret login endpoint
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secretKey = searchParams.get('key');
    const redirectTo = searchParams.get('redirect') || '/admin/dashboard';

    // Проверка секретного ключа (хранится только в .env)
    const expectedKey = process.env.ADMIN_SECRET_KEY;
    
    if (!expectedKey) {
      console.error('[SECRET LOGIN] ADMIN_SECRET_KEY not set in environment');
      return NextResponse.redirect(new URL('/auth/signin?error=ConfigurationError', request.url));
    }

    if (!secretKey || secretKey !== expectedKey) {
      console.warn('[SECRET LOGIN] Invalid or missing secret key');
      return NextResponse.redirect(new URL('/auth/signin?error=InvalidSecretKey', request.url));
    }

    // Проверяем текущую сессию
    const session = await auth();
    
    if (session?.user && ['admin', 'manager'].includes(session.user.role as string)) {
      // Уже авторизован как админ - просто редиректим
      console.log('[SECRET LOGIN] User already authenticated as admin');
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }

    // Автоматический вход с тестовым админом
    // В production лучше использовать реальные credentials из базы
    console.log('[SECRET LOGIN] Attempting auto-login with secret key');
    
    // Создаем временную сессию через signIn
    const result = await signIn('credentials', {
      email: process.env.ADMIN_AUTO_EMAIL || 'admin@example.com',
      password: process.env.ADMIN_AUTO_PASSWORD || '',
      redirect: false,
    });

    if (result?.error) {
      console.error('[SECRET LOGIN] Auto-login failed:', result.error);
      return NextResponse.redirect(new URL(`/auth/signin?error=${encodeURIComponent(result.error)}`, request.url));
    }

    console.log('[SECRET LOGIN] Auto-login successful, redirecting to', redirectTo);
    return NextResponse.redirect(new URL(redirectTo, request.url));
  } catch (error) {
    console.error('[SECRET LOGIN] Error:', error);
    return NextResponse.redirect(new URL('/auth/signin?error=ServerError', request.url));
  }
}
