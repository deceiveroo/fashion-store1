import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supportChatMessages } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { isStaff } from '@/lib/server-auth';

/**
 * Админ отмечает сообщения пользователя как прочитанные
 * POST /api/admin/support-chats/mark-read
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await isStaff();
    
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Отмечаем все сообщения от пользователя в этой сессии как прочитанные админом
    await db
      .update(supportChatMessages)
      .set({ readByAdmin: true })
      .where(
        and(
          eq(supportChatMessages.sessionId, sessionId),
          eq(supportChatMessages.sender, 'user'), // Только сообщения от пользователя
          eq(supportChatMessages.readByAdmin, false) // Только непрочитанные
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ADMIN] Error marking messages as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
}
