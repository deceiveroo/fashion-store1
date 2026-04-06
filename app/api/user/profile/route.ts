// app/api/user/profile/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, userProfiles, orders, orderItems } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Остальной код без изменений (тот же)
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const profile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.id, user[0].id));

    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, user[0].id))
      .orderBy(orders.createdAt);

    const ordersWithItems = await Promise.all(
      userOrders.map(async (order) => {
        const items = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, order.id));

        return {
          ...order,
          items: items.map(item => ({
            id: item.id,
            name: item.productId,
            price: item.price,
            quantity: item.quantity,
            image: '',
            size: '',
            color: '',
          })),
          createdAt: order.createdAt?.toString() || new Date().toISOString(),
        };
      })
    );

    const userData = {
      id: user[0].id,
      email: user[0].email,
      name: user[0].name,
      firstName: profile[0]?.firstName || user[0].name?.split(' ')[0] || '',
      lastName: profile[0]?.lastName || user[0].name?.split(' ')[1] || '',
      phone: profile[0]?.phone || '',
      image: user[0].image,
      orders: ordersWithItems,
    };

    return NextResponse.json(userData);
  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}