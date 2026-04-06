import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { supportChatSessions } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { isAdmin } from '@/lib/server-auth';

export async function POST(req: NextRequest) {
  try {
    // Check if user is admin
    const admin = await isAdmin();
    if (!admin) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId, rating } = await req.json();
    
    if (!sessionId || typeof rating !== 'number' || rating < 1 || rating > 10) {
      return Response.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Update the session with the rating
    await db.update(supportChatSessions)
      .set({
        operatorRating: rating,
        operatorRatedAt: new Date(),
        operatorRatedBy: admin.id // Store the admin ID who rated
      })
      .where(eq(supportChatSessions.sessionId, sessionId));

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error saving rating:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}