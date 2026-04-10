import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems, users } from '@/lib/schema';
import { eq, desc, count, sql } from 'drizzle-orm';
import { getSession, isStaff } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !(await isStaff())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = (page - 1) * limit;

    // Get total count and paginated order IDs in one efficient query
    const [{ total }] = await db
      .select({ total: count() })
      .from(orders);

    // Get paginated order IDs first
    const orderIds = await db
      .select({ id: orders.id })
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    if (orderIds.length === 0) {
      return NextResponse.json({ orders: [], total, page, limit });
    }

    const ids = orderIds.map(o => o.id);

    // Fetch full data for only these orders (no N+1, no over-fetching)
    const rows = await db
      .select({
        orderId: orders.id,
        orderUserId: orders.userId,
        orderTotal: orders.total,
        orderStatus: orders.status,
        orderCreatedAt: orders.createdAt,
        orderComment: orders.comment,
        orderDeliveryMethod: orders.deliveryMethod,
        orderPaymentMethod: orders.paymentMethod,
        orderRecipient: orders.recipient,
        userName: users.name,
        userEmail: users.email,
        itemId: orderItems.id,
        itemName: orderItems.name,
        itemQuantity: orderItems.quantity,
        itemPrice: orderItems.price,
        itemImage: orderItems.image,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .where(sql`${orders.id} = ANY(${sql.raw(`ARRAY[${ids.map(id => `'${id}'`).join(',')}]::text[]`)})`)
      .orderBy(desc(orders.createdAt));

    // Group items by order
    const grouped = new Map<string, any>();
    for (const row of rows) {
      if (!grouped.has(row.orderId)) {
        grouped.set(row.orderId, {
          id: row.orderId,
          userId: row.orderUserId,
          total: row.orderTotal,
          status: row.orderStatus,
          createdAt: row.orderCreatedAt,
          comment: row.orderComment,
          deliveryMethod: row.orderDeliveryMethod,
          paymentMethod: row.orderPaymentMethod,
          recipient: row.orderRecipient,
          userName: row.userName,
          userEmail: row.userEmail,
          items: [],
        });
      }
      if (row.itemId) {
        grouped.get(row.orderId).items.push({
          id: row.itemId,
          name: row.itemName,
          quantity: row.itemQuantity,
          price: row.itemPrice,
          image: row.itemImage,
        });
      }
    }

    // Preserve sort order from orderIds
    const result = ids.map(id => grouped.get(id)).filter(Boolean);

    return NextResponse.json({ orders: result, total, page, limit });
  } catch (error: any) {
    console.error('[ADMIN ORDERS] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
