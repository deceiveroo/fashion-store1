import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supportChatSessions, supportChatMessages } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Skip processing if not configured
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      return NextResponse.json({ error: 'Telegram not configured' }, { status: 500 });
    }

    const update = await request.json();
    
    // Handle different types of updates
    if (update.message) {
      // Regular message
      const message = update.message;
      const chatId = message.chat.id;
      const text = message.text || message.caption || '';

      // Check if it's an admin sending a reply via /reply_{sessionId} command
      const replyMatch = text.match(/\/reply_(.+?)\s+(.+)/);
      if (replyMatch) {
        const [, sessionId, adminReply] = replyMatch;
        
        // Record admin reply in DB
        await db.insert(supportChatMessages).values({
          id: randomUUID(),
          sessionId,
          message: adminReply,
          sender: 'admin',
          createdAt: new Date(),
        });
        
        // Update session
        await db
          .update(supportChatSessions)
          .set({ lastMessageAt: new Date() })
          .where(eq(supportChatSessions.sessionId, sessionId));
          
        return NextResponse.json({ success: true });
      }
    } 
    else if (update.callback_query) {
      // Callback query (inline keyboard buttons)
      const callbackQuery = update.callback_query;
      const callbackData = callbackQuery.data;
      
      if (callbackData?.startsWith('takeover:')) {
        const sessionId = callbackData.split(':')[1];
        if (sessionId) {
          // Update session to mark as taken by this admin
          await db
            .update(supportChatSessions)
            .set({
              takenOverBy: callbackQuery.from.id.toString(),
              takenOverAt: new Date(),
              status: 'active',
            })
            .where(eq(supportChatSessions.sessionId, sessionId));
        }
      } 
      else if (callbackData?.startsWith('resolve:')) {
        const sessionId = callbackData.split(':')[1];
        if (sessionId) {
          // Update session to mark as resolved
          await db
            .update(supportChatSessions)
            .set({
              status: 'resolved',
              resolvedAt: new Date(),
              resolvedBy: callbackQuery.from.id.toString(),
            })
            .where(eq(supportChatSessions.sessionId, sessionId));
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing Telegram webhook:', error);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}