import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { supportChatSessions } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { isAdmin } from '@/lib/server-auth';

export async function POST(req: NextRequest) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await req.json();
    
    if (!sessionId) {
      return Response.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Update the session to indicate it's taken over by an admin
    await db.update(supportChatSessions)
      .set({
        aiDisabled: true,
        takenOverBy: admin.id,
        takenOverAt: new Date(),
      })
      .where(eq(supportChatSessions.sessionId, sessionId));

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error taking over chat:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
