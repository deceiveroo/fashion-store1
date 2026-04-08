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

// GET - получить настройки цифрового двойника и отслеживаемые товары
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  
  if (!userId) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }

  try {
    // Получаем параметры тела из user_profiles
    const profile = await safeQuery(() =>
      db.execute(sql`
        SELECT height, weight, body_type, favorite_colors, favorite_brands
        FROM user_profiles
        WHERE user_id = ${userId}
      `)
    );

    // Получаем отслеживаемые товары
    const watchedItems = await safeQuery(() =>
      db.execute(sql`
        SELECT 
          pw.id,
          pw.product_id,
          pw.target_price,
          pw.current_price,
          pw.notified,
          p.name,
          p.image
        FROM price_watches pw
        LEFT JOIN products p ON pw.product_id = p.id
        WHERE pw.user_id = ${userId}
        ORDER BY pw.created_at DESC
      `)
    );

    return NextResponse.json({
      preferences: profile?.rows?.[0] || {
        height: 170,
        weight: 70,
        body_type: 'average',
        favorite_colors: [],
        favorite_brands: [],
      },
      watchedItems: watchedItems?.rows || [],
    });
  } catch (error) {
    console.error('Digital twin fetch error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// POST - обновить настройки или добавить товар для отслеживания
export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  
  if (!userId) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (body.action === 'update_preferences') {
      // Обновляем параметры тела
      await safeQuery(() =>
        db.execute(sql`
          UPDATE user_profiles
          SET 
            height = ${body.height},
            weight = ${body.weight},
            body_type = ${body.bodyType},
            favorite_colors = ${body.favoriteColors},
            favorite_brands = ${body.favoriteBrands}
          WHERE user_id = ${userId}
        `)
      );

      return NextResponse.json({ message: 'Параметры обновлены' });
    }

    if (body.action === 'add_price_watch') {
      // Получаем текущую цену товара
      const product = await safeQuery(() =>
        db.execute(sql`
          SELECT price FROM products WHERE id = ${body.productId}
        `)
      );

      if (!product?.rows || product.rows.length === 0) {
        return NextResponse.json({ error: 'Товар не найден' }, { status: 404 });
      }

      const currentPrice = product.rows[0].price;

      await safeQuery(() =>
        db.execute(sql`
          INSERT INTO price_watches (id, user_id, product_id, target_price, current_price)
          VALUES (gen_random_uuid(), ${userId}, ${body.productId}, ${body.targetPrice}, ${currentPrice})
        `)
      );

      return NextResponse.json({ message: 'Товар добавлен для отслеживания' });
    }

    return NextResponse.json({ error: 'Неизвестное действие' }, { status: 400 });
  } catch (error) {
    console.error('Digital twin update error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// DELETE - удалить товар из отслеживания
export async function DELETE(request: NextRequest) {
  const userId = await getUserId(request);
  
  if (!userId) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const watchId = searchParams.get('id');

    if (!watchId) {
      return NextResponse.json({ error: 'ID не указан' }, { status: 400 });
    }

    await safeQuery(() =>
      db.execute(sql`
        DELETE FROM price_watches
        WHERE id = ${watchId} AND user_id = ${userId}
      `)
    );

    return NextResponse.json({ message: 'Товар удален из отслеживания' });
  } catch (error) {
    console.error('Price watch delete error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
