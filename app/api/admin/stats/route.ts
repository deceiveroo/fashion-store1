import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, products, orders } from '@/lib/schema';
import { count, sum, sql, gte, lte, and } from 'drizzle-orm';
import { isStaff } from '@/lib/server-auth';
import { CACHE_KEYS } from '@/lib/cache';
import { cacheGet, cacheSet } from '@/lib/redis';
import { subMonths } from 'date-fns';

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const staff = await isStaff();
    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Aggressive caching - stats don't change often
    const cacheKey = CACHE_KEYS.SITE_CONFIG + ':stats';
    const cached = await cacheGet(cacheKey);
    if (cached) {
      console.log('[STATS] Cache hit - returning cached data');
      return NextResponse.json(cached);
    }

    console.log('[STATS] Cache miss - querying database...');

    const oneMonthAgo = subMonths(new Date(), 1);
    const twoMonthsAgo = subMonths(new Date(), 2);

    // Запросы независимы — раньше шли строго по очереди (latency = сумма всех).
    // Параллелим через Promise.all; пул (max=3 в проде) сам ставит лишние в
    // очередь, поэтому пулер не перегружается, а latency = ~самый долгий запрос.
    const [
      [{ totalUsers }],
      [{ totalProducts }],
      [{ totalOrders }],
      [{ totalRevenue }],
      [{ newUsersThisMonth }],
      [{ newOrdersThisMonth }],
      [{ revenueThisMonth }],
      [{ usersLastMonth }],
      [{ ordersLastMonth }],
      [{ revenueLastMonth }],
    ] = await Promise.all([
      db.select({ totalUsers: count() }).from(users),
      db.select({ totalProducts: count() }).from(products),
      db.select({ totalOrders: count() }).from(orders),
      db.select({ totalRevenue: sum(sql`CAST(${orders.total} AS NUMERIC)`) }).from(orders),
      db.select({ newUsersThisMonth: count() }).from(users).where(gte(users.createdAt, oneMonthAgo)),
      db.select({ newOrdersThisMonth: count() }).from(orders).where(gte(orders.createdAt, oneMonthAgo)),
      db
        .select({ revenueThisMonth: sum(sql`CAST(${orders.total} AS NUMERIC)`) })
        .from(orders)
        .where(gte(orders.createdAt, oneMonthAgo)),
      db
        .select({ usersLastMonth: count() })
        .from(users)
        .where(and(gte(users.createdAt, twoMonthsAgo), lte(users.createdAt, oneMonthAgo))),
      db
        .select({ ordersLastMonth: count() })
        .from(orders)
        .where(and(gte(orders.createdAt, twoMonthsAgo), lte(orders.createdAt, oneMonthAgo))),
      db
        .select({ revenueLastMonth: sum(sql`CAST(${orders.total} AS NUMERIC)`) })
        .from(orders)
        .where(and(gte(orders.createdAt, twoMonthsAgo), lte(orders.createdAt, oneMonthAgo))),
    ]);

    // Calculate trends
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const userTrend = calculateTrend(newUsersThisMonth, usersLastMonth);
    const orderTrend = calculateTrend(newOrdersThisMonth, ordersLastMonth);
    const revenueTrend = calculateTrend(
      Number(revenueThisMonth || 0),
      Number(revenueLastMonth || 0)
    );

    const result = {
      overview: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: Number(totalRevenue || 0),
        newUsersThisMonth,
        newOrdersThisMonth,
        revenueThisMonth: Number(revenueThisMonth || 0),
        trends: {
          users: userTrend,
          orders: orderTrend,
          revenue: revenueTrend,
        },
      },
    };

    // Cache for 60 seconds (stats don't change often) — Redis, общий для инстансов
    await cacheSet(cacheKey, result, 60);
    console.log('[STATS] Cached result for 60 seconds');
    return NextResponse.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[STATS] Error fetching stats:', errorMessage);
    
    // Return cached data if available, even if stale
    const cacheKey = CACHE_KEYS.SITE_CONFIG + ':stats';
    const cached = await cacheGet(cacheKey);
    if (cached) {
      console.log('[STATS] Returning stale cached data due to error');
      return NextResponse.json(cached);
    }
    
    return NextResponse.json({ 
      error: 'Failed to load statistics',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 });
  }
}
