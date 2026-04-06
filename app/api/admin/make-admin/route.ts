import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return Response.json({ error: 'Email обязателен' }, { status: 400 });
    }

    // Находим пользователя по email
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (user.length === 0) {
      return Response.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    // Обновляем роль пользователя до admin
    const updatedUser = await db.update(users)
      .set({ role: 'admin' })
      .where(eq(users.email, email))
      .returning();

    return Response.json({ 
      message: 'Роль пользователя успешно обновлена до администратора', 
      user: updatedUser[0] 
    });
  } catch (error) {
    console.error('Ошибка при обновлении роли пользователя:', error);
    return Response.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}