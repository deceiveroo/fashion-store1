import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supportChatMessages, supportChatSessions } from '@/lib/schema';
import { eq, asc } from 'drizzle-orm';
import { findAutoResponse } from '@/lib/chat-auto-responses';

async function upsertSession(sessionId: string, firstMsg?: string) {
  const existing = await db.select().from(supportChatSessions)
    .where(eq(supportChatSessions.sessionId, sessionId)).limit(1);
  if (existing.length === 0) {
    await db.insert(supportChatSessions).values({
      id: crypto.randomUUID(), sessionId, status: 'active',
      messageCount: 1, firstMessage: firstMsg || null,
      lastMessageAt: new Date(), createdAt: new Date(), updatedAt: new Date(),
    });
  } else {
    await db.update(supportChatSessions).set({
      messageCount: (existing[0].messageCount || 0) + 1,
      lastMessageAt: new Date(), updatedAt: new Date(),
    }).where(eq(supportChatSessions.sessionId, sessionId));
  }
}

async function saveMsg(sessionId: string, message: string, sender: 'user' | 'ai' | 'admin') {
  await db.insert(supportChatMessages).values({
    id: crypto.randomUUID(),
    sessionId,
    message,
    sender,
    createdAt: new Date(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const { message, sessionId, isAutoReply } = await req.json();
    if (!message?.trim() || !sessionId) {
      return NextResponse.json({ error: 'message and sessionId required' }, { status: 400 });
    }

    await upsertSession(sessionId, message);
    
    // Если это авто-ответ, просто сохраняем и возвращаем
    if (isAutoReply) {
      await saveMsg(sessionId, message, 'ai');
      return NextResponse.json({ success: true });
    }
    
    // Сохраняем сообщение пользователя
    await saveMsg(sessionId, message, 'user');

    const [session] = await db.select().from(supportChatSessions)
      .where(eq(supportChatSessions.sessionId, sessionId)).limit(1);

    if (session?.aiDisabled) {
      return NextResponse.json({ takenOver: true, message: '👨‍💼 Оператор подключён. Ожидайте ответа...' });
    }

    const autoReply = findAutoResponse(message);
    if (autoReply) {
      await saveMsg(sessionId, autoReply, 'ai');
      return NextResponse.json({ success: true, autoReply });
    }

    return NextResponse.json({ success: true });

  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error('[CHAT POST]', errorMessage);
    return NextResponse.json({ message: 'Ошибка. Попробуйте позже.' });
  }
}

export async function GET(req: NextRequest) {
  try {
    const sessionId = new URL(req.url).searchParams.get('sessionId');
    if (!sessionId) return NextResponse.json({ messages: [] });
    const messages = await db.select().from(supportChatMessages)
      .where(eq(supportChatMessages.sessionId, sessionId))
      .orderBy(asc(supportChatMessages.createdAt));
    return NextResponse.json({ messages });
  } catch {
    return NextResponse.json({ messages: [] });
  }
}