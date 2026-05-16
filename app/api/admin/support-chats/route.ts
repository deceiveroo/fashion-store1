import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supportChatSessions, supportChatMessages } from '@/lib/schema';
import { desc, eq } from 'drizzle-orm';
import { isAdmin } from '@/lib/server-auth';
import { cache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const admin = await isAdmin();

    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check cache first
    const cacheKey = `${CACHE_KEYS.SITE_CONFIG}:support-chats:list`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Get all chat sessions
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = (page - 1) * limit;

    try {
      const sessions = await db
        .select()
        .from(supportChatSessions)
        .orderBy(desc(supportChatSessions.lastMessageAt))
        .limit(limit)
        .offset(offset);

      // Cache the result for 10 seconds to reduce DB load
      const responseData = { sessions };
      cache.set(cacheKey, responseData, CACHE_TTL.SHORT); // 10 seconds

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