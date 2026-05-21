import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supportChatSessions, chatSatisfactionRatings } from '@/lib/schema';
import { eq, count, sql, gte, lte, and, avg } from 'drizzle-orm';
import { isAdmin } from '@/lib/server-auth';

/**
 * Расширенная аналитика чатов с SLA метриками
 * GET /api/admin/support-chats/analytics
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await isAdmin();

    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 1. Общая статистика за период
    const overviewStats = await db
      .select({
        totalSessions: count(),
        resolvedSessions: count(sql`CASE WHEN ${supportChatSessions.status} = 'resolved' THEN 1 END`),
        activeSessions: count(sql`CASE WHEN ${supportChatSessions.status} = 'active' THEN 1 END`),
        avgFirstResponseTime: avg(supportChatSessions.firstResponseTime),
        avgResolutionTime: avg(supportChatSessions.resolutionTime),
        aiResolvedCount: count(sql`CASE WHEN ${supportChatSessions.aiDisabled} = false AND ${supportChatSessions.status} = 'resolved' THEN 1 END`),
        operatorHandledCount: count(sql`CASE WHEN ${supportChatSessions.takenOverBy} IS NOT NULL THEN 1 END`),
      })
      .from(supportChatSessions)
      .where(gte(supportChatSessions.createdAt, startDate));

    // 2. Статистика удовлетворенности клиентов
    const satisfactionStats = await db
      .select({
        totalRatings: count(),
        avgSatisfaction: avg(chatSatisfactionRatings.rating),
        fiveStars: count(sql`CASE WHEN ${chatSatisfactionRatings.rating} = 5 THEN 1 END`),
        fourStars: count(sql`CASE WHEN ${chatSatisfactionRatings.rating} = 4 THEN 1 END`),
        threeStars: count(sql`CASE WHEN ${chatSatisfactionRatings.rating} = 3 THEN 1 END`),
        twoStars: count(sql`CASE WHEN ${chatSatisfactionRatings.rating} = 2 THEN 1 END`),
        oneStar: count(sql`CASE WHEN ${chatSatisfactionRatings.rating} = 1 THEN 1 END`),
      })
      .from(chatSatisfactionRatings)
      .where(gte(chatSatisfactionRatings.createdAt, startDate));

    // 3. Сообщения по дням (для графика)
    const messagesPerDay = await db.execute(sql`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM support_chat_messages
      WHERE created_at >= ${startDate.toISOString()}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT ${days}
    `);

    // 4. Сессии по статусам
    const sessionsByStatus = await db
      .select({
        status: supportChatSessions.status,
        count: count(),
      })
      .from(supportChatSessions)
      .where(gte(supportChatSessions.createdAt, startDate))
      .groupBy(supportChatSessions.status);

    // 5. Почасовая активность (heatmap)
    const hourlyActivity = await db.execute(sql`
      SELECT 
        EXTRACT(HOUR FROM created_at) as hour,
        COUNT(*) as count
      FROM support_chat_messages
      WHERE created_at >= ${startDate.toISOString()}
      GROUP BY EXTRACT(HOUR FROM created_at)
      ORDER BY hour
    `);

    // 6. Топ категорий обращений
    const topCategories = await db
      .select({
        category: supportChatSessions.category,
        count: count(),
      })
      .from(supportChatSessions)
      .where(
        and(
          gte(supportChatSessions.createdAt, startDate),
          sql`${supportChatSessions.category} IS NOT NULL`
        )
      )
      .groupBy(supportChatSessions.category)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(10);

    // 7. SLA метрики по операторам
    const operatorPerformance = await db.execute(sql`
      SELECT 
        u.name as operator_name,
        u.email as operator_email,
        COUNT(DISTINCT s.id) as handled_chats,
        AVG(s.first_response_time) FILTER (WHERE s.first_response_time IS NOT NULL) as avg_response_time,
        AVG(s.resolution_time) FILTER (WHERE s.resolution_time IS NOT NULL) as avg_resolution_time,
        AVG(sr.rating) FILTER (WHERE sr.rating IS NOT NULL) as avg_satisfaction
      FROM support_chat_sessions s
      LEFT JOIN users u ON s.taken_over_by = u.id
      LEFT JOIN chat_satisfaction_ratings sr ON s.session_id = sr.session_id
      WHERE s.taken_over_by IS NOT NULL
        AND s.created_at >= ${startDate.toISOString()}
      GROUP BY u.id, u.name, u.email
      ORDER BY handled_chats DESC
    `);

    // Форматируем данные
    const formatDuration = (seconds: number | string | null): string => {
      if (!seconds) return 'N/A';
      const secs = typeof seconds === 'string' ? parseFloat(seconds) : seconds;
      if (secs < 60) return `${Math.round(secs)} сек`;
      if (secs < 3600) return `${Math.round(secs / 60)} мин`;
      return `${Math.round(secs / 3600)} ч ${Math.round((secs % 3600) / 60)} мин`;
    };

    const aiResolutionRate = overviewStats[0].totalSessions > 0
      ? ((overviewStats[0].aiResolvedCount || 0) / overviewStats[0].totalSessions * 100).toFixed(1)
      : '0';

    return NextResponse.json({
      period: `${days} дней`,
      overview: {
        totalSessions: overviewStats[0].totalSessions || 0,
        resolvedSessions: overviewStats[0].resolvedSessions || 0,
        activeSessions: overviewStats[0].activeSessions || 0,
        avgFirstResponseTime: formatDuration(overviewStats[0].avgFirstResponseTime),
        avgResolutionTime: formatDuration(overviewStats[0].avgResolutionTime),
        aiResolutionRate: `${aiResolutionRate}%`,
        operatorHandledCount: overviewStats[0].operatorHandledCount || 0,
      },
      satisfaction: {
        totalRatings: satisfactionStats[0].totalRatings || 0,
        avgSatisfaction: satisfactionStats[0].avgSatisfaction ? parseFloat(satisfactionStats[0].avgSatisfaction).toFixed(1) : 'N/A',
        distribution: {
          5: satisfactionStats[0].fiveStars || 0,
          4: satisfactionStats[0].fourStars || 0,
          3: satisfactionStats[0].threeStars || 0,
          2: satisfactionStats[0].twoStars || 0,
          1: satisfactionStats[0].oneStar || 0,
        },
      },
      messagesPerDay: messagesPerDay.rows.map((row: any) => ({
        date: row.date,
        count: parseInt(row.count),
      })),
      sessionsByStatus: sessionsByStatus.map(row => ({
        status: row.status,
        count: row.count,
      })),
      hourlyActivity: hourlyActivity.rows.map((row: any) => ({
        hour: parseInt(row.hour),
        count: parseInt(row.count),
      })),
      topCategories: topCategories.map(row => ({
        category: row.category || 'Без категории',
        count: row.count,
      })),
      operatorPerformance: operatorPerformance.rows.map((row: any) => ({
        name: row.operator_name || row.operator_email,
        email: row.operator_email,
        handledChats: parseInt(row.handled_chats),
        avgResponseTime: formatDuration(row.avg_response_time),
        avgResolutionTime: formatDuration(row.avg_resolution_time),
        avgSatisfaction: row.avg_satisfaction ? parseFloat(row.avg_satisfaction).toFixed(1) : 'N/A',
      })),
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
