import { apiHandler } from '@/lib/api';
import { GET } from '@/app/api/admin/operator-stats/route';

export const GET_handler = apiHandler(GET);
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { supportChatSessions, users } from '@/lib/schema';
import { eq, and, gte, lte, isNotNull } from 'drizzle-orm';
import { requireAdmin } from '@/lib/server-auth';
import { subDays, subWeeks, subMonths, subYears } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    // Check if user is admin
    const admin = await requireAdmin();
    if (!admin) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const dateRange = url.searchParams.get('range') || 'month';
    const operatorId = url.searchParams.get('operator') || 'all';

    // Calculate date range based on input
    const now = new Date();
    let startDate = new Date();
    
    switch (dateRange) {
      case 'week':
        startDate = subWeeks(now, 1);
        break;
      case 'month':
        startDate = subMonths(now, 1);
        break;
      case 'quarter':
        startDate = subMonths(now, 3);
        break;
      case 'year':
        startDate = subYears(now, 1);
        break;
      case 'today':
      default:
        startDate = subDays(now, 1);
    }

    // Build conditions for query
    let conditions = [
      isNotNull(supportChatSessions.operatorRating),
      gte(supportChatSessions.operatorRatedAt, startDate),
      lte(supportChatSessions.operatorRatedAt, now)
    ];

    if (operatorId !== 'all') {
      conditions.push(eq(supportChatSessions.resolvedBy, operatorId));
    }

    // Fetch sessions with ratings
    const sessions = await db
      .select({
        id: supportChatSessions.id,
        sessionId: supportChatSessions.sessionId,
        operatorRating: supportChatSessions.operatorRating,
        operatorRatedAt: supportChatSessions.operatorRatedAt,
        resolvedBy: supportChatSessions.resolvedBy,
        resolvedByName: users.name,
        resolvedByEmail: users.email
      })
      .from(supportChatSessions)
      .leftJoin(users, eq(supportChatSessions.resolvedBy, users.id))
      .where(and(...conditions));

    // Group by operator
    const groupedByOperator: Record<string, typeof sessions> = {};
    for (const session of sessions) {
      const operatorId = session.resolvedBy || 'unknown';
      if (!groupedByOperator[operatorId]) {
        groupedByOperator[operatorId] = [];
      }
      groupedByOperator[operatorId].push(session);
    }

    // Format the statistics
    const stats = Object.entries(groupedByOperator).map(([operatorId, operatorSessions]) => {
      const firstSession = operatorSessions[0];
      
      // Calculate hourly stats
      const hourlyStats = Array.from({ length: 24 }, (_, i) => {
        const hour = i.toString().padStart(2, '0');
        const count = operatorSessions.filter(s => {
          const sessionHour = new Date(s.operatorRatedAt!).getHours().toString().padStart(2, '0');
          return sessionHour === hour;
        }).length;
        return { hour: `${hour}:00`, count };
      });

      // Get recent ratings
      const recentRatings = operatorSessions
        .filter(s => s.operatorRating !== null)
        .map(s => ({
          rating: s.operatorRating!,
          timestamp: s.operatorRatedAt!.toISOString(),
          sessionId: s.sessionId
        }))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Calculate average rating
      const totalRating = operatorSessions.reduce((sum, s) => sum + (s.operatorRating || 0), 0);
      const avgRating = operatorSessions.length > 0 ? totalRating / operatorSessions.length : 0;

      return {
        id: operatorId,
        name: firstSession.resolvedByName || '',
        email: firstSession.resolvedByEmail || '',
        completedChats: operatorSessions.length,
        avgRating: parseFloat(avgRating.toFixed(2)),
        totalRatings: operatorSessions.length,
        hourlyStats,
        recentRatings
      };
    });

    return Response.json({ stats });
  } catch (error) {
    console.error('Error fetching operator stats:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
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