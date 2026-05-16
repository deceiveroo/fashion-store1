import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supportChatMessages, supportChatSessions } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { isStaff } from '@/lib/server-auth';

async function deleteChat(sessionId: string, messageId?: string) {
  if (messageId) {
    await db.delete(supportChatMessages).where(eq(supportChatMessages.id, messageId));
    return;
  }
  await db.transaction(async (tx) => {
    await tx.delete(supportChatMessages).where(eq(supportChatMessages.sessionId, sessionId));
    await tx.delete(supportChatSessions).where(eq(supportChatSessions.sessionId, sessionId));
  });
}

export async function DELETE(request: NextRequest) {
  try {
    const staff = await isStaff();
    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { sessionId, messageId } = await request.json();
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }
    await deleteChat(sessionId, messageId);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[ADMIN] Error deleting support chat:', errorMessage);
    return NextResponse.json({ error: 'Failed to delete support chat' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const staff = await isStaff();
    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId, messageId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    await deleteChat(sessionId, messageId);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[ADMIN] Error deleting support chat:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to delete support chat' },
      { status: 500 }
    );
  }
}