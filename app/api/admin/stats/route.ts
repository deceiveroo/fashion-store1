import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, products, orders, orderItems } from '@/lib/schema';
import { count, sql, sum, eq, gte, lte } from 'drizzle-orm';
import { getSession, isStaff } from '@/lib/server-auth';
import { subDays, subWeeks, subMonths, subYears } from 'date-fns';

// Простое кеширование в памяти (3 минуты для stats)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 3 * 60 * 1000; // 3 минуты

function getCached(key: string) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCache(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
  if (cache.size > 20) {
    const oldestKey = Array.from(cache.keys())[0];
    cache.delete(oldestKey);
  }
}

// Helper function with retry logic and timeout
async function queryWithRetry<T>(queryFn: () => Promise<T>, maxRetries = 2, timeoutMs = 8000): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
      );
      
      return await Promise.race([queryFn(), timeoutPromise]);
    } catch (error: any) {
      lastError = error;
      const isConnectionError = 
        error.message?.includes('Connection terminated') ||
        error.message?.includes('ECONNRESET') ||
        error.message?.includes('timeout') ||
        error.message?.includes('Pool is draining') ||
        error.code === 'ECONNRESET';
      
      if (isConnectionError && i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 300 * (i + 1)));
        continue;
      }
      throw error;
    }
  }
  
  throw lastError;
}

export async function GET(request: Request) {
  try {
    // Проверяем, является ли пользователь администратором
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await isStaff())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Получаем параметры запроса
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'month';
    
    // Проверяем кеш
    const cacheKey = `stats:${range}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Определяем диапазон дат в зависимости от выбранного периода
    let startDate = new Date();
    switch(range) {
      case 'week':
        startDate = subWeeks(new Date(), 1);
        break;
      case 'month':
        startDate = subMonths(new Date(), 1);
        break;
      case 'quarter':
        startDate = subMonths(new Date(), 3);
        break;
      case 'year':
        startDate = subYears(new Date(), 1);
        break;
      default:
        startDate = subMonths(new Date(), 1); // по умолчанию месяц
    }

    // ОПТИМИЗАЦИЯ: Выполняем только базовые запросы, остальное - по требованию
    const [
      totalUsersResult,
      totalProductsResult,
      totalOrdersResult,
      totalRevenueResult,
    ] = await Promise.all([
      queryWithRetry(() => db.select({ count: count() }).from(users)).catch(() => [{ count: 0 }]),
      queryWithRetry(() => db.select({ count: count() }).from(products)).catch(() => [{ count: 0 }]),
      queryWithRetry(() => db.select({ count: count() }).from(orders)).catch(() => [{ count: 0 }]),
      queryWithRetry(() => 
        db.select({ total: sql<number>`COALESCE(SUM(${orders.total}), 0)` })
          .from(orders)
          .where(gte(orders.createdAt, startDate))
      ).catch(() => [{ total: 0 }]),
    ]);

    const totalUsers = totalUsersResult[0]?.count || 0;
    const totalProducts = totalProductsResult[0]?.count || 0;
    const totalOrders = totalOrdersResult[0]?.count || 0;
    const totalRevenue = totalRevenueResult[0]?.total || 0;

    // Формируем результат
    const result = {
      overview: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue,
      },
      // Пустые данные для графиков - они загрузятся отдельными запросами
      ordersByStatus: {},
      usersByRole: {},
      recentOrders: [],
      revenueByMonth: [],
      popularProducts: []
    };
    
    // Сохраняем в кеш
    setCache(cacheKey, result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in admin stats API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}