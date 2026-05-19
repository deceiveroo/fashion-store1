import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { systemNotifications } from '@/lib/schema';
import { getSession } from '@/lib/server-auth';

// POST /api/admin/notifications - Create new notification
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, message, type = 'info', isActive = true } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      );
    }

    const [notification] = await db
      .insert(systemNotifications)
      .values({
        title,
        message,
        type,
        isActive,
      })
      .returning();

    return NextResponse.json({ 
      success: true,
      notification 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}
