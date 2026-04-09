// app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems, users } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { jwtVerify } from 'jose';
import { randomUUID } from 'crypto';
import { getSession } from '@/lib/server-auth';

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

export async function GET(request: NextRequest) {
  try {
    // Проверяем сессию пользователя
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
    }

    // Получаем роль пользователя для определения доступа
    const isAdminUser = session.user.role === 'admin';

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
          .where(eq(orders.userId, session.user.id))
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
    // Используем правильную функцию аутентификации из нашего модуля
    const session = await getSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { items, total, discount, deliveryPrice, deliveryMethod, paymentMethod, recipient, comment } = await request.json();

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
          userId: session.user.id,
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

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error: any) {
    console.error('Create order error:', error);
    
    // Определение типа ошибки и предоставление соответствующего сообщения
    if (error.message?.includes('Connection terminated') || 
        error.message?.includes('timeout') || 
        error.message?.includes('Connection pool is closed')) {
      return NextResponse.json(
        { error: 'Database connection error. Please try again later.' }, 
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to create order' }, 
      { status: 500 }
    );
  }
}