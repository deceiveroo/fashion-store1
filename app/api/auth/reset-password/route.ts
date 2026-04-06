import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword, token } = await request.json();

    if (!email || !newPassword) {
      return NextResponse.json({ message: 'Email и новый пароль обязательны' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ message: 'Пароль должен содержать минимум 6 символов' }, { status: 400 });
    }

    const userData = await db.select({ id: users.id, email: users.email })
      .from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1);

    if (userData.length === 0) {
      // Don't reveal if email exists
      return NextResponse.json({ message: 'Если такой email зарегистрирован, пароль будет сброшен' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.email, email.toLowerCase().trim()));

    console.log(`[RESET PASSWORD] Password reset for: ${email}`);

    return NextResponse.json({ message: 'Пароль успешно изменён' });
  } catch (error: any) {
    console.error('[RESET PASSWORD] Error:', error.message);
    return NextResponse.json({ message: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
