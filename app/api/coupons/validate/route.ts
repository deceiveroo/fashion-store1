import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { coupons, userCouponUsage } from '@/lib/schema';
import { eq, and, or, lte, gte, isNull } from 'drizzle-orm';
import { getSession } from '@/lib/server-auth';

// POST /api/coupons/validate - Validate and apply coupon
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, orderTotal } = body;

    if (!code || !orderTotal) {
      return NextResponse.json(
        { error: 'Code and order total are required' },
        { status: 400 }
      );
    }

    // Find coupon
    const coupon = await db
      .select()
      .from(coupons)
      .where(eq(coupons.code, code.toUpperCase()))
      .limit(1);

    if (coupon.length === 0) {
      return NextResponse.json(
        { error: 'Промокод не найден', valid: false },
        { status: 404 }
      );
    }

    const foundCoupon = coupon[0];

    // Check if active
    if (!foundCoupon.active) {
      return NextResponse.json(
        { error: 'Промокод не активен', valid: false },
        { status: 400 }
      );
    }

    // Check expiration
    if (foundCoupon.expiresAt && new Date(foundCoupon.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Срок действия промокода истёк', valid: false },
        { status: 400 }
      );
    }

    // Check usage limit
    if (foundCoupon.maxUses && (foundCoupon.usedCount || 0) >= foundCoupon.maxUses) {
      return NextResponse.json(
        { error: 'Промокод больше не доступен (лимит использований)', valid: false },
        { status: 400 }
      );
    }

    // Check minimum order
    if (foundCoupon.minOrder && parseFloat(orderTotal) < parseFloat(foundCoupon.minOrder)) {
      return NextResponse.json(
        { 
          error: `Минимальная сумма заказа: ${parseInt(foundCoupon.minOrder).toLocaleString('ru-RU')} ₽`,
          valid: false 
        },
        { status: 400 }
      );
    }

    // CRITICAL: Check if user already used this coupon
    const session = await getSession();
    if (session?.user?.id) {
      const existingUsage = await db
        .select()
        .from(userCouponUsage)
        .where(
          and(
            eq(userCouponUsage.userId, session.user.id),
            eq(userCouponUsage.couponId, foundCoupon.id)
          )
        )
        .limit(1);

      if (existingUsage.length > 0) {
        return NextResponse.json(
          { 
            error: 'Вы уже использовали этот промокод. Один промокод — один раз на аккаунт.',
            valid: false,
            alreadyUsed: true
          },
          { status: 400 }
        );
      }
    }

    // Calculate discount
    let discountAmount = 0;
    if (foundCoupon.type === 'percent') {
      discountAmount = Math.round((parseFloat(orderTotal) * foundCoupon.discount) / 100);
    } else {
      discountAmount = foundCoupon.discount;
    }

    // Ensure discount doesn't exceed order total
    discountAmount = Math.min(discountAmount, parseFloat(orderTotal));

    return NextResponse.json({
      valid: true,
      coupon: {
        id: foundCoupon.id,
        code: foundCoupon.code,
        type: foundCoupon.type,
        discount: foundCoupon.discount,
      },
      discountAmount,
      message: `Скидка ${foundCoupon.type === 'percent' ? `${foundCoupon.discount}%` : `${foundCoupon.discount} ₽`} применена`
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    return NextResponse.json(
      { error: 'Ошибка проверки промокода', valid: false },
      { status: 500 }
    );
  }
}
