import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supportChatMessages } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/server-auth';

/**
 * Отметить сообщения как прочитанные
 * POST /api/chat/mark-read
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId, messageIds } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Если указаны конкретные messageIds - отмечаем их
    if (messageIds && Array.isArray(messageIds) && messageIds.length > 0) {
      await db
        .update(supportChatMessages)
        .set({ readByUser: true })
        .where(
          and(
            eq(supportChatMessages.sessionId, sessionId),
            eq(supportChatMessages.sender, 'admin'), // Только сообщения от админа
          )
        );
    } else {
      // Иначе отмечаем ВСЕ сообщения от админа в этой сессии как прочитанные
      await db
        .update(supportChatMessages)
        .set({ readByUser: true })
        .where(
          and(
            eq(supportChatMessages.sessionId, sessionId),
            eq(supportChatMessages.sender, 'admin'),
            eq(supportChatMessages.readByUser, false) // Только непрочитанные
          )
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[CHAT] Error marking messages as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
}
