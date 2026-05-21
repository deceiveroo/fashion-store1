import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supportChatSessions, supportChatMessages } from '@/lib/schema';
import { lt, eq } from 'drizzle-orm';
import { isAdmin } from '@/lib/server-auth';

/**
 * Cleanup old chat sessions
 * Removes sessions older than specified days
 * Should be called periodically (cron job or manual trigger)
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await isAdmin();

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { daysOld = 30 } = await request.json();

    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    // Find old sessions
    const oldSessions = await db
      .select({ sessionId: supportChatSessions.sessionId })
      .from(supportChatSessions)
      .where(lt(supportChatSessions.lastMessageAt, cutoffDate));

    if (oldSessions.length === 0) {
      return NextResponse.json({ 
        success: true, 
        deletedSessions: 0,
        deletedMessages: 0,
        message: 'No old sessions to delete'
      });
    }

    const sessionIds = oldSessions.map(s => s.sessionId);

    // Delete messages first (cascade might handle this, but being explicit)
    let deletedMessages = 0;
    for (const sessionId of sessionIds) {
      const result = await db
        .delete(supportChatMessages)
        .where(eq(supportChatMessages.sessionId, sessionId));
      
      deletedMessages += result.rowCount || 0;
    }

    // Delete sessions
    const result = await db
      .delete(supportChatSessions)
      .where(lt(supportChatSessions.lastMessageAt, cutoffDate));

    const deletedSessions = result.rowCount || 0;

    console.log(`[CLEANUP] Deleted ${deletedSessions} sessions and ${deletedMessages} messages older than ${daysOld} days`);

    return NextResponse.json({
      success: true,
      deletedSessions,
      deletedMessages,
      cutoffDate: cutoffDate.toISOString(),
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[CLEANUP] Error cleaning up old chats:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to cleanup old chats' },
      { status: 500 }
    );
  }
}

// GET method to preview what would be deleted
export async function GET(request: NextRequest) {
  try {
    const admin = await isAdmin();

    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const daysOld = parseInt(searchParams.get('daysOld') || '30');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    // Count old sessions
    const oldSessions = await db
      .select({ 
        sessionId: supportChatSessions.sessionId,
        lastMessageAt: supportChatSessions.lastMessageAt,
        status: supportChatSessions.status,
      })
      .from(supportChatSessions)
      .where(lt(supportChatSessions.lastMessageAt, cutoffDate))
      .limit(100);

    return NextResponse.json({
      totalOldSessions: oldSessions.length,
      cutoffDate: cutoffDate.toISOString(),
      sampleSessions: oldSessions.slice(0, 10),
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[CLEANUP] Error previewing cleanup:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to preview cleanup' },
      { status: 500 }
    );
  }
}
