import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supportChatSessions, chatSatisfactionRatings } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { isStaff } from '@/lib/server-auth';

/**
 * Завершение чата с сохранением истории
 * POST /api/admin/support-chats/[sessionId]/complete
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const admin = await isStaff();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await params;
    const { rating, feedback } = await request.json();

    // Проверяем существование сессии
    const [session] = await db
      .select()
      .from(supportChatSessions)
      .where(eq(supportChatSessions.sessionId, sessionId))
      .limit(1);

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Если сессия уже завершена, возвращаем ошибку
    if (session.status === 'resolved' || session.status === 'archived') {
      return NextResponse.json({ error: 'Session already completed' }, { status: 400 });
    }

    // Обновляем статус сессии
    await db
      .update(supportChatSessions)
      .set({
        status: 'resolved',
        resolvedAt: new Date(),
        resolvedBy: admin.id,
        updatedAt: new Date(),
      })
      .where(eq(supportChatSessions.sessionId, sessionId));

    // Если есть оценка от админа, сохраняем её
    if (rating && typeof rating === 'number' && rating >= 1 && rating <= 10) {
      await db
        .update(supportChatSessions)
        .set({
          operatorRating: rating,
          operatorRatedAt: new Date(),
          operatorRatedBy: admin.id,
        })
        .where(eq(supportChatSessions.sessionId, sessionId));
    }

    // Если есть отзыв от пользователя (через форму оценки)
    if (feedback && session.userId) {
      await db.insert(chatSatisfactionRatings).values({
        id: crypto.randomUUID(),
        sessionId: sessionId,
        rating: rating || 5,
        feedback: feedback,
        ratedBy: session.userId,
        createdAt: new Date(),
      });

      // Также обновим customerSatisfaction в сессии
      await db
        .update(supportChatSessions)
        .set({
          customerSatisfaction: rating || 5,
        })
        .where(eq(supportChatSessions.sessionId, sessionId));
    }

    return NextResponse.json({ 
      success: true,
      message: 'Чат успешно завершен'
    });
  } catch (error) {
    console.error('[ADMIN] Error completing chat:', error);
    return NextResponse.json(
      { error: 'Failed to complete chat' },
      { status: 500 }
    );
  }
}
