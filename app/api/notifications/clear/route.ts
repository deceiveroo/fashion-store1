import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userNotificationReads, userNotificationDismissals, systemNotifications } from '@/lib/schema';
import { eq, inArray } from 'drizzle-orm';
import { getSession } from '@/lib/server-auth';

// DELETE /api/notifications/clear - Dismiss all notifications for user permanently
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all active notification IDs
    const now = new Date();
    const activeNotifications = await db
      .select({ id: systemNotifications.id })
      .from(systemNotifications)
      .where(eq(systemNotifications.isActive, true));

    if (activeNotifications.length === 0) {
      return NextResponse.json({ 
        success: true,
        message: 'No notifications to clear'
      });
    }

    const notificationIds = activeNotifications.map(n => n.id);

    // Insert dismissal records for all notifications (ignore if already exists)
    await db
      .insert(userNotificationDismissals)
      .values(
        notificationIds.map(notificationId => ({
          userId,
          notificationId,
        }))
      )
      .onConflictDoNothing();

    // Also delete read records
    await db
      .delete(userNotificationReads)
      .where(eq(userNotificationReads.userId, userId));

    return NextResponse.json({ 
      success: true,
      message: 'All notifications permanently dismissed'
    });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    return NextResponse.json(
      { error: 'Failed to clear notifications' },
      { status: 500 }
    );
  }
}
