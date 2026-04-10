import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { supportChatMessages, supportChatSessions } from '@/lib/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { isStaff } from '@/lib/server-auth';

export async function POST(req: NextRequest) {
  try {
    const admin = await isStaff();
    if (!admin) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId, message, imageUrl } = await req.json();

    if (!sessionId) {
      return Response.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Verify session exists
    const session = await db.select()
      .from(supportChatSessions)
      .where(eq(supportChatSessions.sessionId, sessionId))
      .limit(1);

    if (session.length === 0) {
      return Response.json({ error: 'Session not found' }, { status: 404 });
    }

    // Insert the admin message
    await db.insert(supportChatMessages).values({
      sessionId,
      message,
      imageUrl: imageUrl || null, // Store image URL if provided
      sender: 'admin',
    });

    // Update session stats
    await db.update(supportChatSessions)
      .set({
        messageCount: sql`${supportChatSessions.messageCount} + 1`,
        lastMessageAt: new Date(),
      })
      .where(eq(supportChatSessions.sessionId, sessionId));

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error sending admin message:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}