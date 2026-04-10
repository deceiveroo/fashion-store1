import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { users, orders, orderItems } from '@/lib/schema';
import { count, sql, gte, desc } from 'drizzle-orm';
import { isStaff } from '@/lib/server-auth';
import { subMonths, format, startOfMonth } from 'date-fns';
import { getCached, setCache, TTL } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const staff = await isStaff();
    if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'dashboard';
    const cacheKey = `analytics:${type}`;

    const cached = await getCached(cacheKey);
    if (cached) return NextResponse.json(cached);

    let data: any;

    switch (type) {
      case 'dashboard': {
        const [revenue, ordersByStatus, topProducts, customerGrowth, transactions] = await Promise.all([
          fetchRevenueByMonth(),
          fetchOrdersByStatus(),
          fetchTopProducts(),
          fetchCustomerGrowth(),
          fetchRecentTransactions(),
        ]);
        data = { revenueByMonth: revenue, ordersByStatus, topProducts, customerGrowth, transactions };
        break;
      }
      case 'revenue-by-month':
        data = await fetchRevenueByMonth();
        break;
      case 'orders-by-status':
        data = await fetchOrdersByStatus();
        break;
      case 'top-products':
        data = await fetchTopProducts();
        break;
      case 'customer-growth':
        data = await fetchCustomerGrowth();
        break;
      case 'transactions':
        data = await fetchRecentTransactions();
        break;
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    await setCache(cacheKey, data, TTL.ANALYTICS);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

async function fetchRevenueByMonth() {
  const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));

  const rows = await db
    .select({
      monthLabel: sql<string>`TO_CHAR(DATE_TRUNC('month', ${orders.createdAt}), 'Mon')`,
      revenue: sql<number>`COALESCE(SUM(CAST(${orders.total} AS NUMERIC)), 0)`,
      orderCount: count(),
    })
    .from(orders)
    .where(gte(orders.createdAt, sixMonthsAgo))
    .groupBy(sql`DATE_TRUNC('month', ${orders.createdAt})`)
    .orderBy(sql`DATE_TRUNC('month', ${orders.createdAt})`);

  // Fill missing months with zeros
  return Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    const label = format(date, 'MMM');
    const found = rows.find(r => r.monthLabel === label);
    return { month: label, revenue: Number(found?.revenue || 0), orders: found?.orderCount || 0 };
  });
}

async function fetchOrdersByStatus() {
  const rows = await db
    .select({ status: orders.status, count: count() })
    .from(orders)
    .groupBy(orders.status);

  return rows.reduce((acc, r) => ({ ...acc, [r.status]: r.count }), {} as Record<string, number>);
}

async function fetchTopProducts() {
  const rows = await db
    .select({
      productId: orderItems.productId,
      name: orderItems.name,
      image: orderItems.image,
      sales: sql<number>`CAST(SUM(${orderItems.quantity}) AS INTEGER)`,
      revenue: sql<number>`CAST(SUM(CAST(${orderItems.price} AS NUMERIC) * ${orderItems.quantity}) AS NUMERIC)`,
    })
    .from(orderItems)
    .groupBy(orderItems.productId, orderItems.name, orderItems.image)
    .orderBy(desc(sql`SUM(${orderItems.quantity})`))
    .limit(5);

  return rows.map(p => ({
    id: p.productId,
    name: p.name,
    sales: Number(p.sales),
    revenue: Number(p.revenue),
    image: p.image,
    // Real trend: compare to previous period would require extra query; using 0 as neutral
    trend: 0,
  }));
}

async function fetchCustomerGrowth() {
  const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));

  const rows = await db
    .select({
      monthLabel: sql<string>`TO_CHAR(DATE_TRUNC('month', ${users.createdAt}), 'Mon')`,
      count: count(),
    })
    .from(users)
    .where(gte(users.createdAt, sixMonthsAgo))
    .groupBy(sql`DATE_TRUNC('month', ${users.createdAt})`)
    .orderBy(sql`DATE_TRUNC('month', ${users.createdAt})`);

  let cumulative = 0;
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    const label = format(date, 'MMM');
    const found = rows.find(r => r.monthLabel === label);
    cumulative += found?.count || 0;
    return { month: label, customers: cumulative };
  });

  const current = chartData[chartData.length - 1]?.customers || 0;
  const previous = chartData[chartData.length - 2]?.customers || 1;
  const growthRate = Math.round(((current - previous) / previous) * 100);

  return {
    totalCustomers: current,
    newCustomers: current - previous,
    growthRate,
    chartData,
  };
}

async function fetchRecentTransactions() {
  const rows = await db
    .select({
      id: orders.id,
      total: orders.total,
      status: orders.status,
      createdAt: orders.createdAt,
      paymentMethod: orders.paymentMethod,
    })
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(10);

  return rows.map(o => ({
    id: o.id,
    type: 'income' as const,
    description: `Заказ #${o.id.slice(0, 8).toUpperCase()}`,
    amount: Number(o.total),
    date: o.createdAt.toISOString(),
    method: o.paymentMethod || 'card',
  }));
}
