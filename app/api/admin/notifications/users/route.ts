import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/server-auth';
import { db } from '@/lib/db';
import { users, userProfiles, systemNotifications, userNotificationReads } from '@/lib/schema';
import { eq, desc, and, isNull, gt, or, inArray, sql } from 'drizzle-orm';

// GET /api/admin/notifications/users - Get all users with their personal notifications
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id || (session.user.role !== 'admin' && session.user.role !== 'manager')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all users with profiles
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        firstName: userProfiles.firstName,
        lastName: userProfiles.lastName,
        avatar: userProfiles.avatar,
        image: users.image,
      })
      .from(users)
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
      .orderBy(desc(users.createdAt));

    // Get all personal notifications (targetAudience = 'specific')
    const personalNotifications = await db
      .select({
        id: systemNotifications.id,
        title: systemNotifications.title,
        message: systemNotifications.message,
        type: systemNotifications.type,
        createdAt: systemNotifications.createdAt,
        targetUserIds: systemNotifications.targetUserIds,
        isActive: systemNotifications.isActive,
      })
      .from(systemNotifications)
      .where(eq(systemNotifications.targetAudience, 'specific'))
      .orderBy(desc(systemNotifications.createdAt));

    // Get read counts and dismissal info for each notification
    const readCounts = await db
      .select({
        notificationId: userNotificationReads.notificationId,
        count: sql<number>`count(*)`.as('count'),
      })
      .from(userNotificationReads)
      .groupBy(userNotificationReads.notificationId);

    const readCountMap = new Map<string, number>();
    readCounts.forEach(rc => {
      readCountMap.set(rc.notificationId, Number(rc.count));
    });

    // Get dismissals
    const { userNotificationDismissals } = await import('@/lib/schema');
    const dismissals = await db
      .select({
        notificationId: userNotificationDismissals.notificationId,
        userId: userNotificationDismissals.userId,
      })
      .from(userNotificationDismissals);

    // Group notifications by user
    const userNotificationsMap = new Map<string, any[]>();
    
    personalNotifications.forEach(notif => {
      // Parse targetUserIds - handle both array and string formats
      let targetIds: string[] = [];
      if (Array.isArray(notif.targetUserIds)) {
        targetIds = notif.targetUserIds;
      } else if (typeof notif.targetUserIds === 'string') {
        try {
          targetIds = JSON.parse(notif.targetUserIds);
        } catch {
          targetIds = [];
        }
      }

      // Add notification to each targeted user
      targetIds.forEach(userId => {
        if (!userNotificationsMap.has(userId)) {
          userNotificationsMap.set(userId, []);
        }
        
        // Check if this user has dismissed the notification
        const isDismissed = dismissals.some(
          d => d.notificationId === notif.id && d.userId === userId
        );

        // Only add if not dismissed
        if (!isDismissed) {
          userNotificationsMap.get(userId)?.push({
            id: notif.id,
            title: notif.title,
            message: notif.message,
            type: notif.type,
            createdAt: notif.createdAt,
            isActive: notif.isActive,
            readCount: readCountMap.get(notif.id) || 0,
            isRead: false, // Will be updated below
            isDismissed: false,
          });
        }
      });
    });

    // Now check which notifications each user has read
    const reads = await db
      .select({
        notificationId: userNotificationReads.notificationId,
        userId: userNotificationReads.userId,
      })
      .from(userNotificationReads);

    // Mark notifications as read for each user
    reads.forEach(read => {
      const userNotifs = userNotificationsMap.get(read.userId);
      if (userNotifs) {
        const notif = userNotifs.find(n => n.id === read.notificationId);
        if (notif) {
          notif.isRead = true;
        }
      }
    });

    // Build response with users who have notifications
    const usersWithNotifications = allUsers
      .map(user => {
        const userNotifs = userNotificationsMap.get(user.id) || [];
        const unreadCount = userNotifs.filter(n => !n.isRead).length;
        
        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar || user.image,
          role: user.role,
          createdAt: user.createdAt,
          notifications: userNotifs,
          totalNotifications: userNotifs.length,
          unreadCount: unreadCount,
        };
      })
      .filter(user => user.totalNotifications > 0);

    return NextResponse.json({
      success: true,
      users: usersWithNotifications,
      total: usersWithNotifications.length,
    });
  } catch (error) {
    console.error('Error fetching users with notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
