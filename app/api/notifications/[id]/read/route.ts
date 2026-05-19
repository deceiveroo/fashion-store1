import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userNotificationReads } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/server-auth';

// POST /api/notifications/[id]/read - Mark single notification as read
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { id: notificationId } = await params;

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
