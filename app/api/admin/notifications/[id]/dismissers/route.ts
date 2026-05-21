import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userNotificationDismissals, users, userProfiles } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/server-auth';

// GET /api/admin/notifications/[id]/dismissers - Get list of users who dismissed the notification with avatars
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: notificationId } = await params;

    // Get all users who dismissed this notification with their profile info (including avatars)
    const dismissers = await db
      .select({
        userId: userNotificationDismissals.userId,
        dismissedAt: userNotificationDismissals.dismissedAt,
        firstName: userProfiles.firstName,
        lastName: userProfiles.lastName,
        avatar: userProfiles.avatar,
        email: users.email,
      })
      .from(userNotificationDismissals)
      .innerJoin(users, eq(users.id, userNotificationDismissals.userId))
      .leftJoin(userProfiles, eq(userProfiles.userId, userNotificationDismissals.userId))
      .where(eq(userNotificationDismissals.notificationId, notificationId))
      .orderBy(userNotificationDismissals.dismissedAt);

    return NextResponse.json({
      success: true,
      dismissers: dismissers.map(dismisser => ({
        userId: dismisser.userId,
        email: dismisser.email,
        firstName: dismisser.firstName,
        lastName: dismisser.lastName,
        avatar: dismisser.avatar,
        displayName: dismisser.firstName && dismisser.lastName 
          ? `${dismisser.firstName} ${dismisser.lastName}`
          : dismisser.email?.split('@')[0] || 'Пользователь',
        dismissedAt: dismisser.dismissedAt,
      })),
      total: dismissers.length,
    });
  } catch (error) {
    console.error('Error fetching notification dismissers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dismissers' },
      { status: 500 }
    );
  }
}
