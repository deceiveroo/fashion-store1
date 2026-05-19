import { db } from '@/lib/db';
import { userNotifications, notificationSettings } from '@/lib/schema';
import { eq } from 'drizzle-orm';

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

    // TODO: Implement actual email sending
    if (shouldSendEmail) {
      console.log(`Would send email to user ${data.userId}: ${data.title}`);
      // await sendEmailNotification(data.userId, data);
    }

    // TODO: Implement actual push notifications
    if (shouldSendPush) {
      console.log(`Would send push to user ${data.userId}: ${data.title}`);
      // await sendPushNotification(data.userId, data);
    }

    // TODO: Implement actual SMS sending
    if (shouldSendSms) {
      console.log(`Would send SMS to user ${data.userId}: ${data.title}`);
      // await sendSmsNotification(data.userId, data);
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
