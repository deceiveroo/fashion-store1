import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supportChatMessages, supportChatSessions } from '@/lib/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { getSession } from '@/lib/server-auth';

export async function POST(req: NextRequest) {
  try {
    const { message, imageUrl, sessionId } = await req.json();
    
    if (!sessionId) {
      return Response.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Get the session to check if it's taken over by an admin
    let session = await db.select().from(supportChatSessions).where(eq(supportChatSessions.sessionId, sessionId)).limit(1);
    let sessionRecord = session[0];

    // If no session exists, create one
    if (!sessionRecord) {
      const user = await getSession();
      sessionRecord = (await db.insert(supportChatSessions).values({
        sessionId,
        userId: user?.user?.id || null,
        userEmail: user?.user?.email || null,
        userName: user?.user?.name || null,
        firstMessage: message.substring(0, 100),
        lastMessageAt: new Date(),
      }).returning())[0];
    }

    // Check if imageUrl is provided but admin hasn't taken over
    if (imageUrl && !sessionRecord?.aiDisabled) {
      return Response.json({ 
        success: false, 
        error: 'Изображения могут отправляться только после подключения оператора' 
      }, { status: 400 });
    }

    // Insert the user message
    const [newMessage] = await db.insert(supportChatMessages).values({
      sessionId,
      message,
      imageUrl: imageUrl || null, // Store the image URL if provided
      sender: 'user',
    }).returning();

    // Update session stats
    await db.update(supportChatSessions)
      .set({
        messageCount: sql`${supportChatSessions.messageCount} + 1`,
        lastMessageAt: new Date(),
      })
      .where(eq(supportChatSessions.sessionId, sessionId));

    // If an admin has taken over the chat, don't respond with AI
    if (sessionRecord?.aiDisabled) {
      return Response.json({ 
        success: true, 
        takenOver: true, 
        message: 'Сообщение отправлено оператору. Ожидайте ответа.' 
      });
    }

    // Otherwise, simulate AI response after a delay
    setTimeout(async () => {
      try {
        // In a real implementation, this would call an AI service
        const responses = [
          'Чем еще могу помочь?',
          'Пожалуйста, уточните ваш вопрос.',
          'Спасибо за информацию. Что-то еще?',
          'Я получил ваше сообщение. Могу ли я чем-то еще помочь?',
          'Записал ваш запрос. Нужна ли вам дополнительная помощь?'
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        await db.insert(supportChatMessages).values({
          sessionId,
          message: randomResponse,
          sender: 'ai',
        }).returning();
        
        // Update session stats again
        await db.update(supportChatSessions)
          .set({
            messageCount: sql`${supportChatSessions.messageCount} + 1`,
            lastMessageAt: new Date(),
          })
          .where(eq(supportChatSessions.sessionId, sessionId));
      } catch (error) {
        console.error('Error in AI response timeout:', error);
      }
    }, 2000); // Simulate typing delay

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error handling chat message:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('sessionId');

    if (!sessionId) {
      return Response.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Get messages for the session
    const messages = await db
      .select()
      .from(supportChatMessages)
      .where(eq(supportChatMessages.sessionId, sessionId))
      .orderBy(desc(supportChatMessages.createdAt));

    return Response.json({ messages });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}