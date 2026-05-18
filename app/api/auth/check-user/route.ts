import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ exists: false }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();
    
    // Проверяем существует ли пользователь с таким email
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(sql`lower(${users.email}) = ${emailLower}`)
      .limit(1);

    return NextResponse.json({ exists: !!user });
  } catch (error) {
    console.error('[CHECK USER] Error:', error);
    return NextResponse.json({ exists: false }, { status: 500 });
  }
}
