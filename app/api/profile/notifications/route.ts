import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { notificationSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await db
      .select()
      .from(notificationSettings)
      .where(eq(notificationSettings.userId, user.id))
      .limit(1);

    if (settings.length === 0) {
      // Create default settings
      const [defaultSettings] = await db
        .insert(notificationSettings)
        .values({
          userId: user.id,
          ordersEmail: true,
          ordersPush: true,
          ordersSms: true,
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

      return NextResponse.json({ settings: defaultSettings });
    }

    return NextResponse.json({ settings: settings[0] });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json({ error: 'Failed to fetch notification settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Update or insert settings
    const existing = await db
      .select()
      .from(notificationSettings)
      .where(eq(notificationSettings.userId, user.id))
      .limit(1);

    if (existing.length === 0) {
      const [settings] = await db
        .insert(notificationSettings)
        .values({
          userId: user.id,
          ...body,
        })
        .returning();

      return NextResponse.json({ settings });
    }

    const [settings] = await db
      .update(notificationSettings)
      .set(body)
      .where(eq(notificationSettings.userId, user.id))
      .returning();

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return NextResponse.json({ error: 'Failed to update notification settings' }, { status: 500 });
  }
}
