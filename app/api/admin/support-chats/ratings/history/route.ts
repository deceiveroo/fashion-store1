import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supportChatSessions, chatSatisfactionRatings, users } from '@/lib/schema';
import { eq, desc, avg, count, gte } from 'drizzle-orm';
import { isAdmin } from '@/lib/server-auth';

/**
 * Получить историю оценок операторов
 * GET /api/admin/support-chats/ratings/history
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await isAdmin();

    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = (page - 1) * limit;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Получаем все оценки с информацией об операторах
    const ratings = await db
      .select({
        id: chatSatisfactionRatings.id,
        sessionId: chatSatisfactionRatings.sessionId,
        rating: chatSatisfactionRatings.rating,
        feedback: chatSatisfactionRatings.feedback,
        ratedBy: chatSatisfactionRatings.ratedBy,
        createdAt: chatSatisfactionRatings.createdAt,
        // Информация о сессии
        sessionStatus: supportChatSessions.status,
        sessionCreatedAt: supportChatSessions.createdAt,
        takenOverBy: supportChatSessions.takenOverBy,
        operatorRating: supportChatSessions.operatorRating,
        // Информация об операторе
        operatorName: users.name,
        operatorEmail: users.email,
      })
      .from(chatSatisfactionRatings)
      .leftJoin(supportChatSessions, eq(chatSatisfactionRatings.sessionId, supportChatSessions.sessionId))
      .leftJoin(users, eq(supportChatSessions.takenOverBy, users.id))
      .where(gte(chatSatisfactionRatings.createdAt, startDate))
      .orderBy(desc(chatSatisfactionRatings.createdAt))
      .limit(limit)
      .offset(offset);

    // Общее количество оценок
    const totalCountResult = await db
      .select({ count: count() })
      .from(chatSatisfactionRatings)
      .where(gte(chatSatisfactionRatings.createdAt, startDate));

    const totalCount = totalCountResult[0]?.count || 0;

    // Средняя оценка по всем операторам
    const avgRatingResult = await db
      .select({ avg: avg(chatSatisfactionRatings.rating) })
      .from(chatSatisfactionRatings)
      .where(gte(chatSatisfactionRatings.createdAt, startDate));

    const averageRating = avgRatingResult[0]?.avg ? parseFloat(avgRatingResult[0].avg).toFixed(1) : '0';

    // Статистика по операторам
    const operatorStats = await db
      .select({
        operatorId: supportChatSessions.takenOverBy,
        operatorName: users.name,
        operatorEmail: users.email,
        totalChats: count(supportChatSessions.id),
        avgRating: avg(chatSatisfactionRatings.rating),
      })
      .from(supportChatSessions)
      .leftJoin(users, eq(supportChatSessions.takenOverBy, users.id))
      .leftJoin(chatSatisfactionRatings, eq(supportChatSessions.sessionId, chatSatisfactionRatings.sessionId))
      .where(gte(supportChatSessions.takenOverAt, startDate))
      .groupBy(supportChatSessions.takenOverBy, users.name, users.email)
      .orderBy(desc(count(supportChatSessions.id)));

    return NextResponse.json({
      ratings: ratings.map(r => ({
        ...r,
        operatorDisplayName: r.operatorName || r.operatorEmail || 'Неизвестный оператор',
      })),
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      summary: {
        averageRating: parseFloat(averageRating),
        totalRatings: totalCount,
      },
      operatorStats: operatorStats.map(stat => ({
        operatorId: stat.operatorId,
        operatorName: stat.operatorName || stat.operatorEmail || 'Неизвестный оператор',
        operatorEmail: stat.operatorEmail,
        totalChats: stat.totalChats,
        avgRating: stat.avgRating ? parseFloat(stat.avgRating).toFixed(1) : 'N/A',
      })),
    });
  } catch (error) {
    console.error('[ADMIN] Error fetching ratings history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ratings history' },
      { status: 500 }
    );
  }
}
