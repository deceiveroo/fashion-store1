import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems, products, productImages, users } from '@/lib/schema';
import { eq, and, gte, isNull } from 'drizzle-orm';
import { isStaff } from '@/lib/server-auth';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { subHours } from 'date-fns';
import { getJwtSecret } from '@/lib/jwt-secret';

const JWT_SECRET = getJwtSecret();

// GET /api/admin/abandoned-carts - Get abandoned carts (incomplete orders)
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let userId: string;
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      userId = payload.userId as string;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const staffUser = await isStaff();
    if (!staffUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get orders that are in 'pending' or 'draft' state and older than 2 hours
    const twoHoursAgo = subHours(new Date(), 2);
    
    const abandonedOrders = await db
      .select({
        orderId: orders.id,
        userId: orders.userId,
        userEmail: users.email,
        userName: users.name,
        totalAmount: orders.total,
        createdAt: orders.createdAt,
        itemCount: orderItems.quantity,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .where(
        and(
          eq(orders.status, 'pending'),
          gte(orders.createdAt, twoHoursAgo),
          isNull(orders.paymentIntentId) // No payment initiated
        )
      )
      .orderBy(orders.createdAt);

    // Group by order and calculate totals
    const groupedCarts: any = {};
    abandonedOrders.forEach((order: any) => {
      if (!groupedCarts[order.orderId]) {
        groupedCarts[order.orderId] = {
          id: order.orderId,
          userId: order.userId,
          userEmail: order.userEmail,
          userName: order.userName,
          totalAmount: order.totalAmount,
          createdAt: order.createdAt,
          items: [],
        };
      }
      if (order.itemCount) {
        groupedCarts[order.orderId].items.push({ quantity: order.itemCount });
      }
    });

    const cartsArray = Object.values(groupedCarts).map((cart: any) => ({
      ...cart,
      itemCount: cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0),
    }));

    return NextResponse.json({
      abandonedCarts: cartsArray,
      total: cartsArray.length,
    });
  } catch (error) {
    console.error('Error fetching abandoned carts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch abandoned carts' },
      { status: 500 }
    );
  }
}
