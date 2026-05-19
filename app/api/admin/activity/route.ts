import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, users } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';
import { jsonWithNoCache } from '@/lib/no-cache';

// Force dynamic rendering - never cache
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/admin/activity - Получить ленту активности из реальных данных БД
 * Возвращает последние заказы, регистрации пользователей, оплаты
 */
export async function GET(request: NextRequest) {
  try {
    // Проверка авторизации и роли администратора
    const currentUser = await verifyAuth(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    // Получаем последние 20 заказов
    const recentOrders = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        total: orders.total,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        createdAt: orders.createdAt,
        userEmail: users.email,
        userName: users.name,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.createdAt))
      .limit(20);

    // Преобразуем заказы в события активности
    const activities = recentOrders.map(order => {
      // Определяем тип события на основе статуса
      let type: 'order' | 'payment' | 'success' = 'order';
      let title = 'Новый заказ';
      let description = `Заказ от ${order.userEmail || 'Неизвестный пользователь'}`;

      if (order.paymentStatus === 'paid') {
        type = 'payment';
        title = 'Оплата получена';
        description = `Заказ #${order.id.slice(0, 8)} оплачен`;
      } else if (order.status === 'delivered') {
        type = 'success';
        title = 'Заказ выполнен';
        description = `Заказ #${order.id.slice(0, 8)} доставлен`;
      }

      return {
        id: order.id,
        type,
        title,
        description,
        timestamp: order.createdAt,
        metadata: {
          amount: parseFloat(order.total),
          status: order.status,
          paymentStatus: order.paymentStatus,
        },
      };
    });

    // Сортируем по времени (самые новые первыми)
    activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return jsonWithNoCache({ activities });
  } catch (error) {
    console.error('Error fetching activity feed:', error);
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
  }
}
