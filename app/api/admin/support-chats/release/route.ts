import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { supportChatSessions, supportChatMessages } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { isStaff } from '@/lib/server-auth';
import { isRedisAvailable, redis } from '@/lib/redis';

/**
 * Открепить оператора от чата (не завершая диалог): снова включаем ассистента,
 * очищаем данные оператора. У пользователя оператор пропадает из чата/профиля,
 * дальше снова отвечает бот. POST /api/admin/support-chats/release { sessionId }
 */
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

    await db.update(supportChatSessions)
      .set({
        aiDisabled: false,
        takenOverBy: null,
        takenOverAt: null,
        adminName: null,
        adminAvatar: null,
        adminEmail: null,
      })
      .where(eq(supportChatSessions.sessionId, sessionId));

    // Системное сообщение + realtime-сигнал, чтобы виджет пользователя сразу
    // вернулся к ассистенту и убрал оператора из шапки.
    try {
      await db.insert(supportChatMessages).values({
        id: crypto.randomUUID(),
        sessionId,
        message: 'Оператор завершил сопровождение. Дальше вам поможет ассистент ELEVATE 🤖',
        sender: 'ai',
        createdAt: new Date(),
      });
      if (isRedisAvailable() && redis) {
        await redis.set(`chat:update:${sessionId}`, Date.now().toString());
      }
    } catch (err) {
      console.warn('[release] failed to insert system message:', err);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error releasing chat:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
