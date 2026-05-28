import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { coupons } from '@/lib/schema';
import { shopCoupons, userPurchasedCoupons } from '@/lib/db/gamification-schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/server-auth';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const SYSTEM_GRANT_CODE = '__SYSTEM_ADMIN_GRANT__';

function generateCode(prefix?: string): string {
  let body = '';
  for (let i = 0; i < 8; i++) {
    body += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return prefix ? `${prefix.toUpperCase()}-${body}` : body;
}

// userPurchasedCoupons.shopCouponId is NOT NULL → нам нужен «фиктивный» shop-coupon,
// под который мы записываем выдачи админа. Создаётся один раз и переиспользуется.
async function getOrCreateSystemShopCouponId(): Promise<string> {
  const existing = await db
    .select({ id: shopCoupons.id })
    .from(shopCoupons)
    .where(eq(shopCoupons.couponCode, SYSTEM_GRANT_CODE))
    .limit(1);
  if (existing[0]) return existing[0].id;

  const [created] = await db
    .insert(shopCoupons)
    .values({
      name: 'Admin Grant',
      couponCode: SYSTEM_GRANT_CODE,
      discount: 0,
      discountType: 'percent',
      priceCoins: 0,
      isActive: false,
      description: 'System placeholder for admin-granted coupons. Не показывать в магазине.',
    })
    .returning({ id: shopCoupons.id });
  return created.id;
}

// POST /api/admin/coupons/grant — issue a personal coupon to a user.
// Body: { userId, discount, type ('percent' | 'fixed'), expiresDays?, minOrder?, code? }
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const role = (session.user as any).role;
    if (role !== 'admin' && role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, discount, type, expiresDays, minOrder, code: customCode } = body || {};

    if (!userId || !discount || !type) {
      return NextResponse.json(
        { error: 'userId, discount, type обязательны' },
        { status: 400 },
      );
    }
    if (type !== 'percent' && type !== 'fixed') {
      return NextResponse.json({ error: 'type must be percent или fixed' }, { status: 400 });
    }
    if (type === 'percent' && (discount < 1 || discount > 100)) {
      return NextResponse.json(
        { error: 'Процентная скидка должна быть от 1 до 100' },
        { status: 400 },
      );
    }
    if (type === 'fixed' && discount <= 0) {
      return NextResponse.json(
        { error: 'Фиксированная скидка должна быть больше 0' },
        { status: 400 },
      );
    }

    const days = Number(expiresDays) > 0 ? Number(expiresDays) : 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    // Pick a code: custom (uppercased) or generate a unique one with GIFT- prefix.
    let finalCode: string;
    if (customCode && typeof customCode === 'string' && customCode.trim()) {
      finalCode = customCode.trim().toUpperCase();
      const exists = await db.select().from(coupons).where(eq(coupons.code, finalCode)).limit(1);
      if (exists.length > 0) {
        return NextResponse.json(
          { error: 'Промокод с таким кодом уже существует' },
          { status: 409 },
        );
      }
    } else {
      let attempt = 0;
      do {
        finalCode = generateCode('GIFT');
        const exists = await db
          .select()
          .from(coupons)
          .where(eq(coupons.code, finalCode))
          .limit(1);
        if (exists.length === 0) break;
        attempt++;
      } while (attempt < 10);
    }

    const [created] = await db
      .insert(coupons)
      .values({
        code: finalCode,
        discount: Number(discount),
        type,
        minOrder: minOrder ? String(minOrder) : null,
        maxUses: 1,
        usedCount: 0,
        active: true,
        expiresAt,
        createdBy: session.user.id,
      })
      .returning();

    const [granted] = await db
      .insert(userPurchasedCoupons)
      .values({
        userId,
        shopCouponId: await getOrCreateSystemShopCouponId(),
        couponCode: created.code,
        coinsSpent: 0,
        redeemed: false,
        expiresAt,
      })
      .returning();

    return NextResponse.json({ success: true, coupon: created, granted });
  } catch (error) {
    console.error('Error granting coupon:', error);
    return NextResponse.json({ error: 'Не удалось выдать промокод' }, { status: 500 });
  }
}
