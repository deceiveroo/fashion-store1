import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supportChatSessions, supportChatMessages } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !['admin', 'manager', 'support'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await request.json();
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Delete messages first (FK constraint), then session
    await db.delete(supportChatMessages).where(eq(supportChatMessages.sessionId, sessionId));
    await db.delete(supportChatSessions).where(eq(supportChatSessions.sessionId, sessionId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[ADMIN] Error deleting chat:', error);
    return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 });
  }
}