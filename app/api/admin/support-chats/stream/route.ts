import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { supportChatMessages, supportChatSessions } from '@/lib/schema';
import { eq, desc, gt } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !['admin', 'manager', 'support'].includes(session.user.role)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  const encoder = new TextEncoder();
  let lastMessageId: string | null = null;
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {}
      };

      // Send initial data
      try {
        if (sessionId) {
          const messages = await db.select().from(supportChatMessages)
            .where(eq(supportChatMessages.sessionId, sessionId))
            .orderBy(supportChatMessages.createdAt);
          send({ type: 'messages', messages });
          if (messages.length > 0) lastMessageId = messages[messages.length - 1].id;
        } else {
          const sessions = await db.select().from(supportChatSessions)
            .orderBy(desc(supportChatSessions.lastMessageAt));
          send({ type: 'sessions', sessions });
        }
      } catch (e) {
        send({ type: 'error', message: 'Failed to load initial data' });
      }

      // Poll every 1 second for new data
      const interval = setInterval(async () => {
        if (closed) { clearInterval(interval); return; }
        try {
          if (sessionId) {
            // Get only new messages
            const query = db.select().from(supportChatMessages)
              .where(eq(supportChatMessages.sessionId, sessionId))
              .orderBy(supportChatMessages.createdAt);
            const messages = await query;
            
            if (messages.length > 0) {
              const latestId = messages[messages.length - 1].id;
              if (latestId !== lastMessageId) {
                lastMessageId = latestId;
                send({ type: 'messages', messages });
              }
            }
          } else {
            const sessions = await db.select().from(supportChatSessions)
              .orderBy(desc(supportChatSessions.lastMessageAt));
            send({ type: 'sessions', sessions });
          }
        } catch {}
      }, 1000);

      // Cleanup on disconnect
      request.signal.addEventListener('abort', () => {
        closed = true;
        clearInterval(interval);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}