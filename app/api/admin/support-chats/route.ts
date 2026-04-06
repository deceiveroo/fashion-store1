import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supportChatSessions, supportChatMessages } from '@/lib/schema';
import { desc, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || !['admin', 'manager', 'support'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all chat sessions
    const sessions = await db
      .select()
      .from(supportChatSessions)
      .orderBy(desc(supportChatSessions.lastMessageAt));

    return NextResponse.json({ sessions });
  } catch (error: any) {
    console.error('[ADMIN] Error fetching support chats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch support chats' },
      { status: 500 }
    );
  }
}

// Update session status
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || !['admin', 'manager', 'support'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId, status, notes } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (status) {
      updateData.status = status;
      if (status === 'resolved') {
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = session.user.id;
      }
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    await db
      .update(supportChatSessions)
      .set(updateData)
      .where(eq(supportChatSessions.sessionId, sessionId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[ADMIN] Error updating support chat:', error);
    return NextResponse.json(
      { error: 'Failed to update support chat' },
      { status: 500 }
    );
  }
}
