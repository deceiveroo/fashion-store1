import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { userSessions } from '@/lib/schema';
import { and, desc, eq, isNull, ne } from 'drizzle-orm';
import { jsonWithNoCache } from '@/lib/no-cache';
import { parseUserAgent } from '@/lib/user-agent';
import { touchUserSession, currentSessionToken } from '@/lib/track-session';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function relative(ts: Date | string | null | undefined): string {
  if (!ts) return '—';
  const d = typeof ts === 'string' ? new Date(ts) : ts;
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return 'только что';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} мин назад`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} ч назад`;
  return `${Math.floor(diff / 86_400_000)} д назад`;
}

// GET /api/profile/sessions — list active sessions (not revoked).
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Make sure current request is reflected.
    await touchUserSession(user.id, request.headers);
    const currentToken = currentSessionToken(user.id, request.headers);

    const rows = await db
      .select()
      .from(userSessions)
      .where(and(eq(userSessions.userId, user.id), isNull(userSessions.revokedAt)))
      .orderBy(desc(userSessions.lastActive));

    const sessions = rows.map((s) => ({
      id: s.id,
      userId: s.userId,
      device: s.device || 'Неизвестное устройство',
      location: s.location || '—',
      ip: s.ip || '',
      userAgent: s.userAgent || '',
      lastActive: s.lastActive,
      createdAt: s.createdAt,
      isCurrent: s.token === currentToken,
      parsedUA: parseUserAgent(s.userAgent || ''),
      lastActiveRelative: relative(s.lastActive),
    }));

    return jsonWithNoCache({ sessions });
  } catch (error) {
    console.error('[profile/sessions] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

// DELETE /api/profile/sessions — revoke a specific session or all others.
//   ?id=<session-id>  → mark that row revoked
//   ?all=true         → revoke all sessions except the current one
//
// «Отзыв» = установка revoked_at = NOW(). На следующем запросе с
// отозванным токеном verifyAuth() вернёт null и пользователь «вылетит».
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sp = new URL(request.url).searchParams;
    const sessionId = sp.get('id');
    const terminateAll = sp.get('all') === 'true';
    const currentToken = currentSessionToken(user.id, request.headers);
    const now = new Date();

    if (terminateAll) {
      await db
        .update(userSessions)
        .set({ revokedAt: now })
        .where(
          and(
            eq(userSessions.userId, user.id),
            ne(userSessions.token, currentToken),
            isNull(userSessions.revokedAt),
          ),
        );
      return NextResponse.json({ success: true, message: 'Другие сессии завершены' });
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const [row] = await db
      .select({ id: userSessions.id, token: userSessions.token })
      .from(userSessions)
      .where(and(eq(userSessions.id, sessionId), eq(userSessions.userId, user.id)))
      .limit(1);

    if (!row) return NextResponse.json({ error: 'Сессия не найдена' }, { status: 404 });
    if (row.token === currentToken) {
      return NextResponse.json({ error: 'Нельзя завершить текущую сессию. Используйте «Выйти».' }, { status: 400 });
    }

    await db
      .update(userSessions)
      .set({ revokedAt: now })
      .where(eq(userSessions.id, sessionId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[profile/sessions] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
