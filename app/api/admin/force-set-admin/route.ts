import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Используем специальный токен для защиты этого маршрута
const FORCE_SET_ADMIN_TOKEN = process.env.FORCE_SET_ADMIN_TOKEN;

export async function POST(request: NextRequest) {
  try {
    if (!FORCE_SET_ADMIN_TOKEN) {
      return new Response(
        JSON.stringify({ error: 'Специальный токен для установки администратора не настроен' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { email, token } = await request.json();

    if (!email || !token) {
      return new Response(
        JSON.stringify({ error: 'Email и токен обязательны' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Проверяем токен
    if (token !== FORCE_SET_ADMIN_TOKEN) {
      return new Response(
        JSON.stringify({ error: 'Неверный токен' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email обязателен' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Пользователь с указанным email не найден' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Обновляем роль пользователя на 'admin'
    await db
      .update(users)
      .set({ role: 'admin' })
      .where(eq(users.email, email));

    return new Response(
      JSON.stringify({ message: 'Роль администратора успешно установлена' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Ошибка при установке роли администратора:', error);
    return new Response(
      JSON.stringify({ error: 'Ошибка сервера при установке роли администратора' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}