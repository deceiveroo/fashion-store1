import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supportChatSessions, supportChatMessages } from '@/lib/schema';
import { desc, eq } from 'drizzle-orm';
import { isAdmin } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  try {
    const admin = await isAdmin();

    if (!admin) {
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
    const admin = await isAdmin();

    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId, status, notes, takenOverBy } = await request.json();

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
        updateData.resolvedBy = admin.id;
      }
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }
    
    if (takenOverBy !== undefined) {
      updateData.takenOverBy = takenOverBy;
      updateData.takenOverAt = new Date();
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

// DELETE method to remove individual messages
export async function DELETE(request: NextRequest) {
  try {
    const admin = await isAdmin();

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId, messageId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    if (messageId) {
      // Delete a specific message
      await db
        .delete(supportChatMessages)
        .where(eq(supportChatMessages.id, messageId));
    } else {
      // Delete entire session (admin only)
      if (session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Only admins can delete entire sessions' }, { status: 403 });
      }

      await db.transaction(async (tx) => {
        await tx
          .delete(supportChatMessages)
          .where(eq(supportChatMessages.sessionId, sessionId));
        await tx
          .delete(supportChatSessions)
          .where(eq(supportChatSessions.sessionId, sessionId));
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[ADMIN] Error deleting support chat:', error);
    return NextResponse.json(
      { error: 'Failed to delete support chat' },
      { status: 500 }
    );
  }
}