import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userNotificationReads, users, userProfiles } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/server-auth';

// GET /api/admin/notifications/[id]/readers - Get list of users who read the notification with avatars
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

    // Get all users who read this notification with their profile info (including avatars)
    const readers = await db
      .select({
        userId: userNotificationReads.userId,
        readAt: userNotificationReads.readAt,
        firstName: userProfiles.firstName,
        lastName: userProfiles.lastName,
        avatar: userProfiles.avatar,
        email: users.email,
      })
      .from(userNotificationReads)
      .innerJoin(users, eq(users.id, userNotificationReads.userId))
      .leftJoin(userProfiles, eq(userProfiles.userId, userNotificationReads.userId))
      .where(eq(userNotificationReads.notificationId, notificationId))
      .orderBy(userNotificationReads.readAt);

    return NextResponse.json({
      success: true,
      readers: readers.map(reader => ({
        userId: reader.userId,
        email: reader.email,
        firstName: reader.firstName,
        lastName: reader.lastName,
        avatar: reader.avatar,
        displayName: reader.firstName && reader.lastName 
          ? `${reader.firstName} ${reader.lastName}`
          : reader.email?.split('@')[0] || 'Пользователь',
        readAt: reader.readAt,
      })),
      total: readers.length,
    });
  } catch (error) {
    console.error('Error fetching notification readers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch readers' },
      { status: 500 }
    );
  }
}
