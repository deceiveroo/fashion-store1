import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { supportChatMessages, supportChatSessions } from '@/lib/schema';
import { desc, eq } from 'drizzle-orm';
import { isAdmin } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  try {
    const admin = await isAdmin();

    if (!admin) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');

    if (!sessionId) {
      return Response.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Check if session belongs to admin or is public
    const session = await db
      .select()
      .from(supportChatSessions)
      .where(eq(supportChatSessions.sessionId, sessionId))
      .limit(1);

    if (session.length === 0) {
      return Response.json({ error: 'Session not found' }, { status: 404 });
    }

    // Start SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Initial data
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'init', messages: [] })}\n\n`)
        );

        // Watch for new messages
        const interval = setInterval(async () => {
          try {
            const newMessages = await db
              .select()
              .from(supportChatMessages)
              .where(eq(supportChatMessages.sessionId, sessionId))
              .orderBy(desc(supportChatMessages.createdAt))
              .limit(10); // Last 10 messages

            if (newMessages.length > 0) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ messages: newMessages })}\n\n`)
              );
            }
          } catch (err) {
            console.error('Stream error:', err);
            clearInterval(interval);
          }
        }, 2000); // Poll every 2 seconds

        // Cleanup
        request.signal.addEventListener('abort', () => {
          clearInterval(interval);
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('[ADMIN] Error in support chat stream:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}