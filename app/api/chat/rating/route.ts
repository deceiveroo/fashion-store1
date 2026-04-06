import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { supportChatSessions } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const { sessionId, rating } = await req.json();
    
    if (!sessionId || typeof rating !== 'number' || rating < 1 || rating > 10) {
      return Response.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Update the session with the rating
    await db.update(supportChatSessions)
      .set({
        operatorRating: rating,
        operatorRatedAt: new Date(),
        operatorRatedBy: 'user' // In a real app, this would be the user ID
      })
      .where(eq(supportChatSessions.sessionId, sessionId));

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error saving rating:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}