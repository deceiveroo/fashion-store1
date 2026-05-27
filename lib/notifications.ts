import { db } from '@/lib/db';
import { userNotifications, notificationSettings, users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { sendEmail } from '@/lib/email';

export interface NotificationData {
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'promotion' | 'wishlist' | 'price_drop' | 'security' | 'system';
  category: 'orders' | 'promotions' | 'wishlist' | 'price_drops' | 'newsletter' | 'security';
  actionUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * Send notification to user based on their preferences
 */
export async function sendNotification(data: NotificationData) {
  try {
    // Get user's notification settings
    const settings = await db
      .select()
      .from(notificationSettings)
      .where(eq(notificationSettings.userId, data.userId))
      .limit(1);

    if (settings.length === 0) {
      console.warn(`No notification settings found for user ${data.userId}`);
      return;
    }

    const userSettings = settings[0];

    // Map category to setting keys
    const settingMap: Record<string, { email: string; push: string; sms: string }> = {
      orders: { email: 'ordersEmail', push: 'ordersPush', sms: 'ordersSms' },
      promotions: { email: 'promotionsEmail', push: 'promotionsPush', sms: 'promotionsSms' },
      wishlist: { email: 'wishlistEmail', push: 'wishlistPush', sms: 'wishlistSms' },
      price_drops: { email: 'priceDropsEmail', push: 'priceDropsPush', sms: 'priceDropsSms' },
      newsletter: { email: 'newsletterEmail', push: 'newsletterPush', sms: 'newsletterSms' },
      security: { email: 'securityEmail', push: 'securityPush', sms: 'securitySms' },
    };

    const categorySettings = settingMap[data.category];
    if (!categorySettings) {
      console.warn(`Unknown notification category: ${data.category}`);
      return;
    }

    // Check if user wants this type of notification via each channel
    const shouldSendEmail = (userSettings as any)[categorySettings.email] !== false;
    const shouldSendPush = (userSettings as any)[categorySettings.push] !== false;
    const shouldSendSms = (userSettings as any)[categorySettings.sms] !== false;

    // Create in-app notification (always stored)
    const [notification] = await db
      .insert(userNotifications)
      .values({
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        category: data.category,
        channel: 'in_app',
        actionUrl: data.actionUrl || null,
        metadata: data.metadata || null,
      })
      .returning();

    // Email delivery via lib/email (Resend in prod, log in dev).
    if (shouldSendEmail) {
      try {
        const [u] = await db.select({ email: users.email }).from(users).where(eq(users.id, data.userId)).limit(1);
        if (u?.email) {
          await sendEmail({
            to: u.email,
            subject: data.title,
            html: `<p>${data.message.replace(/</g, '&lt;')}</p>${data.actionUrl ? `<p><a href="${data.actionUrl}">Перейти</a></p>` : ''}`,
            text: data.message,
            tags: [{ name: 'category', value: data.category }],
          });
        }
      } catch (emailError) {
        console.error('[notifications] sendEmail failed:', emailError);
      }
    }

    // Push notifications: not implemented yet (no Web Push / FCM provider configured).
    if (shouldSendPush) {
      console.log(`[notifications] push channel not configured, skipping (user ${data.userId})`);
    }

    // SMS: not implemented yet (no SMS provider configured — Twilio/SMS.ru).
    if (shouldSendSms) {
      console.log(`[notifications] sms channel not configured, skipping (user ${data.userId})`);
    }

    return notification;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string, userId: string) {
  try {
    await db
      .update(userNotifications)
      .set({
        read: true,
        readAt: new Date(),
      })
      .where(eq(userNotifications.id, notificationId));
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Mark notification as clicked
 */
export async function markNotificationAsClicked(notificationId: string, userId: string) {
  try {
    await db
      .update(userNotifications)
      .set({
        clicked: true,
        clickedAt: new Date(),
      })
      .where(eq(userNotifications.id, notificationId));
  } catch (error) {
    console.error('Error marking notification as clicked:', error);
    throw error;
  }
}

/**
 * Get unread notification count for user
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const result = await db
      .select({ count: userNotifications.id })
      .from(userNotifications)
      .where(eq(userNotifications.userId, userId) && eq(userNotifications.read, false));

    return result.length;
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    return 0;
  }
}
