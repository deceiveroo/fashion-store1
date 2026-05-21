import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supportChatSessions, supportChatMessages } from '@/lib/schema';
import { eq, count, sql, gte, lt as drizzleLt } from 'drizzle-orm';
import { isAdmin } from '@/lib/server-auth';
import { calculateResponseTime, formatResponseTime } from '@/lib/chat-utils';

/**
 * Get comprehensive chat statistics
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await isAdmin();

    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Time range filter (default: last 30 days)
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Total sessions
    const totalSessionsResult = await db
      .select({ count: count() })
      .from(supportChatSessions)
      .where(gte(supportChatSessions.createdAt, startDate));

    // Active sessions
    const activeSessionsResult = await db
      .select({ count: count() })
      .from(supportChatSessions)
      .where(eq(supportChatSessions.status, 'active'));

    // Resolved sessions in time range
    const resolvedSessionsResult = await db
      .select({ count: count() })
      .from(supportChatSessions)
      .where(
        sql`${supportChatSessions.status} = 'resolved' AND ${supportChatSessions.resolvedAt} >= ${startDate}`
      );

    // Total messages in time range
    const totalMessagesResult = await db
      .select({ count: count() })
      .from(supportChatMessages)
      .where(gte(supportChatMessages.createdAt, startDate));

    // Average response time calculation
    const recentSessions = await db
      .select()
      .from(supportChatSessions)
      .where(gte(supportChatSessions.lastMessageAt, startDate))
      .limit(50);

    let avgResponseTimeMs = 0;
    let sessionsWithResponses = 0;

    for (const session of recentSessions) {
      const messages = await db
        .select()
        .from(supportChatMessages)
        .where(eq(supportChatMessages.sessionId, session.sessionId))
        .orderBy(sql`${supportChatMessages.createdAt} ASC`);

      if (messages.length > 1) {
        const responseTime = calculateResponseTime(
          messages.map(m => ({ sender: m.sender, createdAt: m.createdAt }))
        );

        if (responseTime.totalResponses > 0) {
          avgResponseTimeMs += responseTime.avgResponseTime;
          sessionsWithResponses++;
        }
      }
    }

    const finalAvgResponseTime = sessionsWithResponses > 0 
      ? formatResponseTime(avgResponseTimeMs / sessionsWithResponses)
      : '—';

    // Messages per day (for chart)
    const messagesPerDay = await db
      .select({
        date: sql<string>`DATE(${supportChatMessages.createdAt})`,
        count: count(),
      })
      .from(supportChatMessages)
      .where(gte(supportChatMessages.createdAt, startDate))
      .groupBy(sql`DATE(${supportChatMessages.createdAt})`)
      .orderBy(sql`DATE(${supportChatMessages.createdAt}) DESC`)
      .limit(30);

    // Sessions by status
    const sessionsByStatus = await db
      .select({
        status: supportChatSessions.status,
        count: count(),
      })
      .from(supportChatSessions)
      .groupBy(supportChatSessions.status);

    return NextResponse.json({
      period: `${days} дней`,
      overview: {
        totalSessions: totalSessionsResult[0]?.count || 0,
        activeSessions: activeSessionsResult[0]?.count || 0,
        resolvedSessions: resolvedSessionsResult[0]?.count || 0,
        totalMessages: totalMessagesResult[0]?.count || 0,
        avgResponseTime: finalAvgResponseTime,
      },
      messagesPerDay: messagesPerDay.map(row => ({
        date: row.date,
        count: Number(row.count),
      })),
      sessionsByStatus: sessionsByStatus.map(row => ({
        status: row.status,
        count: Number(row.count),
      })),
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[STATS] Error fetching chat statistics:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
