// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, orders, orderItems } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'your-secret-key';
const secret = new TextEncoder().encode(JWT_SECRET);

export async function GET(request: NextRequest) {
  let userId: string | null = null;

  // Сначала пробуем получить сессию из cookies (NextAuth)
  const session = await auth();
  if (session?.user?.id) {
    userId = session.user.id;
  } else {
    // Если не получилось, пробуем Bearer токен
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const { payload } = await jwtVerify(token, secret);
        userId = payload.userId as string;
      } catch (error) {
        console.error('Invalid token:', error);
      }
    }
  }
  
  if (!userId) {
    return Response.json({ error: 'Пользователь не авторизован' }, { status: 401 });
  }

  try {
    // Находим пользователя
    const [userData] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        image: users.image,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userData) {
      return Response.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    // Находим заказы пользователя (с обработкой ошибок)
    let ordersWithItems = [];
    try {
      const userOrders = await db
        .select({
          id: orders.id,
          userId: orders.userId,
          total: orders.total,
          discount: orders.discount,
          deliveryPrice: orders.deliveryPrice,
          deliveryMethod: orders.deliveryMethod,
          paymentMethod: orders.paymentMethod,
          status: orders.status,
          recipient: orders.recipient,
          comment: orders.comment,
          createdAt: orders.createdAt
        })
        .from(orders)
        .where(eq(orders.userId, userId));

      // Для каждого заказа находим items
      ordersWithItems = await Promise.all(
        userOrders.map(async (order) => {
          try {
            const items = await db
              .select()
              .from(orderItems)
              .where(eq(orderItems.orderId, order.id));

            return {
              id: order.id,
              items: items.map(item => ({
                id: item.id,
                name: item.name || '',
                price: Number(item.price),
                quantity: item.quantity,
                image: item.image || '',
                size: item.size || '',
                color: item.color || ''
              })),
              total: Number(order.total),
              discount: Number(order.discount || 0),
              deliveryPrice: Number(order.deliveryPrice || 0),
              deliveryMethod: order.deliveryMethod || 'pickup',
              paymentMethod: order.paymentMethod || 'cash',
              status: order.status as 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled',
              createdAt: order.createdAt?.toString() || new Date().toISOString(),
              recipient: typeof order.recipient === 'string' ? JSON.parse(order.recipient) : order.recipient,
              comment: order.comment
            };
          } catch (error) {
            console.error('Error fetching order items:', error);
            return {
              id: order.id,
              items: [],
              total: Number(order.total),
              discount: 0,
              deliveryPrice: 0,
              deliveryMethod: 'pickup',
              paymentMethod: 'cash',
              status: order.status as 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled',
              createdAt: order.createdAt?.toString() || new Date().toISOString(),
              recipient: null,
              comment: null
            };
          }
        })
      );
    } catch (error) {
      console.error('Error fetching orders:', error);
      ordersWithItems = [];
    }

    const nameParts = userData.name?.split(' ') || ['', ''];

    return Response.json({
      id: userData.id,
      email: userData.email,
      name: userData.name,
      firstName: nameParts[0] || '',
      lastName: nameParts[1] || '',
      phone: '',
      image: userData.image,
      role: userData.role || 'user',
      orders: ordersWithItems
    });
  } catch (error) {
    console.error('Ошибка при получении данных пользователя:', error);
    return Response.json({ error: 'Ошибка при получении данных пользователя' }, { status: 500 });
  }
}
