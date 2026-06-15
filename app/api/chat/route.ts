import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supportChatMessages, supportChatSessions } from '@/lib/schema';
import { eq, asc, desc } from 'drizzle-orm';
import { findAutoResponse } from '@/lib/chat-auto-responses';
import { generateAiReply } from '@/lib/ai/chat-ai';
import { sendOperatorAlert } from '@/lib/telegram';
import { bumpAiStat } from '@/lib/ai/stats';
import { validateMessage } from '@/lib/chat-utils';
import { validateCSRF } from '@/lib/csrf-protection';
import { chatRateLimiter, memoryRateLimitCheck, isRedisAvailable, redis } from '@/lib/redis';
import { resolveChatSession, applyChatCookie } from '@/lib/chat-session';

async function upsertSession(sessionId: string, userId: string | null, firstMsg?: string) {
  const existing = await db.select().from(supportChatSessions)
    .where(eq(supportChatSessions.sessionId, sessionId)).limit(1);
  if (existing.length === 0) {
    await db.insert(supportChatSessions).values({
      id: crypto.randomUUID(),
      sessionId,
      userId: userId || null,
      status: 'active',
      messageCount: 1,
      firstMessage: firstMsg || null,
      lastMessageAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } else {
    await db.update(supportChatSessions).set({
      // Always keep userId in sync — fixes legacy rows where it was null.
      ...(userId ? { userId } : {}),
      messageCount: (existing[0].messageCount || 0) + 1,
      lastMessageAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(supportChatSessions.sessionId, sessionId));
  }
}

async function saveMsg(sessionId: string, userId: string | null, message: string, sender: 'user' | 'ai' | 'admin', imageUrl?: string | null) {
  await db.insert(supportChatMessages).values({
    id: crypto.randomUUID(),
    sessionId,
    userId: userId || null,
    message,
    imageUrl: imageUrl || null,
    sender,
    createdAt: new Date(),
  });

  // Notify listeners via Redis for real-time SSE stream
  if (isRedisAvailable() && redis) {
    try {
      await redis.set(`chat:update:${sessionId}`, Date.now().toString());
    } catch (err) {
      console.error('[CHAT REDIS NOTIFY] Failed to set update key:', err);
    }
  }
}


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, isAutoReply, imageUrl } = body;

    // CSRF Protection (after parsing body to avoid stream issues)
    const csrfCheck = validateCSRF(req);
    if (!csrfCheck.valid) {
      console.warn('[CHAT] CSRF validation failed:', csrfCheck.error);
      return NextResponse.json({ error: 'Security validation failed' }, { status: 403 });
    }

    // SECURITY: ignore sessionId from body. The server resolves it from auth() / signed cookie.
    const resolved = await resolveChatSession(req);
    const sessionId = resolved.sessionId;
    const userId = resolved.userId;

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

    await upsertSession(sessionId, userId, message);

    // Если это авто-ответ, просто сохраняем и возвращаем
    if (isAutoReply) {
      await saveMsg(sessionId, userId, message, 'ai', imageUrl);
      const okRes = NextResponse.json({ success: true, sessionId });
      applyChatCookie(okRes, resolved.guestCookieToSet);
      return okRes;
    }

    // Сохраняем сообщение пользователя
    await saveMsg(sessionId, userId, message || '📷 Изображение', 'user', imageUrl);

    const [session] = await db.select().from(supportChatSessions)
      .where(eq(supportChatSessions.sessionId, sessionId)).limit(1);

    if (session?.aiDisabled) {
      const res = NextResponse.json({ takenOver: true, sessionId, message: '👨‍💼 Оператор подключён. Ожидайте ответа...' });
      applyChatCookie(res, resolved.guestCookieToSet);
      return res;
    }

    // 1) Try the AI assistant (active provider configured in admin → settings).
    //    Returns null when AI is disabled, no provider is set, or generation failed.
    const aiStart = Date.now();
    const ai = await generateAiReply({ sessionId, userId, message: message || '' });

    let reply: string | null = ai?.text ?? null;
    const escalate = ai?.escalate ?? false;
    let usedFallback = false;

    // 2) Fallback to the curated keyword auto-responder if AI produced nothing.
    if (!reply) {
      reply = findAutoResponse(message || '');
      if (reply) usedFallback = true;
    }

    if (reply) {
      // Re-check the takeover flag: an operator may have grabbed the session while
      // the model was generating. If so, don't post an AI message over them.
      const [fresh] = await db.select({ aiDisabled: supportChatSessions.aiDisabled })
        .from(supportChatSessions)
        .where(eq(supportChatSessions.sessionId, sessionId)).limit(1);

      if (fresh?.aiDisabled) {
        const res = NextResponse.json({ takenOver: true, sessionId, message: '👨‍💼 Оператор подключён. Ожидайте ответа...' });
        applyChatCookie(res, resolved.guestCookieToSet);
        return res;
      }

      await saveMsg(sessionId, userId, reply, 'ai');

      // Record analytics (never blocks the reply).
      bumpAiStat(escalate ? 'escalated' : usedFallback ? 'fallback' : 'answered', Date.now() - aiStart)
        .catch(() => {});

      // Hand the chat off to a human: flip aiDisabled so the AI stops replying,
      // leave takenOverBy null so the admin UI shows "needs operator", and alert
      // operators via Telegram (best-effort).
      if (escalate) {
        await db.update(supportChatSessions)
          .set({ aiDisabled: true, updatedAt: new Date() })
          .where(eq(supportChatSessions.sessionId, sessionId));

        const [sess] = await db.select({ userName: supportChatSessions.userName, userEmail: supportChatSessions.userEmail })
          .from(supportChatSessions)
          .where(eq(supportChatSessions.sessionId, sessionId)).limit(1);
        sendOperatorAlert({
          sessionId,
          userName: sess?.userName,
          userEmail: sess?.userEmail,
          lastMessage: message || '',
          reason: 'ИИ передал диалог оператору',
        }).catch(() => {});
      }

      const res = NextResponse.json({ success: true, sessionId, autoReply: reply, escalated: escalate });
      applyChatCookie(res, resolved.guestCookieToSet);
      return res;
    }

    const res = NextResponse.json({
      success: true,
      sessionId,
      remaining: rateLimitResult.remaining,
      redis: isRedisAvailable()
    });
    applyChatCookie(res, resolved.guestCookieToSet);
    return res;

  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error('[CHAT POST]', errorMessage);
    return NextResponse.json({ message: 'Ошибка. Попробуйте позже.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    // SECURITY: ignore client-provided sessionId. Read messages only for the session
    // we resolve from auth() / signed cookie.
    const resolved = await resolveChatSession(req);
    const sessionId = resolved.sessionId;

    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const order = url.searchParams.get('order') || 'asc';
    const orderBy = order === 'desc' ? desc(supportChatMessages.createdAt) : asc(supportChatMessages.createdAt);

    const messages = await db.select()
      .from(supportChatMessages)
      .where(eq(supportChatMessages.sessionId, sessionId))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const [sessionRow] = await db.select().from(supportChatSessions)
      .where(eq(supportChatSessions.sessionId, sessionId)).limit(1);

    const adminInfo = sessionRow ? {
      name: sessionRow.adminName ?? null,
      avatar: sessionRow.adminAvatar ?? null,
      email: sessionRow.adminEmail ?? null,
    } : null;

    const res = NextResponse.json({
      sessionId,
      messages,
      adminInfo,
      // Состояние сессии нужно виджету, чтобы показать запрос оценки оператора
      // после того, как админ завершил диалог.
      status: sessionRow?.status ?? 'active',
      takenOver: sessionRow?.aiDisabled ?? false,
      operatorRating: sessionRow?.operatorRating ?? null,
      hasMore: messages.length === limit,
      total: messages.length,
    });
    applyChatCookie(res, resolved.guestCookieToSet);
    return res;
  } catch (error) {
    console.error('[CHAT GET] Error:', error);
    return NextResponse.json({ messages: [], error: 'Failed to load messages' }, { status: 500 });
  }
}