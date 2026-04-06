import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chatSessions } from '@/lib/schema';
import { eq } from 'drizzle-orm';

// Helper function to convert string session ID to numeric
function stringSessionIdToNumeric(sessionId: string): number {
  let hash = 0;
  for (let i = 0; i < sessionId.length; i++) {
    const char = sessionId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  // Ensure the hash is positive and within reasonable bounds
  return Math.abs(hash) % 1000000000; // Limit to 9 digits
}

export async function POST(request: Request) {
  try {
    const { sessionId, reason } = await request.json();

    // Convert the string session ID to numeric
    const numericSessionId = stringSessionIdToNumeric(sessionId);

    // Update session status to waiting for operator
    await db
      .update(chatSessions)
      .set({ status: 'waiting', updatedAt: new Date() })
      .where(eq(chatSessions.id, numericSessionId));

    // Here you could add logic to notify operators via Telegram or other channels
    // For now, we'll just return a success response

    return NextResponse.json({ 
      success: true, 
      message: 'Operator request has been sent' 
    });
  } catch (error) {
    console.error('Error requesting operator:', error);
    return NextResponse.json(
      { error: 'Failed to request operator' },
      { status: 500 }
    );
  }
}