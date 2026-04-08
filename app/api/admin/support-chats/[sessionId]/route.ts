import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supportChatSessions, supportChatMessages } from '@/lib/schema';
import { asc, eq } from 'drizzle-orm';
import { isAdmin } from '@/lib/server-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const admin = await isAdmin();

    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = params;

    // Get chat session and messages
    const session = await db
      .select()
      .from(supportChatSessions)
      .where(eq(supportChatSessions.sessionId, sessionId))
      .limit(1);

    if (session.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const messages = await db
      .select()
      .from(supportChatMessages)
      .where(eq(supportChatMessages.sessionId, sessionId))
      .orderBy(asc(supportChatMessages.createdAt)); // ASC order for chat display

    return NextResponse.json({ session: session[0], messages });
  } catch (error: any) {
    console.error('[ADMIN] Error fetching support chat session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch support chat session' },
      { status: 500 }
    );
  }
}