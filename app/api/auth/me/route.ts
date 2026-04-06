// app/api/auth/me/route.ts
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';
import { users, orders, orderItems } from '@/lib/schema';
import { eq, inArray } from 'drizzle-orm';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'your-secret-key';
const secret = new TextEncoder().encode(JWT_SECRET);

async function getUserId(request: NextRequest): Promise<string | null> {
  // Try NextAuth session first
  const session = await auth();
  if (session?.user?.id) return session.user.id;

  // Try Bearer token
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const { payload } = await jwtVerify(token, secret);
      return payload.userId as string || payload.sub as string;
    } catch {}
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user data
    const userData = await safeQuery(() =>
      db.select({
        id: users.id,
        email: users.email,
        name: users.name,
        image: users.image,
        role: users.role,
      }).from(users).where(eq(users.id, userId)).limit(1)
    );

    if (!userData || userData.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userData[0];

    // Get user orders
    let ordersWithItems: any[] = [];
    try {
      const userOrders = await safeQuery(() =>
        db.select({
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
          createdAt: orders.createdAt,
        }).from(orders).where(eq(orders.userId, userId))
      ) || [];

      // Get ALL items in one query
      const orderIds = userOrders.map(o => o.id);
      let allItems: any[] = [];
      if (orderIds.length > 0) {
        const fetchedItems = await safeQuery(() =>
          db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds))
        );
        if (fetchedItems) allItems = fetchedItems;
      }

      // Group items by orderId
      const itemsByOrder = allItems.reduce((acc: any, item: any) => {
        if (!acc[item.orderId]) acc[item.orderId] = [];
        acc[item.orderId].push({
          id: item.id,
          name: item.name || '',
          price: Number(item.price),
          quantity: item.quantity,
          image: item.image || '',
          size: item.size || '',
          color: item.color || '',
        });
        return acc;
      }, {});

      ordersWithItems = userOrders.map(order => ({
        id: order.id,
        items: itemsByOrder[order.id] || [],
        total: Number(order.total),
        discount: Number(order.discount || 0),
        deliveryPrice: Number(order.deliveryPrice || 0),
        deliveryMethod: order.deliveryMethod || 'pickup',
        paymentMethod: order.paymentMethod || 'cash',
        status: order.status,
        createdAt: order.createdAt?.toString() || new Date().toISOString(),
        recipient: typeof order.recipient === 'string' ? JSON.parse(order.recipient) : order.recipient,
        comment: order.comment,
      }));
    } catch (error) {
      console.error('Error fetching orders:', error);
    }

    const nameParts = user.name?.split(' ') || ['', ''];

    return Response.json({
      id: user.id,
      email: user.email,
      name: user.name,
      firstName: nameParts[0] || '',
      lastName: nameParts[1] || '',
      image: user.image,
      role: user.role,
      orders: ordersWithItems,
    });
  } catch (error: any) {
    console.error('Error in /api/auth/me:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}