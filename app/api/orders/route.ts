// app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems, users } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { jwtVerify } from 'jose';
import { randomUUID } from 'crypto';
import { getSession } from '@/lib/server-auth';
import { verifyAuth } from '@/lib/auth';
import { checkAchievements, awardXP } from '@/lib/gamification';

// Force dynamic rendering - never cache
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Функция с повторными попытками для надежной работы с базой данных
async function queryWithRetry<T>(queryFn: () => Promise<T>): Promise<T> {
  const maxRetries = 3;
  let lastError: any;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await queryFn();
    } catch (error: any) {
      lastError = error;
      const isConnectionError = 
        error.message?.includes('Connection terminated') || 
        error.message?.includes('timeout') || 
        error.message?.includes('Connection pool is closed') ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ECONNRESET' ||
        error.code === 'ENOTFOUND';

      if (isConnectionError && i < maxRetries - 1) {
        console.log(`Database connection attempt ${i + 1} failed, retrying in ${Math.pow(2, i)} seconds...`);
        // Ждем перед повторной попыткой (экспоненциальная задержка)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        continue;
      } else {
        // Если это не ошибка подключения или это последняя попытка
        throw error;
      }
    }
  }

  throw lastError;
}

// Определяем типы для данных заказа
interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  size?: string;
  color?: string;
  variantId?: string;
}

interface Recipient {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address?: string;
}

interface OrderData {
  items: OrderItem[];
  total: number;
  discount?: number;
  deliveryPrice?: number;
  deliveryMethod: string;
  paymentMethod: string;
  recipient: Recipient;
  comment?: string;
}

