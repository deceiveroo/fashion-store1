import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { jwtVerify } from 'jose';
import { getJwtSecret } from '@/lib/jwt-secret';

const secret = getJwtSecret();

async function authenticateToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as { userId: string; email: string };
  } catch {
    return null;
  }
}

function validatePassword(pwd: string): string | null {
  if (typeof pwd !== 'string') return 'Пароль должен быть строкой';
  if (pwd.length < 8) return 'Пароль должен содержать минимум 8 символов';
  if (!/[a-zA-Zа-яА-Я]/.test(pwd)) return 'Пароль должен содержать хотя бы одну букву';
  if (!/[0-9]/.test(pwd)) return 'Пароль должен содержать хотя бы одну цифру';
  return null;
}

export async function POST(request: NextRequest) {
  const user = await authenticateToken(request);
  if (!user) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }

  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ message: 'Текущий и новый пароль обязательны' }, { status: 400 });
    }

    const pwdError = validatePassword(newPassword);
    if (pwdError) {
      return NextResponse.json({ message: pwdError }, { status: 400 });
    }

    if (currentPassword === newPassword) {
      return NextResponse.json({ message: 'Новый пароль должен отличаться от текущего' }, { status: 400 });
    }

    const userData = await db.select().from(users).where(eq(users.id, user.userId)).limit(1);

    if (userData.length === 0 || !userData[0].password) {
      return NextResponse.json({ message: 'Пользователь не найден' }, { status: 404 });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, userData[0].password);
    if (!isValidPassword) {
      return NextResponse.json({ message: 'Неверный текущий пароль' }, { status: 401 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await db.update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, user.userId));

    return NextResponse.json({ message: 'Пароль успешно изменен' });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
