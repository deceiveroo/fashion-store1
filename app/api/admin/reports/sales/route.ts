import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems } from '@/lib/db/schema';
import { gte, sql } from 'drizzle-orm';
import { getSession, isStaff } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !(await isStaff())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'month';

    let daysAgo = 30;
    if (range === 'week') daysAgo = 7;
    else if (range === 'quarter') daysAgo = 90;
    else if (range === 'year') daysAgo = 365;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Получаем заказы за период
    const ordersList = await db
      .select({
        id: orders.id,
        total: orders.total,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(gte(orders.createdAt, startDate));

    // Группируем по дням
    const salesByDay: Record<string, { sales: number; orders: number; revenue: number }> = {};

    for (const order of ordersList) {
      const date = order.createdAt?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0];
      
      if (!salesByDay[date]) {
        salesByDay[date] = { sales: 0, orders: 0, revenue: 0 };
      }

      // Получаем количество товаров в заказе
      const items = await db
        .select({ quantity: orderItems.quantity })
        .from(orderItems)
        .where(sql`${orderItems.orderId} = ${order.id}`);

      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

      salesByDay[date].sales += totalItems;
      salesByDay[date].orders += 1;
      salesByDay[date].revenue += Number(order.total);
    }

    // Преобразуем в массив
    const result = Object.entries(salesByDay)
      .map(([date, data]) => ({
        date,
        ...data,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Sales report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
