import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { users, products, orders, orderItems } from '@/lib/schema';
import { count, sql, sum, eq, gte, lte, desc, and } from 'drizzle-orm';
import { getSession, isStaff } from '@/lib/server-auth';
import { subMonths, format, startOfMonth, endOfMonth } from 'date-fns';

// Простое кеширование в памяти (5 минут)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 минут

function getCached(key: string) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCache(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
  // Очистка старых записей
  if (cache.size > 50) {
    const oldestKey = Array.from(cache.keys())[0];
    cache.delete(oldestKey);
  }
}

// Helper function with retry logic and shorter timeout
async function queryWithRetry<T>(queryFn: () => Promise<T>, maxRetries = 2, timeoutMs = 8000): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Добавляем таймаут для запроса
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

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !(await isStaff())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';

    // Проверяем кеш
    const cacheKey = `analytics:${type}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Используем try-catch для каждого типа, чтобы вернуть пустые данные при ошибке
    try {
      let result;
      switch (type) {
        case 'revenue-by-month':
          result = await getRevenueByMonth();
          break;
        case 'orders-by-status':
          result = await getOrdersByStatus();
          break;
        case 'top-products':
          result = await getTopProducts();
          break;
        case 'customer-growth':
          result = await getCustomerGrowth();
          break;
        case 'transactions':
          result = await getRecentTransactions();
          break;
        default:
          return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
      }
      
      // Сохраняем в кеш
      const data = result instanceof NextResponse ? await result.json() : result;
      setCache(cacheKey, data);
      
      return NextResponse.json(data);
    } catch (error) {
      console.error(`Analytics API error for type ${type}:`, error);
      // Возвращаем пустые данные вместо ошибки
      const emptyData = getEmptyData(type);
      return NextResponse.json(emptyData);
    }
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

function getEmptyData(type: string) {
  switch (type) {
    case 'revenue-by-month':
      return [];
    case 'orders-by-status':
      return {};
    case 'top-products':
      return [];
    case 'customer-growth':
      return { totalCustomers: 0, newCustomers: 0, growthRate: 0, chartData: [] };
    case 'transactions':
      return [];
    default:
      return {};
  }
}

async function getRevenueByMonth() {
  try {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);

      const result = await queryWithRetry(() =>
        db.select({
          revenue: sql<number>`COALESCE(SUM(CAST(${orders.total} AS NUMERIC)), 0)`,
          orderCount: count(),
        })
        .from(orders)
        .where(and(
          gte(orders.createdAt, start),
          lte(orders.createdAt, end)
        ))
      );

      months.push({
        month: format(date, 'MMM'),
        revenue: Number(result[0]?.revenue || 0),
        orders: result[0]?.orderCount || 0,
      });
    }

    return NextResponse.json(months);
  } catch (error) {
    console.error('Revenue by month error:', error);
    return NextResponse.json([]);
  }
}

async function getOrdersByStatus() {
  try {
    const result = await queryWithRetry(() =>
      db.select({
        status: orders.status,
        count: count(),
      })
      .from(orders)
      .groupBy(orders.status)
    );

    const statusData = result.reduce((acc, row) => {
      acc[row.status] = row.count;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json(statusData);
  } catch (error) {
    console.error('Orders by status error:', error);
    return NextResponse.json({});
  }
}

async function getTopProducts() {
  try {
    const result = await queryWithRetry(() =>
      db.select({
        productId: orderItems.productId,
        name: orderItems.name,
        image: orderItems.image,
        sales: sql<number>`CAST(SUM(${orderItems.quantity}) AS INTEGER)`,
        revenue: sql<number>`CAST(SUM(CAST(${orderItems.price} AS NUMERIC) * ${orderItems.quantity}) AS NUMERIC)`,
      })
      .from(orderItems)
      .groupBy(orderItems.productId, orderItems.name, orderItems.image)
      .orderBy(desc(sql`SUM(${orderItems.quantity})`))
      .limit(5)
    );

    const products = result.map((p, index) => ({
      id: p.productId,
      name: p.name,
      sales: Number(p.sales),
      revenue: Number(p.revenue),
      image: p.image,
      trend: Math.floor(Math.random() * 30) - 10, // Mock trend data
    }));

    return NextResponse.json(products);
  } catch (error) {
    console.error('Top products error:', error);
    return NextResponse.json([]);
  }
}

async function getCustomerGrowth() {
  try {
    const months = [];
    let totalCustomers = 0;

    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);

      const result = await queryWithRetry(() =>
        db.select({ count: count() })
        .from(users)
        .where(and(
          gte(users.createdAt, start),
          lte(users.createdAt, end)
        ))
      );

      const newCustomers = result[0]?.count || 0;
      totalCustomers += newCustomers;

      months.push({
        month: format(date, 'MMM'),
        customers: totalCustomers,
      });
    }

    const currentMonthCustomers = months[months.length - 1]?.customers || 0;
    const previousMonthCustomers = months[months.length - 2]?.customers || 1;
    const growthRate = Math.round(((currentMonthCustomers - previousMonthCustomers) / previousMonthCustomers) * 100);

    return NextResponse.json({
      totalCustomers: currentMonthCustomers,
      newCustomers: currentMonthCustomers - previousMonthCustomers,
      growthRate,
      chartData: months,
    });
  } catch (error) {
    console.error('Customer growth error:', error);
    return NextResponse.json({
      totalCustomers: 0,
      newCustomers: 0,
      growthRate: 0,
      chartData: [],
    });
  }
}

async function getRecentTransactions() {
  try {
    const result = await queryWithRetry(() =>
      db.select({
        id: orders.id,
        total: orders.total,
        status: orders.status,
        createdAt: orders.createdAt,
        paymentMethod: orders.paymentMethod,
      })
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(10)
    );

    const transactions = result.map(order => ({
      id: order.id,
      type: 'income' as const,
      description: `Заказ #${order.id.slice(0, 8)}`,
      amount: Number(order.total),
      date: order.createdAt.toISOString(),
      method: order.paymentMethod || 'card',
    }));

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Recent transactions error:', error);
    return NextResponse.json([]);
  }
}
