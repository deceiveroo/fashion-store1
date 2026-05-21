import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { systemNotifications } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/server-auth';

// PATCH /api/admin/notifications/[id] - Update notification
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id || (session.user.role !== 'admin' && session.user.role !== 'manager')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = params.id;
    const body = await request.json();
    const { title, message, type, isActive } = body;

    // Check if notification exists
    const existing = await db
      .select()
      .from(systemNotifications)
      .where(eq(systemNotifications.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Update notification
    const [updated] = await db
      .update(systemNotifications)
      .set({
        ...(title !== undefined && { title }),
        ...(message !== undefined && { message }),
        ...(type !== undefined && { type }),
        ...(isActive !== undefined && { isActive }),
      })
      .where(eq(systemNotifications.id, id))
      .returning();

    return NextResponse.json({ 
      success: true,
      notification: updated 
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/notifications/[id] - Delete notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = params.id;

    // Check if notification exists
    const existing = await db
      .select()
      .from(systemNotifications)
      .where(eq(systemNotifications.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Delete notification (cascade will handle related reads/dismissals)
    await db
      .delete(systemNotifications)
      .where(eq(systemNotifications.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}
