import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { supportChatMessages } from '@/lib/schema';
import { eq, asc, gt } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const sessionId = new URL(req.url).searchParams.get('sessionId');
  if (!sessionId) return new Response('sessionId required', { status: 400 });

  const encoder = new TextEncoder();
  let lastId: string | null = null;
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        if (closed) return;
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)); } catch {}
      };

      // Send all existing messages first
      try {
        const msgs = await db.select().from(supportChatMessages)
          .where(eq(supportChatMessages.sessionId, sessionId))
          .orderBy(asc(supportChatMessages.createdAt));
        send({ type: 'init', messages: msgs });
        if (msgs.length > 0) lastId = msgs[msgs.length - 1].id;
      } catch { send({ type: 'init', messages: [] }); }

      // Poll DB every 500ms for new messages — fast but cheap
      const interval = setInterval(async () => {
        if (closed) { clearInterval(interval); return; }
        try {
          const all = await db.select().from(supportChatMessages)
            .where(eq(supportChatMessages.sessionId, sessionId))
            .orderBy(asc(supportChatMessages.createdAt));

          if (all.length === 0) return;
          const latest = all[all.length - 1];
          if (latest.id !== lastId) {
            // Find only new messages
            const lastIdx = lastId ? all.findIndex(m => m.id === lastId) : -1;
            const newMsgs = lastIdx >= 0 ? all.slice(lastIdx + 1) : all;
            lastId = latest.id;
            if (newMsgs.length > 0) send({ type: 'new', messages: newMsgs });
          }
        } catch {}
      }, 500);

      req.signal.addEventListener('abort', () => {
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