import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supportChatSessions, supportChatMessages, users, userProfiles } from '@/lib/schema';
import { desc, eq, count, sql } from 'drizzle-orm';
import { isAdmin } from '@/lib/server-auth';
import { cache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';
import { calculateResponseTime, formatResponseTime, isSessionStale } from '@/lib/chat-utils';

export async function GET(request: NextRequest) {
  try {
    const admin = await isAdmin();

    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all chat sessions with enhanced data
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = (page - 1) * limit;
    const includeStats = searchParams.get('includeStats') === 'true';

    try {
      // Fetch sessions with pagination and user data
      const sessions = await db
        .select({
          id: supportChatSessions.id,
          sessionId: supportChatSessions.sessionId,
          userId: supportChatSessions.userId,
          userEmail: supportChatSessions.userEmail,
          userName: supportChatSessions.userName,
          status: supportChatSessions.status,
          messageCount: supportChatSessions.messageCount,
          firstMessage: supportChatSessions.firstMessage,
          lastMessageAt: supportChatSessions.lastMessageAt,
          resolvedAt: supportChatSessions.resolvedAt,
          resolvedBy: supportChatSessions.resolvedBy,
          notes: supportChatSessions.notes,
          takenOverBy: supportChatSessions.takenOverBy,
          takenOverAt: supportChatSessions.takenOverAt,
          aiDisabled: supportChatSessions.aiDisabled,
          operatorRating: supportChatSessions.operatorRating,
          operatorRatedAt: supportChatSessions.operatorRatedAt,
          operatorRatedBy: supportChatSessions.operatorRatedBy,
          firstResponseTime: supportChatSessions.firstResponseTime,
          resolutionTime: supportChatSessions.resolutionTime,
          customerSatisfaction: supportChatSessions.customerSatisfaction,
          tags: supportChatSessions.tags,
          category: supportChatSessions.category,
          createdAt: supportChatSessions.createdAt,
          updatedAt: supportChatSessions.updatedAt,
          // User profile data (firstName/lastName/avatar are in userProfiles, not users)
          userFirstName: userProfiles.firstName,
          userLastName: userProfiles.lastName,
          userAvatar: userProfiles.avatar,
          userImage: users.image,
        })
        .from(supportChatSessions)
        .leftJoin(users, eq(supportChatSessions.userId, users.id))
        .leftJoin(userProfiles, eq(supportChatSessions.userId, userProfiles.userId))
        .orderBy(desc(supportChatSessions.lastMessageAt))
        .limit(limit)
        .offset(offset);

      // Enhanced session data with stats if requested
      let enhancedSessions = sessions;
      
      if (includeStats && sessions.length > 0) {
        // Get message counts and response times for each session
        const sessionIds = sessions.map(s => s.sessionId);
        
        // Fetch messages for these sessions
        const messages = await db
          .select()
          .from(supportChatMessages)
          .where(sql`${supportChatMessages.sessionId} IN (${sessionIds.map(() => '?').join(',')})`)
          .orderBy(desc(supportChatMessages.createdAt));

        // Group messages by session
        const messagesBySession = new Map<string, any[]>();
        messages.forEach(msg => {
          if (!messagesBySession.has(msg.sessionId)) {
            messagesBySession.set(msg.sessionId, []);
          }
          messagesBySession.get(msg.sessionId)!.push(msg);
        });

        // Calculate stats for each session
        enhancedSessions = sessions.map(session => {
          const sessionMessages = messagesBySession.get(session.sessionId) || [];
          const responseTime = calculateResponseTime(
            sessionMessages.map(m => ({ sender: m.sender, createdAt: m.createdAt }))
          );

          return {
            ...session,
            messageCount: sessionMessages.length,
            avgResponseTime: responseTime.avgResponseTime > 0 
              ? formatResponseTime(responseTime.avgResponseTime)
              : '—',
            isStale: isSessionStale(session.lastMessageAt),
            lastMessage: sessionMessages[0]?.message || null,
          };
        });
      }

      // Cache the result for 10 seconds to reduce DB load
      const responseData = { sessions: enhancedSessions };
      cache.set(`${CACHE_KEYS.SITE_CONFIG}:support-chats:list:p${page}`, responseData, CACHE_TTL.SHORT);

      return NextResponse.json(responseData);
    } catch (dbError: unknown) {
      const dbErrorMessage = dbError instanceof Error ? dbError.message : String(dbError);
      console.error('[ADMIN] Database error fetching support chats:', dbErrorMessage);
      
      // If table doesn't exist, return empty array with helpful message
      if (dbErrorMessage.includes('does not exist') || dbErrorMessage.includes('relation')) {
        return NextResponse.json({ 
          sessions: [],
          error: 'Database tables not initialized. Please run the migration SQL in Supabase.',
          migrationFile: 'fix-chat-tables-final.sql'
        });
      }
      
      throw dbError;
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[ADMIN] Error fetching support chats:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to fetch support chats' },
      { status: 500 }
    );
  }
}

// Update session status
export async function PATCH(request: NextRequest) {
  try {
    const admin = await isAdmin();

    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId, status, notes, takenOverBy } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (status) {
      updateData.status = status;
      if (status === 'resolved') {
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = admin.id;
      }
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }
    
    if (takenOverBy !== undefined) {
      updateData.takenOverBy = takenOverBy;
      updateData.takenOverAt = new Date();
    }

    await db
      .update(supportChatSessions)
      .set(updateData)
      .where(eq(supportChatSessions.sessionId, sessionId));

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[ADMIN] Error updating support chat:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to update support chat' },
      { status: 500 }
    );
  }
}

// DELETE method to remove individual messages
export async function DELETE(request: NextRequest) {
  try {
    const admin = await isAdmin();

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId, messageId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    if (messageId) {
      // Delete a specific message
      await db
        .delete(supportChatMessages)
        .where(eq(supportChatMessages.id, messageId));
    } else {
      // Delete entire session (admin only)
      await db.transaction(async (tx) => {
        await tx
          .delete(supportChatMessages)
          .where(eq(supportChatMessages.sessionId, sessionId));
        await tx
          .delete(supportChatSessions)
          .where(eq(supportChatSessions.sessionId, sessionId));
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[ADMIN] Error deleting support chat:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to delete support chat' },
      { status: 500 }
    );
  }
}