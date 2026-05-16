import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, products, orders } from '@/lib/schema';
import { count, sum, sql, gte, lte, and } from 'drizzle-orm';
import { isStaff } from '@/lib/server-auth';
import { cache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';
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
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log('[STATS] Cache hit - returning cached data');
      return NextResponse.json(cached);
    }

    console.log('[STATS] Cache miss - querying database...');

    const oneMonthAgo = subMonths(new Date(), 1);
    const twoMonthsAgo = subMonths(new Date(), 2);

    // Sequential queries — Supabase pooler allows very few concurrent connections
    const [{ totalUsers }] = await db.select({ totalUsers: count() }).from(users);
    const [{ totalProducts }] = await db.select({ totalProducts: count() }).from(products);
    const [{ totalOrders }] = await db.select({ totalOrders: count() }).from(orders);
    const [{ totalRevenue }] = await db
      .select({ totalRevenue: sum(sql`CAST(${orders.total} AS NUMERIC)`) })
      .from(orders);
    const [{ newUsersThisMonth }] = await db
      .select({ newUsersThisMonth: count() })
      .from(users)
      .where(gte(users.createdAt, oneMonthAgo));
    const [{ newOrdersThisMonth }] = await db
      .select({ newOrdersThisMonth: count() })
      .from(orders)
      .where(gte(orders.createdAt, oneMonthAgo));
    const [{ revenueThisMonth }] = await db
      .select({ revenueThisMonth: sum(sql`CAST(${orders.total} AS NUMERIC)`) })
      .from(orders)
      .where(gte(orders.createdAt, oneMonthAgo));
    const [{ usersLastMonth }] = await db
      .select({ usersLastMonth: count() })
      .from(users)
      .where(and(gte(users.createdAt, twoMonthsAgo), lte(users.createdAt, oneMonthAgo)));
    const [{ ordersLastMonth }] = await db
      .select({ ordersLastMonth: count() })
      .from(orders)
      .where(and(gte(orders.createdAt, twoMonthsAgo), lte(orders.createdAt, oneMonthAgo)));
    const [{ revenueLastMonth }] = await db
      .select({ revenueLastMonth: sum(sql`CAST(${orders.total} AS NUMERIC)`) })
      .from(orders)
      .where(and(gte(orders.createdAt, twoMonthsAgo), lte(orders.createdAt, oneMonthAgo)));

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

    // Cache for 60 seconds (stats don't change often)
    cache.set(cacheKey, result, CACHE_TTL.MEDIUM);
    console.log('[STATS] Cached result for 60 seconds');
    return NextResponse.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[STATS] Error fetching stats:', errorMessage);
    
    // Return cached data if available, even if stale
    const cacheKey = CACHE_KEYS.SITE_CONFIG + ':stats';
    const cached = cache.get(cacheKey);
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
