import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supportChatMessages, supportChatSessions } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { isAdmin } from '@/lib/server-auth';

export async function POST(request: NextRequest) {
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