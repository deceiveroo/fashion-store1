import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supportChatMessages } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { resolveChatSession } from '@/lib/chat-session';

/**
 * Отметить сообщения как прочитанные
 * POST /api/chat/mark-read
 */
export async function POST(request: NextRequest) {
  try {
    // Authoritative session — ignore any sessionId from the body. The user
    // can only mark messages in *their own* session (by auth() or signed cookie).
    const resolved = await resolveChatSession(request);
    const sessionId = resolved.sessionId;

    await db
      .update(supportChatMessages)
      .set({ readByUser: true })
      .where(
        and(
          eq(supportChatMessages.sessionId, sessionId),
          eq(supportChatMessages.sender, 'admin'),
          eq(supportChatMessages.readByUser, false)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[CHAT] Error marking messages as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
}
