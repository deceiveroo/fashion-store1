import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shopCoupons, userPurchasedCoupons } from '@/lib/db/gamification-schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/server-auth';

// PUT /api/admin/shop-coupons/[id] - Update shop coupon
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const id = params.id;
    const body = await request.json();

    const [updated] = await db
      .update(shopCoupons)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(shopCoupons.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, coupon: updated });
  } catch (error) {
    console.error('Error updating shop coupon:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

// DELETE /api/admin/shop-coupons/[id] - Delete shop coupon
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const id = params.id;

    // Delete associated purchases first
    await db
      .delete(userPurchasedCoupons)
      .where(eq(userPurchasedCoupons.shopCouponId, id));

    // Delete the coupon
    const [deleted] = await db
      .delete(shopCoupons)
      .where(eq(shopCoupons.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting shop coupon:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}

// POST /api/admin/shop-coupons/[id]/reset - Reset all purchases for this coupon
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const id = params.id;

    // Delete all purchases for this coupon
    await db
      .delete(userPurchasedCoupons)
      .where(eq(userPurchasedCoupons.shopCouponId, id));

    // Reset purchased count
    await db
      .update(shopCoupons)
      .set({ purchasedCount: 0, updatedAt: new Date() })
      .where(eq(shopCoupons.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error resetting purchases:', error);
    return NextResponse.json({ error: 'Failed to reset' }, { status: 500 });
  }
}
