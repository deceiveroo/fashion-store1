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

// GET - получить вишлист
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  
  if (!userId) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }

  try {
    const wishlist = await safeQuery(() =>
      db.execute(sql`
        SELECT 
          gw.id,
          gw.product_id,
          gw.is_public,
          gw.is_purchased,
          gw.size,
          gw.notes,
          p.name,
          p.price,
          p.image
        FROM gift_wishlist gw
        LEFT JOIN products p ON gw.product_id = p.id
        WHERE gw.user_id = ${userId}
        ORDER BY gw.created_at DESC
      `)
    );

    const settings = await safeQuery(() =>
      db.execute(sql`
        SELECT max_budget, min_budget, excluded_categories, share_token
        FROM wishlist_settings
        WHERE user_id = ${userId}
      `)
    );

    return NextResponse.json({
      items: wishlist?.rows || [],
      settings: settings?.rows?.[0] || {
        max_budget: 20000,
        min_budget: 1000,
        excluded_categories: [],
        share_token: '',
      },
    });
  } catch (error) {
    console.error('Wishlist fetch error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// POST - добавить в вишлист или обновить настройки
export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  
  if (!userId) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (body.action === 'add_item') {
      await safeQuery(() =>
        db.execute(sql`
          INSERT INTO gift_wishlist (id, user_id, product_id, is_public, size, notes)
          VALUES (gen_random_uuid(), ${userId}, ${body.productId}, ${body.isPublic || true}, ${body.size || null}, ${body.notes || null})
        `)
      );
      return NextResponse.json({ message: 'Товар добавлен в вишлист' });
    }

    if (body.action === 'toggle_visibility') {
      await safeQuery(() =>
        db.execute(sql`
          UPDATE gift_wishlist
          SET is_public = NOT is_public
          WHERE id = ${body.itemId} AND user_id = ${userId}
        `)
      );
      return NextResponse.json({ message: 'Видимость изменена' });
    }

    if (body.action === 'update_settings') {
      await safeQuery(() =>
        db.execute(sql`
          UPDATE wishlist_settings
          SET 
            max_budget = ${body.maxBudget},
            min_budget = ${body.minBudget},
            excluded_categories = ${body.excludedCategories}
          WHERE user_id = ${userId}
        `)
      );
      return NextResponse.json({ message: 'Настройки обновлены' });
    }

    return NextResponse.json({ error: 'Неизвестное действие' }, { status: 400 });
  } catch (error) {
    console.error('Wishlist update error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// DELETE - удалить из вишлиста
export async function DELETE(request: NextRequest) {
  const userId = await getUserId(request);
  
  if (!userId) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('id');

    if (!itemId) {
      return NextResponse.json({ error: 'ID не указан' }, { status: 400 });
    }

    await safeQuery(() =>
      db.execute(sql`
        DELETE FROM gift_wishlist
        WHERE id = ${itemId} AND user_id = ${userId}
      `)
    );

    return NextResponse.json({ message: 'Товар удален из вишлиста' });
  } catch (error) {
    console.error('Wishlist delete error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
