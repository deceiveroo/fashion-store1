import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { systemNotifications } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { getSession } from '@/lib/server-auth';

// GET /api/admin/notifications - Get all notifications (for admin panel)
export async function GET() {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'admin' && userRole !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const notifications = await db
      .select()
      .from(systemNotifications)
      .orderBy(desc(systemNotifications.createdAt));

    return NextResponse.json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error('Error fetching admin notifications:', error);
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
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'admin' && userRole !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, message, type, targetAudience, targetUserIds, expiresAt } = body;

    // Validate required fields
    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ['info', 'warning', 'success', 'error'];
    if (type && !validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid notification type' },
        { status: 400 }
      );
    }

    // Validate target audience
    const validAudiences = ['all', 'registered', 'admins', 'specific'];
    if (targetAudience && !validAudiences.includes(targetAudience)) {
      return NextResponse.json(
        { error: 'Invalid target audience' },
        { status: 400 }
      );
    }

    // Create notification
    const [notification] = await db
      .insert(systemNotifications)
      .values({
        title,
        message,
        type: type || 'info',
        targetAudience: targetAudience || 'all',
        targetUserIds: targetUserIds || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: session.user.id,
      })
      .returning();

    return NextResponse.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/notifications/:id - Update notification
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'admin' && userRole !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { isActive, title, message } = body;

    const updateData: any = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (title) updateData.title = title;
    if (message) updateData.message = message;

    const [updated] = await db
      .update(systemNotifications)
      .set(updateData)
      .where(eq(systemNotifications.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      notification: updated,
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/notifications/:id - Delete notification
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

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
