import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/server-auth';
import { db } from '@/lib/db';
import { systemNotifications } from '@/lib/schema';

// POST /api/admin/notifications/send-personal - Send personal notification to specific user
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id || (session.user.role !== 'admin' && session.user.role !== 'manager')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, title, message, type = 'info' } = body;

    // Validation
    if (!userId || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, title, message' },
        { status: 400 }
      );
    }

    if (!['info', 'warning', 'success', 'error'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid notification type. Must be: info, warning, success, or error' },
        { status: 400 }
      );
    }

    // Create personal notification
    const [notification] = await db.insert(systemNotifications).values({
      title,
      message,
      type: type as 'info' | 'warning' | 'success' | 'error',
      targetAudience: 'specific',
      targetUserIds: [userId],
      isActive: true,
      createdBy: session.user.id,
      createdAt: new Date(),
    }).returning();

    return NextResponse.json({
      success: true,
      notification: {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        targetAudience: notification.targetAudience,
        targetUserIds: notification.targetUserIds,
        createdAt: notification.createdAt,
      },
    });
  } catch (error) {
    console.error('Error sending personal notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
