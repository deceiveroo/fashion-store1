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

    const { sessionId } = await req.json();
    
    if (!sessionId) {
      return Response.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Update the session to disable AI and reset takenOverBy
    await db.update(supportChatSessions)
      .set({
        aiDisabled: false,
        takenOverBy: null,
        takenOverAt: null,
        resolvedAt: new Date(),
        resolvedBy: admin.id,
        status: 'active' // Keep it active so others can see it
      })
      .where(eq(supportChatSessions.sessionId, sessionId));

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error finishing conversation:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}