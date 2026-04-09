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

    const sessions = await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.userId, user.id))
      .orderBy(desc(userSessions.lastActive));

    // Get current session token
    const authHeader = request.headers.get('authorization');
    const currentToken = authHeader?.replace('Bearer ', '') || '';

    const sessionsWithCurrent = sessions.map(session => ({
      ...session,
      isCurrent: session.token === currentToken,
    }));

    return NextResponse.json({ sessions: sessionsWithCurrent });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
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
            // Don't delete current session
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
