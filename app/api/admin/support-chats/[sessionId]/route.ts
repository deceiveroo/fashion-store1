import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supportChatSessions, supportChatMessages, users, userProfiles } from '@/lib/schema';
import { asc, eq } from 'drizzle-orm';
import { isStaff } from '@/lib/server-auth';

type RouteParams = { params: Promise<{ sessionId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await isStaff();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await params;

    const session = await db
      .select()
      .from(supportChatSessions)
      .where(eq(supportChatSessions.sessionId, sessionId))
      .limit(1);

    if (session.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const messages = await db
      .select()
      .from(supportChatMessages)
      .where(eq(supportChatMessages.sessionId, sessionId))
      .orderBy(asc(supportChatMessages.createdAt));

    // Добавляем информацию о сессии включая данные админа
    const sessionData = session[0];
    
    return NextResponse.json({ 
      session: sessionData,
      messages,
      adminInfo: {
        name: sessionData.adminName,
        avatar: sessionData.adminAvatar,
        email: sessionData.adminEmail,
      }
    });
  } catch (error: unknown) {
    console.error('[ADMIN] Error fetching support chat session:', error);
    return NextResponse.json({ error: 'Failed to fetch support chat session' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await isStaff();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await params;
    const { message } = await request.json();
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    const [session] = await db
      .select()
      .from(supportChatSessions)
      .where(eq(supportChatSessions.sessionId, sessionId))
      .limit(1);

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Нельзя писать в чат, перехваченный ДРУГИМ оператором.
    if (session.aiDisabled && session.takenOverBy && session.takenOverBy !== admin.id) {
      return NextResponse.json({ error: `Чат ведёт ${session.adminName || 'другой оператор'}`, claimedByOther: true }, { status: 409 });
    }

    // Получаем информацию об админе
    let adminName: string | null = null;
    let adminAvatar: string | null = null;
    let adminEmail: string | null = null;

    if (admin.id) {
      adminEmail = admin.email || null;
      
      // Пытаемся получить имя и аватар из профиля
      try {
        const profile = await db
          .select({
            firstName: userProfiles.firstName,
            lastName: userProfiles.lastName,
            avatar: userProfiles.avatar,
          })
          .from(userProfiles)
          .where(eq(userProfiles.userId, admin.id))
          .limit(1);
        
        if (profile.length > 0) {
          if (profile[0].firstName || profile[0].lastName) {
            adminName = `${profile[0].firstName || ''} ${profile[0].lastName || ''}`.trim();
          }
          adminAvatar = profile[0].avatar || null;
        }
        
        // Если нет имени в профиле, берем из users
        if (!adminName && admin.name) {
          adminName = admin.name;
        }
      } catch (err) {
        console.warn('Failed to fetch admin profile:', err);
        if (admin.name) {
          adminName = admin.name;
        }
      }
    }

    // Пишем идентичность отправителя per-message (точная история даже после передачи чата).
    // Если миграция с колонками sender_* ещё не применена — отправка не должна падать.
    const baseValues = {
      id: crypto.randomUUID(),
      sessionId,
      message: message.trim(),
      sender: 'admin' as const,
      createdAt: new Date(),
    };
    try {
      await db.insert(supportChatMessages).values({
        ...baseValues,
        senderId: admin.id,
        senderName: adminName,
        senderAvatar: adminAvatar,
      });
    } catch (insertErr) {
      console.warn('[ADMIN] sender_* columns missing — inserting without per-message identity:', insertErr);
      await db.insert(supportChatMessages).values(baseValues);
    }

    await db
      .update(supportChatSessions)
      .set({
        messageCount: (session.messageCount || 0) + 1,
        lastMessageAt: new Date(),
        updatedAt: new Date(),
        aiDisabled: true,
        takenOverBy: admin.id,
        takenOverAt: new Date(),
        adminName: adminName,
        adminAvatar: adminAvatar,
        adminEmail: adminEmail,
      })
      .where(eq(supportChatSessions.sessionId, sessionId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ADMIN] Error sending support message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
