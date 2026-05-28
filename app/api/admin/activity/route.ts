import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, users, reviews, products } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';
import { jsonWithNoCache } from '@/lib/no-cache';

// Force dynamic rendering - never cache
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type ActivityType = 'order' | 'user' | 'product' | 'payment' | 'review' | 'alert' | 'success';

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: Date;
  metadata?: { amount?: number; status?: string; paymentStatus?: string; rating?: number };
}

/**
 * GET /api/admin/activity - Лента активности из реальных данных БД.
 * Объединяет последние заказы, регистрации пользователей и новые отзывы.
 */
export async function GET(request: NextRequest) {
  try {
    // verifyAuth сам проверяет и NextAuth-сессию (куки), и Bearer-токен.
    const currentUser = await verifyAuth(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    // Тянем три источника параллельно. Каждый защищён — сбой одного не роняет ленту.
    const [recentOrders, recentUsers, recentReviews] = await Promise.all([
      db
        .select({
          id: orders.id,
          total: orders.total,
          status: orders.status,
          paymentStatus: orders.paymentStatus,
          createdAt: orders.createdAt,
          userEmail: users.email,
        })
        .from(orders)
        .leftJoin(users, eq(orders.userId, users.id))
        .orderBy(desc(orders.createdAt))
        .limit(15)
        .catch(() => []),
      db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(10)
        .catch(() => []),
      db
        .select({
          id: reviews.id,
          rating: reviews.rating,
          createdAt: reviews.createdAt,
          isApproved: reviews.isApproved,
          productName: products.name,
        })
        .from(reviews)
        .leftJoin(products, eq(reviews.productId, products.id))
        .orderBy(desc(reviews.createdAt))
        .limit(10)
        .catch(() => []),
    ]);

    const activities: Activity[] = [];

    // Заказы → оплата / выполнен / новый заказ
    for (const order of recentOrders) {
      let type: ActivityType = 'order';
      let title = 'Новый заказ';
      let description = `Заказ от ${order.userEmail || 'неизвестного пользователя'}`;

      if (order.paymentStatus === 'paid') {
        type = 'payment';
        title = 'Оплата получена';
        description = `Заказ #${order.id.slice(0, 8)} оплачен`;
      } else if (order.status === 'delivered') {
        type = 'success';
        title = 'Заказ выполнен';
        description = `Заказ #${order.id.slice(0, 8)} доставлен`;
      }

      activities.push({
        id: `order-${order.id}`,
        type,
        title,
        description,
        timestamp: order.createdAt,
        metadata: {
          amount: parseFloat(order.total),
          status: order.status ?? undefined,
          paymentStatus: order.paymentStatus ?? undefined,
        },
      });
    }

    // Регистрации пользователей
    for (const u of recentUsers) {
      activities.push({
        id: `user-${u.id}`,
        type: 'user',
        title: 'Новый пользователь',
        description: u.name ? `${u.name} (${u.email})` : u.email,
        timestamp: u.createdAt,
      });
    }

    // Отзывы
    for (const r of recentReviews) {
      activities.push({
        id: `review-${r.id}`,
        type: 'review',
        title: r.isApproved ? 'Новый отзыв' : 'Отзыв на модерации',
        description: `${r.rating}★ на «${r.productName || 'товар'}»`,
        timestamp: r.createdAt,
        metadata: { rating: r.rating ?? undefined },
      });
    }

    // Сортируем по времени (самые новые первыми) и ограничиваем размер ленты
    activities.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return jsonWithNoCache({ activities: activities.slice(0, 30) });
  } catch (error) {
    console.error('Error fetching activity feed:', error);
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
  }
}
