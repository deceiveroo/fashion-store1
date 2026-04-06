import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supportChatSessions } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || !['admin', 'manager', 'support'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Take over the chat - disable AI and mark as taken over by admin
    await db
      .update(supportChatSessions)
      .set({
        aiDisabled: true,
        takenOverBy: session.user.id,
        takenOverAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(supportChatSessions.sessionId, sessionId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[ADMIN] Error taking over chat:', error);
    return NextResponse.json(
      { error: 'Failed to take over chat' },
      { status: 500 }
    );
  }
}
