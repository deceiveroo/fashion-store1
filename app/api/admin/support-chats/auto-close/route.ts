import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supportChatSessions } from '@/lib/schema';
import { lt, eq, and, isNull } from 'drizzle-orm';
import { isAdmin } from '@/lib/server-auth';

/**
 * Автоматическое закрытие неактивных чатов
 * POST /api/admin/support-chats/auto-close
 * Закрывает чаты, которые были неактивны более N дней
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await isAdmin();

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { daysInactive = 7 } = await request.json();

    // Вычисляем дату cutoff
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

    // Находим неактивные чаты (статус 'active' и последнее сообщение старше cutoffDate)
    const inactiveChats = await db
      .select({
        sessionId: supportChatSessions.sessionId,
        lastMessageAt: supportChatSessions.lastMessageAt,
        userName: supportChatSessions.userName,
        userEmail: supportChatSessions.userEmail,
      })
      .from(supportChatSessions)
      .where(
        and(
          eq(supportChatSessions.status, 'active'),
          lt(supportChatSessions.lastMessageAt, cutoffDate)
        )
      );

    if (inactiveChats.length === 0) {
      return NextResponse.json({
        success: true,
        closedCount: 0,
        message: 'Нет неактивных чатов для закрытия',
      });
    }

    // Закрываем найденные чаты
    const sessionIds = inactiveChats.map(chat => chat.sessionId);
    
    await db
      .update(supportChatSessions)
      .set({
        status: 'resolved',
        resolvedAt: new Date(),
        resolvedBy: admin.id,
        updatedAt: new Date(),
        notes: `Автоматически закрыт после ${daysInactive} дней неактивности`,
      })
      .where(
        and(
          eq(supportChatSessions.status, 'active'),
          lt(supportChatSessions.lastMessageAt, cutoffDate)
        )
      );

    console.log(`[AUTO-CLOSE] Closed ${inactiveChats.length} inactive chats`);

    return NextResponse.json({
      success: true,
      closedCount: inactiveChats.length,
      closedChats: inactiveChats.map(chat => ({
        sessionId: chat.sessionId,
        userName: chat.userName || chat.userEmail || 'Гость',
        lastActive: chat.lastMessageAt,
      })),
      message: `Успешно закрыто ${inactiveChats.length} неактивных чатов`,
    });
  } catch (error) {
    console.error('[AUTO-CLOSE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to auto-close chats' },
      { status: 500 }
    );
  }
}
