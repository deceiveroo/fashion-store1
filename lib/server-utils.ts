import { cookies, headers } from 'next/headers';
import { jwtVerify } from 'jose';
import { type NextRequest } from 'next/server';
import { auth } from '@/lib/auth'; // Импортируем auth из нашей конфигурации

// Функция для использования в API маршрутах с NextAuth
export async function getApiSessionFromAuth(request?: Request) {
  try {
    // В API маршрутах Next.js 13+ с App Router
    // мы можем использовать auth() напрямую
    const session = await auth();
    return session;
  } catch (error) {
    console.error('API Session verification error:', error);
    return null;
  }
}

// Функция для использования в серверных компонентах
export async function getSessionFromCookies() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('next-auth.session-token')?.value;
    
    if (!sessionToken) {
      return null;
    }

    // Проверяем токен сессии
    const secret = process.env.NEXTAUTH_SECRET || 'default_secret_for_dev';
    const verified = await jwtVerify(
      sessionToken,
      new TextEncoder().encode(secret)
    );
    
    return verified.payload;
  } catch (error) {
    console.error('Session verification error:', error);
    return null;
  }
}

// Функция для использования в API маршрутах
export async function getApiSessionFromHeaders() {
  try {
    // В API маршрутах Next.js мы не можем напрямую использовать cookies()
    // Вместо этого, получаем заголовок cookie и парсим его вручную
    const headersList = await headers();
    const cookieHeader = headersList.get('cookie');
    if (!cookieHeader) {
      return null;
    }

    // Находим токен сессии в заголовке cookie
    const sessionCookie = cookieHeader
      .split(';')
      .find((c: string) => c.trim().startsWith('next-auth.session-token='));
    
    if (!sessionCookie) {
      return null;
    }

    const sessionToken = sessionCookie.split('=')[1];
    const secret = process.env.NEXTAUTH_SECRET || 'default_secret_for_dev';

    const verified = await jwtVerify(
      sessionToken,
      new TextEncoder().encode(secret)
    );
    
    return verified.payload;
  } catch (error) {
    console.error('API Session verification error:', error);
    return null;
  }
}