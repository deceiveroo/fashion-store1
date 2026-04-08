import { NextRequest, NextResponse } from 'next/server';
import { db, safeQuery } from '@/lib/db';
import { orders, orderItems, users } from '@/lib/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'your-secret-key';
const secret = new TextEncoder().encode(JWT_SECRET);

async function getUserId(request: NextRequest): Promise<string | null> {
  const session = await auth();
  if (session?.user?.id) return session.user.id;
  
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const { payload } = await jwtVerify(token, secret);
      return payload.userId as string;
    } catch {}
  }
  return null;
}

// GET - получить статистику пользователя для AI Assistant
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  
  if (!userId) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }

  try {
    // Получаем все заказы пользователя
    const userOrders = await safeQuery(() => 
      db.select()
        .from(orders)
        .where(eq(orders.userId, userId))
        .orderBy(desc(orders.createdAt))
    ) || [];

    // Получаем все items из заказов
    const orderIds = userOrders.map(o => o.id);
    let items: any[] = [];
    
    if (orderIds.length > 0) {
      items = await safeQuery(() =>
        db.select()
          .from(orderItems)
          .where(sql`${orderItems.orderId} IN ${orderIds}`)
      ) || [];
    }

    // Подсчитываем статистику по категориям
    const categoryStats: Record<string, { count: number; total: number }> = {};
    
    items.forEach(item => {
      // Определяем категорию по названию товара (упрощенная логика)
      let category = 'Другое';
      const name = item.name.toLowerCase();
      
      if (name.includes('куртка') || name.includes('пальто') || name.includes('свитер') || name.includes('рубашка')) {
        category = 'Одежда';
      } else if (name.includes('кроссовки') || name.includes('ботинки') || name.includes('туфли')) {
        category = 'Обувь';
      } else if (name.includes('сумка') || name.includes('рюкзак') || name.includes('часы') || name.includes('очки')) {
        category = 'Аксессуары';
      }
      
      if (!categoryStats[category]) {
        categoryStats[category] = { count: 0, total: 0 };
      }
      
      categoryStats[category].count += item.quantity;
      categoryStats[category].total += parseFloat(item.price) * item.quantity;
    });

    // Преобразуем в массив для фронтенда
    const trends = Object.entries(categoryStats).map(([category, stats]) => ({
      category,
      count: stats.count,
      total: stats.total,
      percentage: 0, // будет рассчитано на фронтенде
    }));

    // Общая статистика
    const totalSpent = userOrders.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0);
    const totalOrders = userOrders.length;
    const averageOrder = totalOrders > 0 ? totalSpent / totalOrders : 0;

    // Эко-статистика (упрощенная)
    const carbonFootprint = totalOrders * 2.5; // примерно 2.5 кг CO2 на заказ
    const waterSaved = totalOrders * 150; // примерно 150 л воды сэкономлено
    const treesEquivalent = Math.floor(carbonFootprint / 20); // 1 дерево = ~20 кг CO2

    return NextResponse.json({
      trends,
      totalSpent,
      totalOrders,
      averageOrder,
      eco: {
        carbonFootprint,
        waterSaved,
        treesEquivalent,
        ecoScore: Math.min(100, Math.floor((waterSaved / 1000) * 10)),
      },
      recentItems: items.slice(0, 5).map(item => ({
        name: item.name,
        price: item.price,
        image: item.image,
      })),
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
