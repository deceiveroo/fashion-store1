import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { supportChatSessions, supportChatMessages, userProfiles } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { isStaff } from '@/lib/server-auth';
import { isRedisAvailable, redis } from '@/lib/redis';

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

    // Нельзя перехватить чат, который уже ведёт ДРУГОЙ оператор
    // (пока он не открепится/завершит). Защита от «двойного» ведения.
    const [current] = await db
      .select({ aiDisabled: supportChatSessions.aiDisabled, takenOverBy: supportChatSessions.takenOverBy, adminName: supportChatSessions.adminName })
      .from(supportChatSessions)
      .where(eq(supportChatSessions.sessionId, sessionId))
      .limit(1);
    if (current?.aiDisabled && current.takenOverBy && current.takenOverBy !== admin.id) {
      return Response.json({ error: `Чат уже ведёт ${current.adminName || 'другой оператор'}`, claimedByOther: true }, { status: 409 });
    }

    // Имя/аватар оператора — чтобы пользователь видел, КТО именно ведёт чат
    // (раньше takeover не писал adminName → виджет показывал «Оператор поддержки»).
    let adminName: string | null = admin.name || null;
    let adminAvatar: string | null = null;
    try {
      const [p] = await db
        .select({ firstName: userProfiles.firstName, lastName: userProfiles.lastName, avatar: userProfiles.avatar })
        .from(userProfiles)
        .where(eq(userProfiles.userId, admin.id))
        .limit(1);
      if (p) {
        const full = `${p.firstName || ''} ${p.lastName || ''}`.trim();
        if (full) adminName = full;
        adminAvatar = p.avatar || null;
      }
    } catch (err) {
      console.warn('[takeover] failed to fetch admin profile:', err);
    }

    await db.update(supportChatSessions)
      .set({
        aiDisabled: true,
        takenOverBy: admin.id,
        takenOverAt: new Date(),
        adminName,
        adminAvatar,
        adminEmail: admin.email || null,
      })
      .where(eq(supportChatSessions.sessionId, sessionId));

    // Системное сообщение + realtime-сигнал, чтобы виджет сразу показал оператора.
    try {
      await db.insert(supportChatMessages).values({
        id: crypto.randomUUID(),
        sessionId,
        message: `${adminName || 'Оператор'} подключился к диалогу 👋`,
        sender: 'ai',
        createdAt: new Date(),
      });
      if (isRedisAvailable() && redis) {
        await redis.set(`chat:update:${sessionId}`, Date.now().toString());
      }
    } catch (err) {
      console.warn('[takeover] failed to insert system message:', err);
    }

    return Response.json({ success: true, adminName });
  } catch (error) {
    console.error('Error taking over chat:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
