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

// GET - получить настройки уведомлений
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  
  if (!userId) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }

  try {
    const settings = await safeQuery(() =>
      db.execute(sql`
        SELECT 
          orders_email, orders_push, orders_sms,
          promotions_email, promotions_push, promotions_sms,
          wishlist_email, wishlist_push, wishlist_sms,
          price_drops_email, price_drops_push, price_drops_sms,
          newsletter_email, newsletter_push, newsletter_sms,
          security_email, security_push, security_sms
        FROM notification_settings
        WHERE user_id = ${userId}
      `)
    );

    // Если настроек нет, создаем дефолтные
    if (!settings?.rows || settings.rows.length === 0) {
      await safeQuery(() =>
        db.execute(sql`
          INSERT INTO notification_settings (id, user_id)
          VALUES (gen_random_uuid(), ${userId})
        `)
      );

      return NextResponse.json({
        orders: { email: true, push: true, sms: true },
        promotions: { email: true, push: false, sms: false },
        wishlist: { email: true, push: true, sms: false },
        priceDrops: { email: true, push: true, sms: false },
        newsletter: { email: true, push: false, sms: false },
        security: { email: true, push: true, sms: true },
      });
    }

    const s = settings.rows[0];
    return NextResponse.json({
      orders: { email: s.orders_email, push: s.orders_push, sms: s.orders_sms },
      promotions: { email: s.promotions_email, push: s.promotions_push, sms: s.promotions_sms },
      wishlist: { email: s.wishlist_email, push: s.wishlist_push, sms: s.wishlist_sms },
      priceDrops: { email: s.price_drops_email, push: s.price_drops_push, sms: s.price_drops_sms },
      newsletter: { email: s.newsletter_email, push: s.newsletter_push, sms: s.newsletter_sms },
      security: { email: s.security_email, push: s.security_push, sms: s.security_sms },
    });
  } catch (error) {
    console.error('Notification settings fetch error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// POST - обновить настройки уведомлений
export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  
  if (!userId) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { category, channel, value } = body;

    // Формируем имя колонки
    const columnName = `${category}_${channel}`;

    await safeQuery(() =>
      db.execute(sql`
        UPDATE notification_settings
        SET ${sql.raw(columnName)} = ${value}
        WHERE user_id = ${userId}
      `)
    );

    return NextResponse.json({ message: 'Настройки обновлены' });
  } catch (error) {
    console.error('Notification settings update error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
