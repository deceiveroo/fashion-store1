import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { supportChatSessions, supportChatMessages } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';

// Server-Sent Events для real-time обновлений чатов
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !['admin', 'manager', 'support'].includes(session.user.role)) {
      return new Response('Unauthorized', { status: 401 });
    }

    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        let intervalId: NodeJS.Timeout;

        const sendUpdate = async () => {
          try {
            // Получаем активные сессии
            const sessions = await db
              .select()
              .from(supportChatSessions)
              .orderBy(desc(supportChatSessions.lastMessageAt))
              .limit(50);

            const data = `data: ${JSON.stringify({ sessions, timestamp: Date.now() })}\n\n`;
            controller.enqueue(encoder.encode(data));
          } catch (error) {
            console.error('SSE update error:', error);
            // Отправляем ошибку клиенту
            const errorData = `data: ${JSON.stringify({ error: 'Failed to fetch updates' })}\n\n`;
            controller.enqueue(encoder.encode(errorData));
          }
        };

        // Отправляем первое обновление сразу
        await sendUpdate();

        // Затем каждые 5 секунд
        intervalId = setInterval(sendUpdate, 5000);

        // Очистка при закрытии соединения
        request.signal.addEventListener('abort', () => {
          clearInterval(intervalId);
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Отключаем буферизацию в nginx
      },
    });
  } catch (error: any) {
    console.error('[SSE] Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// Отключаем статическую оптимизацию для SSE
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
