import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supportChatMessages, supportChatSessions } from '@/lib/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { requireUser } from '@/lib/server-auth';

```

c:\Users\NIKITA\Desktop\1\fashion-store\app\api\chat\route.ts
```typescript
<<<<<<< SEARCH
export async function POST(request: NextRequest) {
  try {
    const { message, sessionId } = await request.json();
    if (!message || !sessionId) {
      return NextResponse.json({ error: 'Message and sessionId required' }, { status: 400 });
    }

    await saveMessage(sessionId, message, 'user', null);

    // Check if admin has taken over
    try {
      const session = await db.select().from(supportChatSessions).where(eq(supportChatSessions.sessionId, sessionId)).limit(1);
      if (session[0]?.aiDisabled) {
        return NextResponse.json({ message: ' Ваш запрос передан оператору. Пожалуйста, подождите...', takenOver: true });
      }
    } catch {
      console.log('[CHAT] Could not check takeover status');
    }

    let aiMessage = '';
    let aiModel = 'fallback';

    // Cloudflare Workers AI
    const cfResponse = await callCloudflareAI(message);
    if (cfResponse) {
      aiMessage = cfResponse;
      aiModel = 'cloudflare-llama-3.3-70b-fast';
    }

    // Keyword fallback if CF failed
    if (!aiMessage) {
      const fallback = findBestResponse(message);
      if (fallback) {
        aiMessage = fallback;
        aiModel = 'fallback';
      } else {
        aiMessage = "Спасибо за вопрос! \n\nЯ могу помочь с:\n Доставкой\n Возвратом\n Оплатой\n Размерами\n Скидками\n\nИли свяжитесь:\n support@elevate.com\n +7 (800) 123-45-67";
        aiModel = 'fallback';
      }
    }

    await saveMessage(sessionId, aiMessage, 'ai', aiModel);
    
    // Check if we should trigger rating request
    const shouldRate = await shouldTriggerRating(sessionId);
    if (shouldRate) {
      await triggerRatingRequest(sessionId);
      aiMessage += "\n\nПожалуйста, оцените качество нашей поддержки ⭐️";
    }
    
    return NextResponse.json({ 
      message: aiMessage,
      showRating: shouldRate
    });

  } catch (error) {
    console.error('Error handling chat message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export async function POST(req: NextRequest) {
  try {
    const { message, imageUrl, sessionId } = await req.json();
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Get the session to check if it's taken over by an admin
    let session = await db.select().from(supportChatSessions).where(eq(supportChatSessions.sessionId, sessionId)).limit(1);
    let sessionRecord = session[0];

    // If no session exists, create one
    if (!sessionRecord) {
      const user = await requireUser();
      sessionRecord = (await db.insert(supportChatSessions).values({
        sessionId,
        userId: user?.id || null,
        userEmail: user?.email || null,
        userName: user?.name || null,
        firstMessage: message.substring(0, 100),
        lastMessageAt: new Date(),
      }).returning())[0];
    }

    // Check if imageUrl is provided but admin hasn't taken over
    if (imageUrl && !sessionRecord?.aiDisabled) {
      return NextResponse.json({ 
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
      return NextResponse.json({ 
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling chat message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Check if conversation should be rated
async function shouldTriggerRating(sessionId: string): Promise<boolean> {
  try {
    // Get the session
    const session = await db.select().from(supportChatSessions)
      .where(eq(supportChatSessions.sessionId, sessionId))
      .limit(1);
    
    if (!session.length || session[0].status !== 'active') {
      return false;
    }
    
    // Get last 2 messages
    const lastMessages = await db.select()
      .from(supportChatMessages)
      .where(eq(supportChatMessages.sessionId, sessionId))
      .orderBy(desc(supportChatMessages.createdAt))
      .limit(2);
    
    // Should trigger rating if:
    // 1. There are at least 2 messages (user + AI)
    // 2. Last message was from AI
    // 3. Conversation has been active for at least 5 minutes
    if (lastMessages.length >= 2 && 
        lastMessages[0].sender === 'ai' && 
        session[0].messageCount >= 2) {
      
      const sessionStart = new Date(session[0].createdAt);
      const now = new Date();
      const duration = (now.getTime() - sessionStart.getTime()) / 60000; // in minutes
      
      return duration >= 5;
    }
    
    return false;
  } catch (error) {
    console.error('[CHAT] Rating check error:', error);
    return false;
  }
}

// Trigger rating request
async function triggerRatingRequest(sessionId: string): Promise<void> {
  try {
    // In a real implementation, this would:
    // 1. Send a rating request email/SMS to the user
    // 2. Or show a rating UI in the chat
    // For now, we'll just mark the session as completed
    
    await db.update(supportChatSessions)
      .set({
        status: 'completed',
        updatedAt: new Date(),
      })
      .where(eq(supportChatSessions.sessionId, sessionId));
      
    console.log(`[CHAT] Rating request triggered for session ${sessionId}`);
  } catch (error) {
    console.error('[CHAT] Rating trigger error:', error);
  }
}


export async function POST(request: NextRequest) {
  try {
    const { message, sessionId } = await request.json();
    if (!message || !sessionId) {
      return NextResponse.json({ error: 'Message and sessionId required' }, { status: 400 });
    }

    await saveMessage(sessionId, message, 'user', null);

    // Check if admin has taken over
    try {
      const session = await db.select().from(supportChatSessions).where(eq(supportChatSessions.sessionId, sessionId)).limit(1);
      if (session[0]?.aiDisabled) {
        return NextResponse.json({ message: ' Ваш запрос передан оператору. Пожалуйста, подождите...', takenOver: true });
      }
    } catch {
      console.log('[CHAT] Could not check takeover status');
    }

    let aiMessage = '';
    let aiModel = 'fallback';

    // Cloudflare Workers AI
    const cfResponse = await callCloudflareAI(message);
    if (cfResponse) {
      aiMessage = cfResponse;
      aiModel = 'cloudflare-llama-3.3-70b-fast';
    }

    // Keyword fallback if CF failed
    if (!aiMessage) {
      const fallback = findBestResponse(message);
      if (fallback) {
        aiMessage = fallback;
        aiModel = 'fallback';
      } else {
        aiMessage = "Спасибо за вопрос! \n\nЯ могу помочь с:\n Доставкой\n Возвратом\n Оплатой\n Размерами\n Скидками\n\nИли свяжитесь:\n support@elevate.com\n +7 (800) 123-45-67";
        aiModel = 'fallback';
      }
    }

    await saveMessage(sessionId, aiMessage, 'ai', aiModel);
    
    // Check if we should trigger rating request
    const shouldRate = await shouldTriggerRating(sessionId);
    if (shouldRate) {
      await triggerRatingRequest(sessionId);
      aiMessage += "\n\nПожалуйста, оцените качество нашей поддержки ⭐️";
    }
    
    return NextResponse.json({ 
      message: aiMessage,
      showRating: shouldRate
    });

  } catch (error: any) {
    console.error('[CHAT] Error:', error.message);
    return NextResponse.json({ message: 'Извините, произошла ошибка. Свяжитесь с поддержкой: support@elevate.com' });
  }
}