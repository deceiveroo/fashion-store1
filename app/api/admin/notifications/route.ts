import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { systemNotifications, userNotificationReads, userNotificationDismissals } from '@/lib/schema';
import { eq, desc, gt, lt, or, and, sql, count } from 'drizzle-orm';
import { getSession } from '@/lib/server-auth';

// GET /api/admin/notifications - Get all notifications with stats
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status'); // active, inactive
    const type = searchParams.get('type'); // info, success, warning, error
    
    const offset = (page - 1) * limit;

    // Build where clause
    let whereClause = undefined;
    if (status === 'active') {
      whereClause = eq(systemNotifications.isActive, true);
    } else if (status === 'inactive') {
      whereClause = eq(systemNotifications.isActive, false);
    }

    // Get notifications with pagination
    const notifications = await db
      .select()
      .from(systemNotifications)
      .where(whereClause)
      .orderBy(desc(systemNotifications.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ totalCount }] = await db
      .select({ totalCount: count() })
      .from(systemNotifications)
      .where(whereClause);

    // Get stats
    const [activeCount, inactiveCount] = await Promise.all([
      db
        .select({ count: count() })
        .from(systemNotifications)
        .where(eq(systemNotifications.isActive, true)),
      db
        .select({ count: count() })
        .from(systemNotifications)
        .where(eq(systemNotifications.isActive, false)),
    ]);

    // Get read stats for each notification (sample of recent users)
    const notificationsWithStats = await Promise.all(
      notifications.map(async (notification) => {
        const readCount = await db
          .select({ count: count() })
          .from(userNotificationReads)
          .where(eq(userNotificationReads.notificationId, notification.id));

        const dismissCount = await db
          .select({ count: count() })
          .from(userNotificationDismissals)
          .where(eq(userNotificationDismissals.notificationId, notification.id));

        return {
          ...notification,
          readCount: readCount[0]?.count || 0,
          dismissCount: dismissCount[0]?.count || 0,
        };
      })
    );

    return NextResponse.json({
      notifications: notificationsWithStats,
      total: totalCount,
      page,
      limit,
      stats: {
        active: activeCount[0]?.count || 0,
        inactive: inactiveCount[0]?.count || 0,
        total: totalCount,
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST /api/admin/notifications - Create new notification
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, message, type = 'info', isActive = true } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      );
    }

    const [notification] = await db
      .insert(systemNotifications)
      .values({
        title,
        message,
        type,
        isActive,
      })
      .returning();

    return NextResponse.json({ 
      success: true,
      notification 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}
