import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { contactMessages } from '../../../../lib/schema';
import { db } from '../../../../lib/db'; // Fixed import path

export async function POST(request: Request) {
  try {
    const { firstName, lastName, email, subject, message, category, userAgent, ipAddress } = await request.json();

    // Validate required fields
    if (!firstName || !lastName || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Determine user ID if authenticated
    let userId = null;
    // Note: In a real implementation, you would extract user ID from the session here
    
    // Insert the contact message into the database
    const [newContactMessage] = await db
      .insert(contactMessages)
      .values({
        userId,
        firstName,
        lastName,
        email,
        subject,
        message,
        category: category || 'general',
        userAgent,
        ipAddress,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(
      { 
        success: true, 
        id: newContactMessage.id,
        message: 'Contact message submitted successfully' 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting contact form:', error);
    return NextResponse.json(
      { error: 'Failed to submit contact form' },
      { status: 500 }
    );
  }
}