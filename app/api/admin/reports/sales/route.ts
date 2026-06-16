import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems } from '@/lib/db/schema';
import { gte, inArray } from 'drizzle-orm';
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

    // Кол-во товаров по всем заказам периода — ОДНИМ запросом. Раньше здесь был
    // N+1: отдельный SELECT по orderItems на каждый заказ внутри цикла (для
    // range=year — сотни последовательных round-trip'ов). Суммируем в памяти.
    const orderIds = ordersList.map((o) => o.id);
    const qtyByOrder: Record<string, number> = {};
    if (orderIds.length > 0) {
      const items = await db
        .select({ orderId: orderItems.orderId, quantity: orderItems.quantity })
        .from(orderItems)
        .where(inArray(orderItems.orderId, orderIds));
      for (const it of items) {
        qtyByOrder[it.orderId] = (qtyByOrder[it.orderId] || 0) + it.quantity;
      }
    }

    for (const order of ordersList) {
      const date = order.createdAt?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0];

      if (!salesByDay[date]) {
        salesByDay[date] = { sales: 0, orders: 0, revenue: 0 };
      }

      salesByDay[date].sales += qtyByOrder[order.id] || 0;
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
