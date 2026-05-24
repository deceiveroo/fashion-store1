import { NextRequest, NextResponse } from 'next/server';
import { db, safeQuery } from '@/lib/db';
import {
  users, userProfiles, orders, orderItems,
  userWishlistItems, products, productImages,
  paymentMethods, notificationSettings,
  coupons, userCouponUsage
} from '@/lib/schema';
import { eq, desc, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { jwtVerify } from 'jose';
import { parseUserAgent } from '@/lib/user-agent';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'your-secret-key';
const secret = new TextEncoder().encode(JWT_SECRET);

async function getUserId(request: NextRequest): Promise<string | null> {
  const session = await auth();
  if (session?.user?.id) return session.user.id;

  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const { payload } = await jwtVerify(authHeader.substring(7), secret);
      return payload.userId as string;
    } catch {
      return null;
    }
  }
  return null;
}

export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }

  // Run all queries in parallel
  const [profile, userOrders, wishlist, payments, sessions, notifications, userCoupons] =
    await Promise.all([
      // Profile
      safeQuery(() =>
        db.select({
          id: users.id,
          email: users.email,
          name: users.name,
          image: users.image,
          firstName: userProfiles.firstName,
          lastName: userProfiles.lastName,
          phone: userProfiles.phone,
          address: userProfiles.address,
          avatar: userProfiles.avatar,
        })
        .from(users)
        .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
        .where(eq(users.id, userId))
        .limit(1)
      ).catch(() => null),

      // Orders
      safeQuery(() =>
        db.select()
        .from(orders)
        .where(eq(orders.userId, userId))
        .orderBy(desc(orders.createdAt))
      ).catch(() => []),

      // Wishlist with images
      safeQuery(() =>
        db.select({
          id: userWishlistItems.id,
          productId: userWishlistItems.productId,
          addedAt: userWishlistItems.createdAt,
          productName: products.name,
          productPrice: products.price,
          productImage: productImages.url,
        })
        .from(userWishlistItems)
        .leftJoin(products, eq(userWishlistItems.productId, products.id))
        .leftJoin(productImages, and(
          eq(productImages.productId, userWishlistItems.productId),
          eq(productImages.isPrimary, true)
        ))
        .where(eq(userWishlistItems.userId, userId))
      ).catch(() => []),

      // Payment methods
      safeQuery(() =>
        db.select()
        .from(paymentMethods)
        .where(eq(paymentMethods.userId, userId))
      ).catch(() => []),

      // Sessions - generate from request headers (mock)
      Promise.resolve([
        (() => {
          const userAgent = request.headers.get('user-agent') || 'Unknown';
          const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     request.headers.get('x-real-ip') || 'Unknown';
          const parsedUA = parseUserAgent(userAgent);
          return {
            id: `current_${userId}_${Date.now()}`,
            device: parsedUA.device || 'Неизвестное устройство',
            location: 'Россия',
            ip: ip,
            lastActive: new Date(),
            isCurrent: true,
          };
        })()
      ]),

      // Notification settings
      safeQuery(() =>
        db.select()
        .from(notificationSettings)
        .where(eq(notificationSettings.userId, userId))
        .limit(1)
      ).catch(() => []),

      // Coupons
      safeQuery(() =>
        db.select({
          id: userCouponUsage.id,
          couponId: userCouponUsage.couponId,
          orderId: userCouponUsage.orderId,
          discountAmount: userCouponUsage.discountAmount,
          usedAt: userCouponUsage.usedAt,
          couponCode: coupons.code,
          couponDiscount: coupons.discount,
          couponType: coupons.type,
          couponActive: coupons.active,
          couponExpiresAt: coupons.expiresAt,
        })
        .from(userCouponUsage)
        .leftJoin(coupons, eq(userCouponUsage.couponId, coupons.id))
        .where(eq(userCouponUsage.userId, userId))
      ).catch(() => []),
    ]);

  // Format profile
  const user = profile?.[0];
  const nameParts = user?.name?.split(' ') || ['', ''];
  const avatarUrl = user?.avatar || user?.image;

  // Format wishlist items
  const wishlistItems = (wishlist || []).map((item: any) => ({
    id: item.id,
    productId: item.productId,
    addedAt: item.addedAt,
    product: {
      id: item.productId,
      name: item.productName,
      price: parseFloat(String(item.productPrice || '0')),
      inStock: true,
    },
    image: item.productImage || '',
  }));

  // Format sessions
  const formattedSessions = (sessions || []).map((s: any) => ({
    id: s.id,
    device: s.device || 'Неизвестное устройство',
    location: s.location || 'Неизвестно',
    ip: s.ip || '',
    lastActive: s.lastActive,
    isCurrent: s.isCurrent || false,
  }));

  // Format coupons
  const now = new Date();
  const formattedCoupons = (userCoupons || []).map((c: any) => ({
    id: c.id,
    couponId: c.couponId,
    code: c.couponCode,
    orderId: c.orderId,
    discountAmount: c.discountAmount,
    usedAt: c.usedAt,
    couponCode: c.couponCode,
    couponDiscount: c.couponDiscount,
    couponType: c.couponType,
    couponActive: c.couponActive,
    couponExpiresAt: c.couponExpiresAt,
    isExpired: c.couponExpiresAt ? new Date(c.couponExpiresAt) < now : false,
    isValid: c.couponActive && (!c.couponExpiresAt || new Date(c.couponExpiresAt) > now),
  }));

  return NextResponse.json({
    profile: user ? {
      id: user.id,
      email: user.email,
      name: user.name,
      firstName: user.firstName || nameParts[0],
      lastName: user.lastName || nameParts[1] || '',
      phone: user.phone || '',
      address: user.address || '',
      avatar: avatarUrl,
      image: avatarUrl,
    } : null,
    orders: userOrders || [],
    wishlist: wishlistItems,
    paymentMethods: (payments || []).map((p: any) => ({
      id: p.id,
      type: p.type,
      last4: p.last4,
      brand: p.brand,
      expiryMonth: p.expiryMonth,
      expiryYear: p.expiryYear,
      holderName: p.holderName,
      isDefault: p.isDefault,
    })),
    sessions: formattedSessions,
    coupons: formattedCoupons,
    notifications: notifications?.[0] || {},
  });
}
