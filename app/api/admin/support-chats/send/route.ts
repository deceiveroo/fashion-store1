import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { supportChatMessages, supportChatSessions, users, userProfiles } from '@/lib/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { isStaff } from '@/lib/server-auth';

export async function POST(req: NextRequest) {
  try {
    const admin = await isStaff();
    if (!admin) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId, message, imageUrl } = await req.json();

    if (!sessionId) {
      return Response.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Verify session exists
    const session = await db.select()
      .from(supportChatSessions)
      .where(eq(supportChatSessions.sessionId, sessionId))
      .limit(1);

    if (session.length === 0) {
      return Response.json({ error: 'Session not found' }, { status: 404 });
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

    // Insert the admin message
    await db.insert(supportChatMessages).values({
      sessionId,
      message,
      imageUrl: imageUrl || null, // Store image URL if provided
      sender: 'admin',
    });

    // Update session stats with admin info
    await db.update(supportChatSessions)
      .set({
        messageCount: sql`${supportChatSessions.messageCount} + 1`,
        lastMessageAt: new Date(),
        takenOverBy: admin.id,
        takenOverAt: new Date(),
        adminName: adminName,
        adminAvatar: adminAvatar,
        adminEmail: adminEmail,
        aiDisabled: true,
      })
      .where(eq(supportChatSessions.sessionId, sessionId));

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error sending admin message:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}