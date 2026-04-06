import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword } = await request.json();

    if (!email || !newPassword) {
      return NextResponse.json({ message: 'Email и новый пароль обязательны' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ message: 'Новый пароль должен содержать минимум 6 символов' }, { status: 400 });
    }

    // Находим пользователя по email
    const userData = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (userData.length === 0) {
      return NextResponse.json({ message: 'Пользователь с таким email не найден' }, { status: 404 });
    }

    // Обновляем пароль
    await db.update(users)
      .set({ password: newPassword })
      .where(eq(users.email, email));

    return NextResponse.json({ message: 'Пароль успешно сброшен' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
