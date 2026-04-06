import { NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { contactMessages } from '../../../../../lib/schema';
import { db } from '../../../../../lib/db'; // Fixed import path
import { requireAdmin } from '../../../../../lib/server-auth';

export async function GET(request: Request) {
  try {
    // Require admin authentication
    await requireAdmin(request);

    // Fetch all contact messages ordered by creation date (newest first)
    const messages = await db
      .select()
      .from(contactMessages)
      .orderBy(desc(contactMessages.createdAt));

    // Convert dates to proper format
    const formattedMessages = messages.map(message => ({
      ...message,
      createdAt: new Date(message.createdAt),
      updatedAt: new Date(message.updatedAt),
      repliedAt: message.repliedAt ? new Date(message.repliedAt) : null,
      resolvedAt: message.resolvedAt ? new Date(message.resolvedAt) : null,
    }));

    return NextResponse.json(formattedMessages);
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch contact messages' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    // Require admin authentication
    await requireAdmin(request);

    const { id } = params;
    const { status } = await request.json();

    // Validate the status
    const validStatuses = ['new', 'in_progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Update the contact message status
    const updatedMessages = await db
      .update(contactMessages)
      .set({ 
        status,
        updatedAt: new Date(),
        ...(status === 'resolved' || status === 'closed' ? { resolvedAt: new Date() } : {})
      })
      .where(eq(contactMessages.id, id))
      .returning();

    if (updatedMessages.length === 0) {
      return NextResponse.json(
        { error: 'Contact message not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: updatedMessages[0]
    });
  } catch (error) {
    console.error('Error updating contact message:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update contact message' },
      { status: 500 }
    );
  }
}