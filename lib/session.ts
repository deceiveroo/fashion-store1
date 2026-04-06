import { getToken } from 'next-auth/jwt';
import { cookies } from 'next/headers';
import { auth } from '@/lib/auth';

const secret = process.env.NEXTAUTH_SECRET;

/**
 * Получает JWT токен напрямую из куки
 */
export async function getJwtSession() {
  try {
    // Получаем куки (await обязателен в Next.js App Router)
    const cookieStore = await cookies();
    const nextAuthSessionToken = cookieStore.get('next-auth.session-token')?.value 
      || cookieStore.get('authjs.session-token')?.value;

    if (!nextAuthSessionToken) {
      return null;
    }

    // Создаем объект cookies только с нужным сессионным токеном
    const cookieObj: Record<string, string> = {};
    if (nextAuthSessionToken) {
      const sessionCookie = cookieStore.get('next-auth.session-token') || 
                           cookieStore.get('authjs.session-token');
      if (sessionCookie) {
        cookieObj[sessionCookie.name] = sessionCookie.value;
      }
    }

    // Используем JWT для проверки токена
    const tokenResult = await getToken({ 
      req: { 
        cookies: () => cookieObj,
        headers: () => ({}),
      } as any,
      secret 
    });

    return tokenResult;
  } catch (error) {
    console.error('Ошибка получения JWT сессии:', error);
    return null;
  }
}

/**
 * Проверяет, является ли пользователь администратором, используя JWT
 */
export async function isAdminWithJwt(): Promise<boolean> {
  try {
    const session = await getJwtSession();
    return session?.role === 'admin';
  } catch (error) {
    console.error('Ошибка проверки администратора через JWT:', error);
    return false;
  }
}