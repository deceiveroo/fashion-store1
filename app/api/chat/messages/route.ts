import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supportChatMessages } from '@/lib/schema';
import { eq, asc } from 'drizzle-orm';
import { resolveChatSession } from '@/lib/chat-session';

// Returns messages for the *caller's own* session only — sessionId in the query is ignored.
export async function GET(request: NextRequest) {
  try {
    const resolved = await resolveChatSession(request);
    const sessionId = resolved.sessionId;

    const messages = await db
      .select()
      .from(supportChatMessages)
      .where(eq(supportChatMessages.sessionId, sessionId))
      .orderBy(asc(supportChatMessages.createdAt));

    return NextResponse.json({ sessionId, messages });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[CHAT MESSAGES]', errorMessage);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}