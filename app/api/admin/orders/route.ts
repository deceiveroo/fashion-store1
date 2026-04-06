import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !['admin', 'manager', 'support'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allOrders = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt));

    // Get items for each order
    const ordersWithItems = await Promise.all(
      allOrders.map(async (order) => {
        const items = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, order.id));
        return { ...order, items };
      })
    );

    return NextResponse.json(ordersWithItems);
  } catch (error: any) {
    console.error('[ADMIN ORDERS] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
