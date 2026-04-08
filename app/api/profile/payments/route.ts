import { NextRequest, NextResponse } from 'next/server';
import { db, safeQuery } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'your-secret-key';
const secret = new TextEncoder().encode(JWT_SECRET);

async function getUserId(request: NextRequest): Promise<string | null> {
  const session = await auth();
  if (session?.user?.id) return session.user.id;
  
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const { payload } = await jwtVerify(token, secret);
      return payload.userId as string;
    } catch {}
  }
  return null;
}

// GET - получить способы оплаты
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  
  if (!userId) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }

  try {
    const paymentMethods = await safeQuery(() =>
      db.execute(sql`
        SELECT id, type, last4, brand, expiry_month, expiry_year, holder_name, is_default
        FROM payment_methods
        WHERE user_id = ${userId}
        ORDER BY is_default DESC, created_at DESC
      `)
    );

    return NextResponse.json({
      paymentMethods: paymentMethods?.rows || [],
    });
  } catch (error) {
    console.error('Payment methods fetch error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// POST - добавить способ оплаты или установить по умолчанию
export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  
  if (!userId) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (body.action === 'add') {
      // Определяем бренд по номеру карты
      let brand = 'Unknown';
      const firstDigit = body.cardNumber.charAt(0);
      if (firstDigit === '4') brand = 'Visa';
      else if (firstDigit === '5') brand = 'Mastercard';
      else if (firstDigit === '2') brand = 'Mir';

      const last4 = body.cardNumber.slice(-4);

      await safeQuery(() =>
        db.execute(sql`
          INSERT INTO payment_methods (
            id, user_id, type, last4, brand, expiry_month, expiry_year, holder_name, is_default
          )
          VALUES (
            gen_random_uuid(), 
            ${userId}, 
            'card', 
            ${last4}, 
            ${brand}, 
            ${body.expiryMonth}, 
            ${body.expiryYear}, 
            ${body.holderName}, 
            false
          )
        `)
      );

      return NextResponse.json({ message: 'Способ оплаты добавлен' });
    }

    if (body.action === 'set_default') {
      // Сначала убираем default со всех
      await safeQuery(() =>
        db.execute(sql`
          UPDATE payment_methods
          SET is_default = false
          WHERE user_id = ${userId}
        `)
      );

      // Устанавливаем новый default
      await safeQuery(() =>
        db.execute(sql`
          UPDATE payment_methods
          SET is_default = true
          WHERE id = ${body.paymentId} AND user_id = ${userId}
        `)
      );

      return NextResponse.json({ message: 'Способ оплаты установлен по умолчанию' });
    }

    return NextResponse.json({ error: 'Неизвестное действие' }, { status: 400 });
  } catch (error) {
    console.error('Payment method update error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// DELETE - удалить способ оплаты
export async function DELETE(request: NextRequest) {
  const userId = await getUserId(request);
  
  if (!userId) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('id');

    if (!paymentId) {
      return NextResponse.json({ error: 'ID не указан' }, { status: 400 });
    }

    await safeQuery(() =>
      db.execute(sql`
        DELETE FROM payment_methods
        WHERE id = ${paymentId} AND user_id = ${userId}
      `)
    );

    return NextResponse.json({ message: 'Способ оплаты удален' });
  } catch (error) {
    console.error('Payment method delete error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
