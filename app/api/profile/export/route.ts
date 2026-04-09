import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { 
  users, 
  userProfiles, 
  orders, 
  orderItems,
  userWishlistItems, 
  paymentMethods,
  userSessions,
  notificationSettings,
  activityLogs
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Collect all user data
    const userData: any = {
      exportDate: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
    };

    // Get profile
    const profile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, user.id))
      .limit(1);
    
    if (profile.length > 0) {
      userData.profile = profile[0];
    }

    // Get orders
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, user.id));
    
    userData.orders = userOrders;

    // Get order items for each order
    for (const order of userOrders) {
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));
      
      order.items = items;
    }

    // Get wishlist
    const wishlist = await db
      .select()
      .from(userWishlistItems)
      .where(eq(userWishlistItems.userId, user.id));
    
    userData.wishlist = wishlist;

    // Get payment methods (without sensitive data)
    const payments = await db
      .select({
        id: paymentMethods.id,
        type: paymentMethods.type,
        last4: paymentMethods.last4,
        brand: paymentMethods.brand,
        isDefault: paymentMethods.isDefault,
        createdAt: paymentMethods.createdAt,
      })
      .from(paymentMethods)
      .where(eq(paymentMethods.userId, user.id));
    
    userData.paymentMethods = payments;

    // Get sessions
    const sessions = await db
      .select({
        id: userSessions.id,
        device: userSessions.device,
        location: userSessions.location,
        ip: userSessions.ip,
        lastActive: userSessions.lastActive,
        createdAt: userSessions.createdAt,
      })
      .from(userSessions)
      .where(eq(userSessions.userId, user.id));
    
    userData.sessions = sessions;

    // Get notification settings
    const notifications = await db
      .select()
      .from(notificationSettings)
      .where(eq(notificationSettings.userId, user.id))
      .limit(1);
    
    if (notifications.length > 0) {
      userData.notificationSettings = notifications[0];
    }

    // Get activity logs
    const logs = await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.userId, user.id));
    
    userData.activityLogs = logs;

    // Convert to JSON and return as downloadable file
    const jsonData = JSON.stringify(userData, null, 2);
    
    return new NextResponse(jsonData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="user-data-${user.id}-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error('Error exporting user data:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}
