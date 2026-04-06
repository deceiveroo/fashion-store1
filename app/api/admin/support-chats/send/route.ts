import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supportChatMessages, supportChatSessions } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || !['admin', 'manager', 'support'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId, message, imageUrl } = await request.json();

    if (!sessionId || (!message && !imageUrl)) {
      return NextResponse.json({ error: 'Session ID and either message or image URL are required' }, { status: 400 });
    }

    // Save admin message with potential image
    await db.insert(supportChatMessages).values({
      id: crypto.randomUUID(),
      sessionId,
      message: message || '',
      imageUrl: imageUrl || null,
      sender: 'admin',
      aiModel: null,
      createdAt: new Date(),
    });

    // Update session
    const existingSession = await db
      .select()
      .from(supportChatSessions)
      .where(eq(supportChatSessions.sessionId, sessionId))
      .limit(1);

    if (existingSession.length > 0) {
      await db
        .update(supportChatSessions)
        .set({
          messageCount: (existingSession[0].messageCount || 0) + 1,
          lastMessageAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(supportChatSessions.sessionId, sessionId));
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[ADMIN] Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}