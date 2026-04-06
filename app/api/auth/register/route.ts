// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const secret = new TextEncoder().encode(JWT_SECRET);

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName } = await request.json();

    // Проверяем, существует ли пользователь
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json({ message: 'Пользователь уже существует' }, { status: 400 });
    }

    // Хешируем пароль
    const passwordHash = await bcrypt.hash(password, 12);

    // Создаем пользователя
    const newUser = {
      id: crypto.randomUUID(), // используем более надежный способ генерации ID
      email,
      password: passwordHash,
      name: `${firstName} ${lastName}`,
    };
    await db.insert(users).values(newUser);

    // Создаем JWT токен
    const token = await new SignJWT({
      userId: newUser.id,
      email: newUser.email
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(secret);

    // Возвращаем пользователя без пароля
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json({
      user: {
        ...userWithoutPassword,
        firstName,
        lastName,
        phone: '',
        orders: []
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}