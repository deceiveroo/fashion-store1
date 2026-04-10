import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { supportChatSessions } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { isStaff } from '@/lib/server-auth';

export async function POST(req: NextRequest) {
  try {
    const admin = await isStaff();
    if (!admin) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await req.json();
    
    if (!sessionId) {
      return Response.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Update the session to mark as resolved
    await db.update(supportChatSessions)
      .set({
        status: 'resolved',
        resolvedAt: new Date(),
        resolvedBy: admin.id,
        updatedAt: new Date(),
      })
      .where(eq(supportChatSessions.sessionId, sessionId));

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error finishing conversation:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}