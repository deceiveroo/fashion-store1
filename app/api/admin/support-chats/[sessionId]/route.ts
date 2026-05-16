import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supportChatSessions, supportChatMessages } from '@/lib/schema';
import { asc, eq } from 'drizzle-orm';
import { isStaff } from '@/lib/server-auth';

type RouteParams = { params: Promise<{ sessionId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await isStaff();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await params;

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
      .orderBy(asc(supportChatMessages.createdAt));

    return NextResponse.json({ session: session[0], messages });
  } catch (error: unknown) {
    console.error('[ADMIN] Error fetching support chat session:', error);
    return NextResponse.json({ error: 'Failed to fetch support chat session' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await isStaff();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await params;
    const { message } = await request.json();
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    const [session] = await db
      .select()
      .from(supportChatSessions)
      .where(eq(supportChatSessions.sessionId, sessionId))
      .limit(1);

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    await db.insert(supportChatMessages).values({
      id: crypto.randomUUID(),
      sessionId,
      message: message.trim(),
      sender: 'admin',
      createdAt: new Date(),
    });

    await db
      .update(supportChatSessions)
      .set({
        messageCount: (session.messageCount || 0) + 1,
        lastMessageAt: new Date(),
        updatedAt: new Date(),
        aiDisabled: true,
      })
      .where(eq(supportChatSessions.sessionId, sessionId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ADMIN] Error sending support message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
