import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { supportChatSessions } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { resolveChatSession } from '@/lib/chat-session';

export async function POST(req: NextRequest) {
  try {
    const { rating } = await req.json();

    if (typeof rating !== 'number' || rating < 1 || rating > 10) {
      return Response.json({ error: 'Invalid input' }, { status: 400 });
    }

    // The user can only rate their own chat session.
    const resolved = await resolveChatSession(req);

    await db.update(supportChatSessions)
      .set({
        operatorRating: rating,
        operatorRatedAt: new Date(),
        operatorRatedBy: resolved.userId || 'guest',
      })
      .where(eq(supportChatSessions.sessionId, resolved.sessionId));

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error saving rating:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}