import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { coupons } from '@/lib/schema';
import { userPurchasedCoupons } from '@/lib/db/gamification-schema';
import { and, eq } from 'drizzle-orm';
import { getSession } from '@/lib/server-auth';

// DELETE /api/admin/coupons/grant/[id]
//   id — purchasedCouponId (из userPurchasedCoupons), либо префикс "purchased:<id>".
//   Удаляет активный код у пользователя и сам coupon-row, если им никто больше не пользуется.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const role = (session.user as any).role;
    if (role !== 'admin' && role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: rawId } = await params;
    const id = rawId.startsWith('purchased:') ? rawId.slice('purchased:'.length) : rawId;

    const [row] = await db
      .select({ couponCode: userPurchasedCoupons.couponCode })
      .from(userPurchasedCoupons)
      .where(eq(userPurchasedCoupons.id, id))
      .limit(1);

    if (!row) {
      return NextResponse.json({ error: 'Активный промокод не найден' }, { status: 404 });
    }

    await db.delete(userPurchasedCoupons).where(eq(userPurchasedCoupons.id, id));

    // Если этот код больше никому не выдан и ни разу не использован — чистим coupons-row тоже.
    const [stillUsed] = await db
      .select({ id: userPurchasedCoupons.id })
      .from(userPurchasedCoupons)
      .where(eq(userPurchasedCoupons.couponCode, row.couponCode))
      .limit(1);

    if (!stillUsed) {
      await db.delete(coupons).where(and(eq(coupons.code, row.couponCode), eq(coupons.usedCount, 0)));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error revoking coupon:', error);
    return NextResponse.json({ error: 'Не удалось отозвать промокод' }, { status: 500 });
  }
}
