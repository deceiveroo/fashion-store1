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

// GET - экспортировать все данные пользователя
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  
  if (!userId) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }

  try {
    // Собираем все данные пользователя
    const userData = await safeQuery(() =>
      db.execute(sql`
        SELECT id, email, name, role, created_at
        FROM users
        WHERE id = ${userId}
      `)
    );

    const profileData = await safeQuery(() =>
      db.execute(sql`
        SELECT *
        FROM user_profiles
        WHERE user_id = ${userId}
      `)
    );

    const ordersData = await safeQuery(() =>
      db.execute(sql`
        SELECT o.*, 
          json_agg(
            json_build_object(
              'name', oi.name,
              'price', oi.price,
              'quantity', oi.quantity,
              'size', oi.size,
              'color', oi.color
            )
          ) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.user_id = ${userId}
        GROUP BY o.id
      `)
    );

    const wishlistData = await safeQuery(() =>
      db.execute(sql`
        SELECT gw.*, p.name, p.price
        FROM gift_wishlist gw
        LEFT JOIN products p ON gw.product_id = p.id
        WHERE gw.user_id = ${userId}
      `)
    );

    const sessionsData = await safeQuery(() =>
      db.execute(sql`
        SELECT * FROM user_sessions WHERE user_id = ${userId}
      `)
    );

    const loginHistoryData = await safeQuery(() =>
      db.execute(sql`
        SELECT * FROM login_history WHERE user_id = ${userId}
      `)
    );

    const paymentMethodsData = await safeQuery(() =>
      db.execute(sql`
        SELECT id, type, last4, brand, expiry_month, expiry_year, holder_name, is_default
        FROM payment_methods
        WHERE user_id = ${userId}
      `)
    );

    const notificationSettingsData = await safeQuery(() =>
      db.execute(sql`
        SELECT * FROM notification_settings WHERE user_id = ${userId}
      `)
    );

    // Формируем JSON для экспорта
    const exportData = {
      exportDate: new Date().toISOString(),
      user: userData?.rows?.[0] || {},
      profile: profileData?.rows?.[0] || {},
      orders: ordersData?.rows || [],
      wishlist: wishlistData?.rows || [],
      sessions: sessionsData?.rows || [],
      loginHistory: loginHistoryData?.rows || [],
      paymentMethods: paymentMethodsData?.rows || [],
      notificationSettings: notificationSettingsData?.rows?.[0] || {},
    };

    // Возвращаем как JSON файл для скачивания
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="user-data-${userId}.json"`,
      },
    });
  } catch (error) {
    console.error('Data export error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
