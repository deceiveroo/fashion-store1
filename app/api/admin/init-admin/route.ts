import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Проверяем, есть ли уже администратор в системе
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.role, 'admin'));

    // Если уже есть администраторы, запрещаем инициализацию
    if (existingAdmin.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Уже существуют пользователи с ролью администратора. Инициализация нового администратора через этот маршрут запрещена.' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { email } = await request.json();

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
    console.error('Ошибка при инициализации администратора:', error);
    return new Response(
      JSON.stringify({ error: 'Ошибка сервера при инициализации администратора' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}