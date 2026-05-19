import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userNotificationReads, systemNotifications } from '@/lib/schema';
import { eq, inArray } from 'drizzle-orm';
import { getSession } from '@/lib/server-auth';

// DELETE /api/notifications/clear - Clear all notifications for user
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Delete all read records for this user
    await db
      .delete(userNotificationReads)
      .where(eq(userNotificationReads.userId, userId));

    return NextResponse.json({ 
      success: true,
      message: 'All notifications cleared'
    });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    return NextResponse.json(
      { error: 'Failed to clear notifications' },
      { status: 500 }
    );
  }
}
