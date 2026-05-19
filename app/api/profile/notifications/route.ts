import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { notificationSettings } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/server-auth';

// GET /api/profile/notifications - Get user notification settings
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Try to get existing settings
    const settings = await db
      .select()
      .from(notificationSettings)
      .where(eq(notificationSettings.userId, userId))
      .limit(1);

    // If no settings exist, create default ones
    if (settings.length === 0) {
      const [newSettings] = await db
        .insert(notificationSettings)
        .values({
          userId,
          ordersEmail: true,
          ordersPush: true,
          ordersSms: false,
          promotionsEmail: true,
          promotionsPush: false,
          promotionsSms: false,
          wishlistEmail: true,
          wishlistPush: true,
          wishlistSms: false,
          priceDropsEmail: true,
          priceDropsPush: true,
          priceDropsSms: false,
          newsletterEmail: true,
          newsletterPush: false,
          newsletterSms: false,
          securityEmail: true,
          securityPush: true,
          securitySms: true,
        })
        .returning();

      return NextResponse.json({ settings: newSettings });
    }

    return NextResponse.json({ settings: settings[0] });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification settings' },
      { status: 500 }
    );
  }
}

// POST /api/profile/notifications - Update user notification settings
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();

    // Validate input
    const allowedFields = [
      'ordersEmail', 'ordersPush', 'ordersSms',
      'promotionsEmail', 'promotionsPush', 'promotionsSms',
      'wishlistEmail', 'wishlistPush', 'wishlistSms',
      'priceDropsEmail', 'priceDropsPush', 'priceDropsSms',
      'newsletterEmail', 'newsletterPush', 'newsletterSms',
      'securityEmail', 'securityPush', 'securitySms',
    ];

    const updates: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined && typeof body[field] === 'boolean') {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Upsert settings
    const [updatedSettings] = await db
      .insert(notificationSettings)
      .values({
        userId,
        ...updates,
      })
      .onConflictDoUpdate({
        target: notificationSettings.userId,
        set: {
          ...updates,
          updatedAt: new Date(),
        },
      })
      .returning();

    return NextResponse.json({ 
      message: 'Notification settings updated',
      settings: updatedSettings 
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to update notification settings' },
      { status: 500 }
    );
  }
}
