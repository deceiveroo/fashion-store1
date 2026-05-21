import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { systemNotifications, userNotificationReads, userNotificationDismissals } from '@/lib/schema';
import { eq, desc, or, and, isNull, gt, inArray, notInArray } from 'drizzle-orm';
import { getSession } from '@/lib/server-auth';

// GET /api/notifications - Get user's notifications
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if admin is requesting notifications for a specific user via header
    const targetUserId = request.headers.get('x-user-id');
    const isAdmin = session.user.role === 'admin' || session.user.role === 'manager';
    
    // If admin provides x-user-id header, use that; otherwise use session user
    const userId = (isAdmin && targetUserId) ? targetUserId : session.user.id;
    const userRole = (session.user as any).role || 'customer';

    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('Fetching notifications for user:', userId, 'role:', userRole);
    }

    // Get active notifications for this user
    const now = new Date();
    
    let notifications = await db
      .select({
        id: systemNotifications.id,
        title: systemNotifications.title,
        message: systemNotifications.message,
        type: systemNotifications.type,
        createdAt: systemNotifications.createdAt,
        expiresAt: systemNotifications.expiresAt,
        targetAudience: systemNotifications.targetAudience,
        targetUserIds: systemNotifications.targetUserIds,
      })
      .from(systemNotifications)
      .where(
        and(
          eq(systemNotifications.isActive, true),
          or(
            eq(systemNotifications.targetAudience, 'all'),
            eq(systemNotifications.targetAudience, 'registered'),
            and(
              eq(systemNotifications.targetAudience, 'admins'),
              inArray(userRole, ['admin', 'manager'])
            ),
            eq(systemNotifications.targetAudience, 'specific')
          ),
          or(
            isNull(systemNotifications.expiresAt),
            gt(systemNotifications.expiresAt, now)
          )
        )
      )
      .orderBy(desc(systemNotifications.createdAt));

    // Filter out notifications that don't apply to this user
    notifications = notifications.filter(notification => {
      // For specific audience, check if user is in targetUserIds
      if (notification.targetAudience === 'specific') {
        // Handle both array and string formats from database
        const targetIds = Array.isArray(notification.targetUserIds) 
          ? notification.targetUserIds 
          : typeof notification.targetUserIds === 'string'
            ? JSON.parse(notification.targetUserIds)
            : [];
        
        const isTargeted = targetIds.includes(userId);
        
        // Debug logging
        if (process.env.NODE_ENV === 'development') {
          console.log('Notification filtering:', {
            notificationId: notification.id,
            userId,
            targetUserIds: notification.targetUserIds,
            parsedTargetIds: targetIds,
            isTargeted
          });
        }
        
        return isTargeted;
      }
      return true;
    });

    // Debug logging after filtering
    if (process.env.NODE_ENV === 'development') {
      console.log('Notifications after filtering:', {
        totalBeforeFilter: notifications.length,
        totalAfterFilter: notifications.filter(n => n.targetAudience === 'specific').length + notifications.filter(n => n.targetAudience !== 'specific').length,
        personalNotifications: notifications.filter(n => n.targetAudience === 'specific').map(n => ({
          id: n.id,
          title: n.title,
          targetUserIds: n.targetUserIds
        }))
      });
    }

    // Get read status for each notification
    const readStatuses = await db
      .select({ notificationId: userNotificationReads.notificationId })
      .from(userNotificationReads)
      .where(eq(userNotificationReads.userId, userId));

    const readIds = new Set(readStatuses.map(r => r.notificationId));

    // Get dismissed notifications for this user
    const dismissedStatuses = await db
      .select({ notificationId: userNotificationDismissals.notificationId })
      .from(userNotificationDismissals)
      .where(eq(userNotificationDismissals.userId, userId));

    const dismissedIds = new Set(dismissedStatuses.map(r => r.notificationId));

    // Filter out dismissed notifications and mark with read status
    const notificationsWithStatus = notifications
      .filter(n => !dismissedIds.has(n.id)) // Исключаем скрытые уведомления
      .map(n => ({
        ...n,
        isRead: readIds.has(n.id),
      }));

    // Count unread
    const unreadCount = notificationsWithStatus.filter(n => !n.isRead).length;

    return NextResponse.json({
      success: true,
      notifications: notificationsWithStatus,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST /api/notifications/:id/read - Mark notification as read
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const url = new URL(request.url);
    const notificationId = url.pathname.split('/').pop();

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    // Insert read record (ignore if already exists)
    await db
      .insert(userNotificationReads)
      .values({
        userId,
        notificationId,
      })
      .onConflictDoNothing();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark as read' },
      { status: 500 }
    );
  }
}
