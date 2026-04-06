import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { isAdmin, getSession } from '@/lib/server-auth';
import bcrypt from 'bcryptjs';

export async function PUT(request: NextRequest) {
  try {
    // Проверяем, является ли пользователь администратором
    const isAdminUser = await isAdmin();
    
    if (!isAdminUser) {
      return new Response(
        JSON.stringify({ error: 'Доступ запрещен. Требуются права администратора.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' }}
      );
    }

    // Получаем сессию пользователя
    const session = await getSession();
    
    const { userId, newPassword } = await request.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'ID пользователя обязателен' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!newPassword || newPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Пароль должен содержать не менее 6 символов' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Хешируем новый пароль
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Обновляем пароль пользователя
    await db.update(users).set({
      password: hashedPassword,
    }).where(eq(users.id, userId));

    return new Response(
      JSON.stringify({ message: 'Пароль пользователя успешно обновлен' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Ошибка обновления пароля пользователя:', error);
    return new Response(
      JSON.stringify({ error: 'Ошибка сервера при обновлении пароля пользователя' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}