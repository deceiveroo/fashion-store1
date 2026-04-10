import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, products, orders } from '@/lib/schema';
import { count, sum, sql, gte } from 'drizzle-orm';
import { isStaff } from '@/lib/server-auth';
import { getCached, setCache, TTL } from '@/lib/cache';
import { subMonths } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const staff = await isStaff();
    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cacheKey = 'stats:overview';
    const cached = await getCached(cacheKey);
    if (cached) return NextResponse.json(cached);

    const oneMonthAgo = subMonths(new Date(), 1);

    // Run all counts in parallel
    const [
      [{ totalUsers }],
      [{ totalProducts }],
      [{ totalOrders }],
      [{ totalRevenue }],
      [{ newUsersThisMonth }],
      [{ newOrdersThisMonth }],
      [{ revenueThisMonth }],
    ] = await Promise.all([
      db.select({ totalUsers: count() }).from(users),
      db.select({ totalProducts: count() }).from(products),
      db.select({ totalOrders: count() }).from(orders),
      db.select({ totalRevenue: sum(sql`CAST(${orders.total} AS NUMERIC)`) }).from(orders),
      db.select({ newUsersThisMonth: count() }).from(users).where(gte(users.createdAt, oneMonthAgo)),
      db.select({ newOrdersThisMonth: count() }).from(orders).where(gte(orders.createdAt, oneMonthAgo)),
      db.select({ revenueThisMonth: sum(sql`CAST(${orders.total} AS NUMERIC)`) }).from(orders).where(gte(orders.createdAt, oneMonthAgo)),
    ]);

    const result = {
      overview: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: Number(totalRevenue || 0),
        newUsersThisMonth,
        newOrdersThisMonth,
        revenueThisMonth: Number(revenueThisMonth || 0),
      },
    };

    await setCache(cacheKey, result, TTL.STATS);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
