// app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems, users } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { jwtVerify } from 'jose';
import { randomUUID } from 'crypto';
import { getSession, isAdmin } from '@/lib/server-auth';

// Helper function with retry logic for Supabase pooler
async function queryWithRetry<T>(queryFn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await queryFn();
    } catch (error: any) {
      lastError = error;
      const isConnectionError = 
        error.message?.includes('Connection terminated') ||
        error.message?.includes('ECONNRESET') ||
        error.message?.includes('Pool is draining and cannot accept new connections') ||
        error.code === 'ECONNRESET';
      
      if (isConnectionError && i < maxRetries - 1) {
        console.warn(`Query failed (attempt ${i + 1}), retrying...`, error.message);
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
        continue;
      }
      throw error;
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

    // Проверяем роль администратора один раз
    const isAdminUser = await isAdmin();

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
        discount: 0,
        deliveryPrice: 0,
        deliveryMethod: 'courier',
        paymentMethod: 'card',
        status: order.status as 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled',
        createdAt: order.createdAt?.toString() || new Date().toISOString(),
        updatedAt: order.updatedAt?.toString() || new Date().toISOString(),
        recipient: { firstName: '', lastName: '', phone: '', email: '', address: '' },
        comment: null,
        items: items.map((item: any) => ({
          id: item.id,
          productId: item.productId,
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

// Функция аутентификации для POST запросов (для создания заказа)
async function authenticateToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return null;
  }

  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  const secret = new TextEncoder().encode(JWT_SECRET);

  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as { userId: string; email: string; role?: string };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateToken(request);
  if (!user) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }

  try {
    const orderData: OrderData = await request.json();
    console.log('Received order data:', JSON.stringify(orderData, null, 2));
    
    // Проверяем обязательные поля
    if (!orderData.deliveryMethod) {
      return NextResponse.json(
        { message: 'Метод доставки обязателен' },
        { status: 400 }
      );
    }
    
    if (!orderData.paymentMethod) {
      return NextResponse.json(
        { message: 'Метод оплаты обязателен' },
        { status: 400 }
      );
    }
    
    if (!orderData.recipient) {
      return NextResponse.json(
        { message: 'Информация о получателе обязательна' },
        { status: 400 }
      );
    }
    
    // Проверяем, что все обязательные поля получателя заполнены
    if (!orderData.recipient.firstName || !orderData.recipient.lastName || 
        !orderData.recipient.phone || !orderData.recipient.email) {
      return NextResponse.json(
        { 
          message: 'Все поля получателя обязательны для заполнения',
          details: {
            firstName: !!orderData.recipient.firstName,
            lastName: !!orderData.recipient.lastName,
            phone: !!orderData.recipient.phone,
            email: !!orderData.recipient.email
          }
        },
        { status: 400 }
      );
    }
    
    if (!orderData.items || orderData.items.length === 0) {
      return NextResponse.json(
        { message: 'Заказ должен содержать хотя бы один товар' },
        { status: 400 }
      );
    }
    
    // Проверяем элементы заказа
    for (const item of orderData.items) {
      if (!item.id || !item.name || item.price === undefined || !item.quantity) {
        return NextResponse.json(
          { message: 'Каждый товар должен содержать id, name, price и quantity' },
          { status: 400 }
        );
      }
    }

    // Валидация заказа
    if (orderData.total <= 0) {
      return NextResponse.json(
        { message: 'Сумма заказа должна быть положительной' },
        { status: 400 }
      );
    }

    // Создаем заказ
    const [newOrder] = await queryWithRetry(() =>
      db.insert(orders).values({
        id: randomUUID(),
        userId: user.userId,
        total: orderData.total.toString(),
        discount: (orderData.discount || 0).toString(),
        deliveryPrice: (orderData.deliveryPrice || 0).toString(),
        deliveryMethod: orderData.deliveryMethod,
        paymentMethod: orderData.paymentMethod,
        status: 'processing',
        recipient: orderData.recipient,
        comment: orderData.comment || null,
        createdAt: new Date(),
      }).returning()
    );
    
    console.log('Заказ создан:', newOrder);

    // Создаем элементы заказа
    const orderItemsData = orderData.items.map((item) => ({
      id: randomUUID(),
      orderId: newOrder.id,
      productId: item.id,
      name: item.name,
      price: item.price.toString(),
      quantity: item.quantity,
      image: item.image || '',
      size: item.size || null,
      color: item.color || null,
      createdAt: new Date()
    }));
    
    console.log('Order items data:', orderItemsData);

    await queryWithRetry(() =>
      db.insert(orderItems).values(orderItemsData)
    );

    // Получаем полный заказ с элементами
    const orderItemsList = await queryWithRetry(() =>
      db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, newOrder.id))
    );

    const fullOrder = {
      id: newOrder.id,
      items: orderItemsList.map(item => ({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        quantity: item.quantity,
        image: item.image,
        size: item.size || '',
        color: item.color || ''
      })),
      total: Number(newOrder.total),
      discount: Number(newOrder.discount || 0),
      deliveryPrice: Number(newOrder.deliveryPrice || 0),
      deliveryMethod: newOrder.deliveryMethod,
      paymentMethod: newOrder.paymentMethod,
      status: newOrder.status as 'processing' | 'shipped' | 'delivered' | 'cancelled',
      createdAt: newOrder.createdAt?.toString() || new Date().toISOString(),
      recipient: typeof newOrder.recipient === 'string' 
        ? JSON.parse(newOrder.recipient) 
        : newOrder.recipient,
      comment: newOrder.comment
    };

    return NextResponse.json(fullOrder);
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { 
        message: 'Ошибка при создании заказа', 
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}