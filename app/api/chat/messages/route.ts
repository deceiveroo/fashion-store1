import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supportChatMessages } from '@/lib/schema';
import { eq, asc } from 'drizzle-orm';

// Public endpoint - users can read their own chat messages by sessionId
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
    }

    const messages = await db
      .select()
      .from(supportChatMessages)
      .where(eq(supportChatMessages.sessionId, sessionId))
      .orderBy(asc(supportChatMessages.createdAt));

    return NextResponse.json({ messages });
  } catch (error: any) {
    console.error('[CHAT MESSAGES]', error.message);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
