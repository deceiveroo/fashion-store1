import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { supportChatMessages } from '@/lib/schema';
import { eq, asc } from 'drizzle-orm';
import { redis, isRedisAvailable } from '@/lib/redis';
import { resolveChatSession } from '@/lib/chat-session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Resolve sessionId server-side — visitor can only stream their own session.
  const resolved = await resolveChatSession(req);
  const sessionId = resolved.sessionId;

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

      // Initialize Redis timestamp for tracking updates
      let lastRedisTime = '';
      if (isRedisAvailable() && redis) {
        try {
          const res = await redis.get(`chat:update:${sessionId}`);
          lastRedisTime = (res as string) || '';
        } catch {}
      }

      // Poll DB every 500ms for new messages — optimized with Redis flag
      const interval = setInterval(async () => {
        if (closed) { clearInterval(interval); return; }
        
        try {
          // If Redis is active, check the lightweight cache flag first
          if (isRedisAvailable() && redis) {
            try {
              const latestTime = (await redis.get(`chat:update:${sessionId}`)) as string | null;
              if (latestTime === lastRedisTime) {
                // No new messages according to Redis — skip heavy PostgreSQL query!
                return;
              }
              lastRedisTime = latestTime || '';
            } catch (redisErr) {
              console.error('[CHAT SSE REDIS CHECK ERROR] Falling back to direct SQL:', redisErr);
            }
          }

          // Fetch only if Redis says there are updates or if Redis is unavailable
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