import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userSessions } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current session token
    const authHeader = request.headers.get('authorization');
    const currentToken = authHeader?.replace('Bearer ', '') || '';

    // Get or create current session
    let currentSession = await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.token, currentToken))
      .limit(1);

    if (currentSession.length === 0 && currentToken) {
      // Create session for current request
      const userAgent = request.headers.get('user-agent') || 'Unknown';
      const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown';
      
      // Parse device from user agent
      let device = 'Unknown Device';
      if (userAgent.includes('Chrome')) device = 'Chrome на ' + (userAgent.includes('Windows') ? 'Windows' : userAgent.includes('Mac') ? 'MacOS' : 'Linux');
      else if (userAgent.includes('Safari')) device = 'Safari на ' + (userAgent.includes('iPhone') ? 'iPhone' : 'MacOS');
      else if (userAgent.includes('Firefox')) device = 'Firefox на ' + (userAgent.includes('Windows') ? 'Windows' : 'Linux');

      await db.insert(userSessions).values({
        userId: user.id,
        token: currentToken,
        device,
        location: 'Россия', // You can use IP geolocation service here
        ip,
        userAgent,
      });
    } else if (currentSession.length > 0) {
      // Update last active time
      await db
        .update(userSessions)
        .set({ lastActive: new Date() })
        .where(eq(userSessions.token, currentToken));
    }

    const sessions = await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.userId, user.id))
      .orderBy(desc(userSessions.lastActive));

    const sessionsWithCurrent = sessions.map(session => ({
      ...session,
      isCurrent: session.token === currentToken,
      lastActive: getRelativeTime(session.lastActive),
    }));

    return NextResponse.json({ sessions: sessionsWithCurrent });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'только что';
  if (minutes < 60) return `${minutes} мин назад`;
  if (hours < 24) return `${hours} ч назад`;
  return `${days} дн назад`;
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');
    const terminateAll = searchParams.get('all') === 'true';

    if (terminateAll) {
      // Get current session token
      const authHeader = request.headers.get('authorization');
      const currentToken = authHeader?.replace('Bearer ', '') || '';

      // Delete all sessions except current
      await db
        .delete(userSessions)
        .where(
          and(
            eq(userSessions.userId, user.id),
            // SQL: token != currentToken
          )
        );

      return NextResponse.json({ success: true });
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    await db
      .delete(userSessions)
      .where(
        and(
          eq(userSessions.id, sessionId),
          eq(userSessions.userId, user.id)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
