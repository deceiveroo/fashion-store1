import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { maintenanceSubscriptions } from '@/lib/schema';
import { eq } from 'drizzle-orm';

// POST /api/maintenance/subscribe - Subscribe to maintenance notifications
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    // Check if already subscribed
    const existing = await db.select()
      .from(maintenanceSubscriptions)
      .where(eq(maintenanceSubscriptions.email, email))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Вы уже подписаны на уведомления' 
      });
    }

    // Add subscription
    await db.insert(maintenanceSubscriptions).values({
      email,
      subscribedAt: new Date(),
      notified: false,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Спасибо за подписку! Мы уведомим вас когда сайт заработает.' 
    });
  } catch (error) {
    console.error('Error subscribing to maintenance notifications:', error);
    
    // Handle duplicate email error
    if (error instanceof Error && error.message.includes('unique')) {
      return NextResponse.json({ 
        success: true, 
        message: 'Вы уже подписаны на уведомления' 
      });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
