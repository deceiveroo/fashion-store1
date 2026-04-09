import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, orders, wishlist, paymentMethods, notificationSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all user data
    const [userData] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, user.id));

    const userWishlist = await db
      .select()
      .from(wishlist)
      .where(eq(wishlist.userId, user.id));

    const userPaymentMethods = await db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.userId, user.id));

    const userNotifications = await db
      .select()
      .from(notificationSettings)
      .where(eq(notificationSettings.userId, user.id))
      .limit(1);

    // Compile all data
    const exportData = {
      exportDate: new Date().toISOString(),
      personalInfo: {
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        address: userData.address,
        createdAt: userData.createdAt,
      },
      orders: userOrders.map(order => ({
        id: order.id,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt,
        items: order.items,
      })),
      wishlist: userWishlist,
      paymentMethods: userPaymentMethods.map(method => ({
        id: method.id,
        type: method.type,
        brand: method.brand,
        last4: method.last4,
        isDefault: method.isDefault,
      })),
      notificationSettings: userNotifications[0] || {},
    };

    // Return as JSON file
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="user-data-${user.id}-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error('Error exporting user data:', error);
    return NextResponse.json({ error: 'Failed to export user data' }, { status: 500 });
  }
}
