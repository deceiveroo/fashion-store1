import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userSessions, users } from '@/lib/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';
import { jsonWithNoCache } from '@/lib/no-cache';
import { parseUserAgent } from '@/lib/user-agent';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Force dynamic rendering - never cache
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/admin/sessions - Get all active sessions for all users
export async function GET(request: NextRequest) {
  try {
    // Verify authentication and admin role
    const currentUser = await verifyAuth(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    // Get all sessions with user information
    const sessions = await db
      .select({
        id: userSessions.id,
        userId: userSessions.userId,
        token: userSessions.token,
        device: userSessions.device,
        location: userSessions.location,
        ip: userSessions.ip,
        userAgent: userSessions.userAgent,
        lastActive: userSessions.lastActive,
        createdAt: userSessions.createdAt,
        userEmail: users.email,
        userName: users.name,
      })
      .from(userSessions)
      .innerJoin(users, eq(userSessions.userId, users.id))
      .orderBy(desc(userSessions.lastActive));

    // Parse user agent for each session
    const sessionsWithParsedUA = sessions.map(session => ({
      ...session,
      parsedUA: parseUserAgent(session.userAgent || ''),
      lastActiveRelative: getRelativeTime(session.lastActive),
      createdAtRelative: getRelativeTime(session.createdAt),
    }));

    return jsonWithNoCache({ sessions: sessionsWithParsedUA });
  } catch (error) {
    console.error('Error fetching admin sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

// DELETE /api/admin/sessions - Terminate a specific session
export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication and admin role
    const currentUser = await verifyAuth(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!sessionId || !userId) {
      return NextResponse.json({ error: 'Session ID and User ID required' }, { status: 400 });
    }

    // Get session token before deleting
    const sessionToDelete = await db
      .select({ token: userSessions.token })
      .from(userSessions)
      .where(eq(userSessions.id, sessionId))
      .limit(1);

    if (sessionToDelete.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Delete session from our database
    await db
      .delete(userSessions)
      .where(eq(userSessions.id, sessionId));

    return NextResponse.json({ success: true, message: 'Session terminated' });
  } catch (error) {
    console.error('Error deleting admin session:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}

// Helper function to get relative time
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'только что';
  if (minutes < 60) return `${minutes} мин назад`;
  if (hours < 24) return `${hours} ч назад`;
  if (days < 7) return `${days} дн назад`;
  return new Date(date).toLocaleDateString('ru-RU');
}