async function resolveRequestUser(request: NextRequest): Promise<{ id: string; role: string } | null> {
  console.log('[ORDERS AUTH] Attempting to resolve user...');
  
  const session = await getSession();
  console.log('[ORDERS AUTH] Session from cookies:', session ? `User ID: ${session.user?.id}, Role: ${session.user?.role}` : 'NULL');
  
  if (session?.user?.id) {
    console.log('[ORDERS AUTH] User authenticated via session cookie');
    return { id: session.user.id, role: session.user.role ?? 'user' };
  }

  console.log('[ORDERS AUTH] No session found, trying bearer token...');
  const bearerUser = await verifyAuth(request);
  if (!bearerUser) {
    console.log('[ORDERS AUTH] No bearer token found or invalid');
    return null;
  }
  
  console.log('[ORDERS AUTH] User authenticated via bearer token');
  return { id: bearerUser.id, role: bearerUser.role ?? 'user' };
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await resolveRequestUser(request);
    if (!currentUser) {
      return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
    }

    // Получаем роль пользователя для определения доступа
    const isAdminUser = currentUser.role === 'admin';

    // Оптимизированный запрос без JOIN
    let ordersList;
    if (isAdminUser) {
      // Администратор получает все заказы
      ordersList = await queryWithRetry(() =>
        db
          .select({
            id: orders.id,
            userId: orders.userId,
            total: orders.total,
            status: orders.status,
            createdAt: orders.createdAt,
            updatedAt: orders.updatedAt,
            discount: orders.discount,
            deliveryPrice: orders.deliveryPrice,
            deliveryMethod: orders.deliveryMethod,
            paymentMethod: orders.paymentMethod,
            recipient: orders.recipient,
            comment: orders.comment,
          })
          .from(orders)
          .orderBy(desc(orders.createdAt))
          .limit(100) // Ограничиваем количество для производительности
      );
      
      // Получаем информацию о пользователях отдельным запросом
      if (ordersList.length > 0) {
        const userIds = [...new Set(ordersList.map(o => o.userId))];
        const usersData: any[] = [];
        
        // Загружаем пользователей батчами
        for (let i = 0; i < Math.min(userIds.length, 10); i++) {
          try {
            const userData = await queryWithRetry(() =>
              db
                .select({
                  id: users.id,
                  email: users.email,
                  name: users.name,
                })
                .from(users)
                .where(eq(users.id, userIds[i]))
            );
            usersData.push(...userData);
          } catch (err) {
            console.warn(`Failed to fetch user ${userIds[i]}`);
          }
        }
        
        const usersMap = new Map(usersData.map(u => [u.id, u]));
        
        // Добавляем информацию о пользователях
        ordersList = ordersList.map(order => ({
          ...order,
          userEmail: usersMap.get(order.userId)?.email || '',
          userName: usersMap.get(order.userId)?.name || '',
        }));
      }
    } else {
      // Обычный пользователь получает только свои заказы
      ordersList = await queryWithRetry(() =>
        db
          .select({
            id: orders.id,
            userId: orders.userId,
            total: orders.total,
            status: orders.status,
            createdAt: orders.createdAt,
            updatedAt: orders.updatedAt,
            discount: orders.discount,
            deliveryPrice: orders.deliveryPrice,
            deliveryMethod: orders.deliveryMethod,
            paymentMethod: orders.paymentMethod,
            recipient: orders.recipient,
            comment: orders.comment,
          })
          .from(orders)
          .where(eq(orders.userId, currentUser.id))
          .orderBy(desc(orders.createdAt))
          .limit(50)
      );
    }

    // Получаем items для всех заказов
    const orderIds = ordersList.map(o => o.id);
    let allItems: any[] = [];
    
    if (orderIds.length > 0) {
      // Загружаем items батчами по 10 заказов
      const batchSize = 10;
      for (let i = 0; i < Math.min(orderIds.length, batchSize); i++) {
        try {
          const batchItems = await queryWithRetry(() =>
            db
              .select({
                id: orderItems.id,
                orderId: orderItems.orderId,
                productId: orderItems.productId,
                variantId: orderItems.variantId,
                name: orderItems.name,
                price: orderItems.price,
                quantity: orderItems.quantity,
                image: orderItems.image,
                size: orderItems.size,
                color: orderItems.color,
              })
              .from(orderItems)
              .where(eq(orderItems.orderId, orderIds[i]))
          );
          allItems = allItems.concat(batchItems);
        } catch (err) {
          console.warn(`Failed to fetch items for order ${orderIds[i]}`);
        }
      }
    }
    
    // Группируем items по orderId
    const itemsByOrder = allItems.reduce((acc, item) => {
      if (!acc[item.orderId]) {
        acc[item.orderId] = [];
      }
      acc[item.orderId].push(item);
      return acc;
    }, {} as Record<string, any[]>);

    // Формируем результат
    const ordersWithItems = ordersList.map((order) => {
      const items = itemsByOrder[order.id] || [];
      
      const baseOrder = {
        id: order.id,
        userId: order.userId,
        total: Number(order.total),
        discount: Number(order.discount || 0),
        deliveryPrice: Number(order.deliveryPrice || 0),
        deliveryMethod: order.deliveryMethod || 'courier',
        paymentMethod: order.paymentMethod || 'card',
        status: order.status as 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled',
        createdAt: order.createdAt?.toString() || new Date().toISOString(),
        updatedAt: order.updatedAt?.toString() || new Date().toISOString(),
        recipient: order.recipient || { firstName: '', lastName: '', phone: '', email: '', address: '' },
        comment: order.comment || null,
        items: items.map((item: any) => ({
          id: item.id,
          productId: item.productId,
          variantId: item.variantId,
          name: item.name || 'Product',
          price: Number(item.price),
          quantity: item.quantity,
          image: item.image || '',
          size: item.size || '',
          color: item.color || ''
        }))
      };

      // Добавляем информацию о пользователе только для админа
      if (isAdminUser && 'userEmail' in order && 'userName' in order) {
        return {
          ...baseOrder,
          userEmail: order.userEmail || '',
          userName: order.userName || '',
        };
      }

      return baseOrder;
    });

    return NextResponse.json(ordersWithItems);
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { 
        message: 'Ошибка при получении заказов', 
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[ORDERS POST] Starting order creation...');
    
    const currentUser = await resolveRequestUser(request);
    console.log('[ORDERS POST] Current user:', currentUser ? `ID: ${currentUser.id}, Role: ${currentUser.role}` : 'NULL');
    
    if (!currentUser) {
      console.error('[ORDERS POST] No authenticated user found');
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 });
    }

    const body = await request.json();
    console.log('[ORDERS POST] Request body received:', JSON.stringify(body, null, 2).substring(0, 500));
    
    const { items, total, discount, deliveryPrice, deliveryMethod, paymentMethod, recipient, comment } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items are required' }, { status: 400 });
    }

    if (!recipient || !recipient.firstName || !recipient.lastName || !recipient.phone || !recipient.email) {
      return NextResponse.json({ error: 'Recipient information is incomplete' }, { status: 400 });
    }

    // Create order transaction with retry logic
    const newOrder = await queryWithRetry(async () => {
      return await db.transaction(async (trx) => {
        // Create the order
        const [order] = await trx.insert(orders).values({
          userId: currentUser.id,
          total: total.toString(), // Convert to string to match decimal field
          discount: discount ? discount.toString() : '0',
          deliveryPrice: deliveryPrice ? deliveryPrice.toString() : '0',
          deliveryMethod,
          paymentMethod,
          status: 'processing', // Changed from 'pending' to 'processing'
          recipient,
          comment: comment || ''
        }).returning();

        // Add items to the order
        for (const item of items) {
          await trx.insert(orderItems).values({
            orderId: order.id,
            productId: item.id,
            variantId: item.variantId || null,
            name: item.name,
            price: item.price.toString(), // Convert to string to match decimal field
            quantity: item.quantity,
            image: item.image || '',
            size: item.size || null,
            color: item.color || null
          });
        }

        return order;
      });
    });

    // Gamification: Award XP for purchase and check achievements
    try {
      await awardXP(currentUser.id, 50, 'Purchase completed', { orderId: newOrder.id });
      await checkAchievements(currentUser.id, 'purchase');
    } catch (gamificationError) {
      console.error('Gamification error:', gamificationError);
      // Don't fail the order if gamification fails
    }

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error: unknown) {
    console.error('Create order error:', error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Определение типа ошибки и предоставление соответствующего сообщения
    if (errorMessage.includes('Connection terminated') || 
        errorMessage.includes('timeout') || 
        errorMessage.includes('Connection pool is closed')) {
      return NextResponse.json(
        { error: 'Database connection error. Please try again later.' }, 
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: errorMessage || 'Failed to create order' }, 
      { status: 500 }
    );
  }
}