import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supportChatMessages, supportChatSessions } from '@/lib/schema';
import { eq, asc, desc } from 'drizzle-orm';
import { findAutoResponse } from '@/lib/chat-auto-responses';
import { validateMessage } from '@/lib/chat-utils';
import { validateCSRF } from '@/lib/csrf-protection';
import { chatRateLimiter, memoryRateLimitCheck, isRedisAvailable } from '@/lib/redis';

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

async function saveMsg(sessionId: string, message: string, sender: 'user' | 'ai' | 'admin', imageUrl?: string | null) {
  await db.insert(supportChatMessages).values({
    id: crypto.randomUUID(),
    sessionId,
    message,
    imageUrl: imageUrl || null,
    sender,
    createdAt: new Date(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const { message, sessionId, isAutoReply, imageUrl } = await req.json();
    
    // CSRF Protection (after parsing body to avoid stream issues)
    const csrfCheck = validateCSRF(req);
    if (!csrfCheck.valid) {
      console.warn('[CHAT] CSRF validation failed:', csrfCheck.error);
      return NextResponse.json(
        { error: 'Security validation failed' },
        { status: 403 }
      );
    }
    
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
    }

    // Rate limiting with Redis (fallback to in-memory)
    let rateLimitResult;
    
    if (isRedisAvailable() && chatRateLimiter) {
      // Use Redis-based rate limiting
      rateLimitResult = await chatRateLimiter.limit(sessionId);
    } else {
      // Fallback to in-memory
      const check = memoryRateLimitCheck(sessionId, 10, 60000);
      rateLimitResult = {
        success: check.allowed,
        remaining: check.remaining,
        reset: Date.now() + 60000,
      };
    }

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Слишком много сообщений. Подождите немного.',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitResult.reset - Date.now()) / 1000)),
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
          }
        }
      );
    }

    // Validate message content (skip validation for auto-replies)
    if (!isAutoReply) {
      const validation = validateMessage(message || '', imageUrl || null);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
    }

    if (!message?.trim() && !imageUrl) {
      return NextResponse.json({ error: 'message or image required' }, { status: 400 });
    }

    await upsertSession(sessionId, message);
    
    // Если это авто-ответ, просто сохраняем и возвращаем
    if (isAutoReply) {
      await saveMsg(sessionId, message, 'ai', imageUrl);
      return NextResponse.json({ success: true });
    }
    
    // Сохраняем сообщение пользователя
    await saveMsg(sessionId, message || '📷 Изображение', 'user', imageUrl);

    const [session] = await db.select().from(supportChatSessions)
      .where(eq(supportChatSessions.sessionId, sessionId)).limit(1);

    if (session?.aiDisabled) {
      return NextResponse.json({ takenOver: true, message: '👨‍💼 Оператор подключён. Ожидайте ответа...' });
    }

    const autoReply = findAutoResponse(message || '');
    if (autoReply) {
      await saveMsg(sessionId, autoReply, 'ai');
      return NextResponse.json({ success: true, autoReply });
    }

    return NextResponse.json({ 
      success: true, 
      remaining: rateLimitResult.remaining,
      redis: isRedisAvailable()
    });

  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error('[CHAT POST]', errorMessage);
    return NextResponse.json({ message: 'Ошибка. Попробуйте позже.' });
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json({ messages: [] });
    }

    // Pagination support
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const order = url.searchParams.get('order') || 'asc'; // 'asc' or 'desc'

    const orderBy = order === 'desc' ? desc(supportChatMessages.createdAt) : asc(supportChatMessages.createdAt);

    const messages = await db.select()
      .from(supportChatMessages)
      .where(eq(supportChatMessages.sessionId, sessionId))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ 
      messages,
      hasMore: messages.length === limit,
      total: messages.length
    });
  } catch (error) {
    console.error('[CHAT GET] Error:', error);
    return NextResponse.json({ messages: [], error: 'Failed to load messages' });
  }
}