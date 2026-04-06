import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { supportChatSessions, users } from '@/lib/schema';
import { eq, and, gte, lte, isNotNull } from 'drizzle-orm';
import { isAdmin } from '@/lib/server-auth';
import { subDays, subWeeks, subMonths, subYears } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    // Check if user is admin
    const admin = await isAdmin();
    if (!admin) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const dateRange = url.searchParams.get('range') || 'month';
    const operatorId = url.searchParams.get('operator') || 'all';

    // Calculate date range based on input
    const now = new Date();
    let startDate = new Date();
    
    switch (dateRange) {
      case 'week':
        startDate = subWeeks(now, 1);
        break;
      case 'month':
        startDate = subMonths(now, 1);
        break;
      case 'quarter':
        startDate = subMonths(now, 3);
        break;
      case 'year':
        startDate = subYears(now, 1);
        break;
      case 'today':
      default:
        startDate = subDays(now, 1);
    }

    // Build conditions for query
    let conditions = [
      isNotNull(supportChatSessions.operatorRating),
      gte(supportChatSessions.operatorRatedAt, startDate),
      lte(supportChatSessions.operatorRatedAt, now)
    ];

    if (operatorId !== 'all') {
      conditions.push(eq(supportChatSessions.resolvedBy, operatorId));
    }

    // Fetch sessions with ratings
    const sessions = await db
      .select({
        id: supportChatSessions.id,
        sessionId: supportChatSessions.sessionId,
        operatorRating: supportChatSessions.operatorRating,
        operatorRatedAt: supportChatSessions.operatorRatedAt,
        resolvedBy: supportChatSessions.resolvedBy,
        resolvedByName: users.name,
        resolvedByEmail: users.email
      })
      .from(supportChatSessions)
      .leftJoin(users, eq(supportChatSessions.resolvedBy, users.id))
      .where(and(...conditions));

    // Group by operator
    const groupedByOperator: Record<string, typeof sessions> = {};
    for (const session of sessions) {
      const operatorId = session.resolvedBy || 'unknown';
      if (!groupedByOperator[operatorId]) {
        groupedByOperator[operatorId] = [];
      }
      groupedByOperator[operatorId].push(session);
    }

    // Format the statistics
    const stats = Object.entries(groupedByOperator).map(([operatorId, operatorSessions]) => {
      const firstSession = operatorSessions[0];
      
      // Calculate hourly stats
      const hourlyStats = Array.from({ length: 24 }, (_, i) => {
        const hour = i.toString().padStart(2, '0');
        const count = operatorSessions.filter(s => {
          const sessionHour = new Date(s.operatorRatedAt!).getHours().toString().padStart(2, '0');
          return sessionHour === hour;
        }).length;
        return { hour: `${hour}:00`, count };
      });

      // Get recent ratings
      const recentRatings = operatorSessions
        .filter(s => s.operatorRating !== null)
        .map(s => ({
          rating: s.operatorRating!,
          timestamp: s.operatorRatedAt!.toISOString(),
          sessionId: s.sessionId
        }))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Calculate average rating
      const totalRating = operatorSessions.reduce((sum, s) => sum + (s.operatorRating || 0), 0);
      const avgRating = operatorSessions.length > 0 ? totalRating / operatorSessions.length : 0;

      return {
        id: operatorId,
        name: firstSession.resolvedByName || '',
        email: firstSession.resolvedByEmail || '',
        completedChats: operatorSessions.length,
        avgRating: parseFloat(avgRating.toFixed(2)),
        totalRatings: operatorSessions.length,
        hourlyStats,
        recentRatings
      };
    });

    return Response.json({ stats });
  } catch (error) {
    console.error('Error fetching operator stats:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}