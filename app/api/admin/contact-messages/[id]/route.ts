import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { contactMessages } from '../../../../../../lib/schema';
import { db } from '../../../../../../lib/db'; // Fixed import path
import { requireAdmin } from '../../../../../../lib/server-auth';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    // Require admin authentication
    await requireAdmin(request);

    const { id } = params;
    const { status, resolutionNotes } = await request.json();

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
        resolutionNotes: resolutionNotes || undefined,
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