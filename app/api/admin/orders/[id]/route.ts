import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { getSession, isStaff, isAdmin } from '@/lib/server-auth';
import { invalidateCacheByPrefix } from '@/lib/cache';

const VALID_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'] as const;
type OrderStatus = typeof VALID_STATUSES[number];

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const staff = await isStaff();
    if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { status, recipient, comment, deliveryMethod, paymentMethod } = body;

    if (status && !VALID_STATUSES.includes(status as OrderStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (status) updateData.status = status;
    if (recipient) updateData.recipient = recipient;
    if (comment !== undefined) updateData.comment = comment;
    if (deliveryMethod) updateData.deliveryMethod = deliveryMethod;
    if (paymentMethod) updateData.paymentMethod = paymentMethod;

    await db.update(orders).set(updateData).where(eq(orders.id, params.id));

    // Invalidate analytics & stats cache after order mutation
    await invalidateCacheByPrefix('analytics:');
    await invalidateCacheByPrefix('stats:');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[ADMIN ORDERS] PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await isAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized — admin only' }, { status: 403 });

    await db.transaction(async (tx) => {
      await tx.delete(orderItems).where(eq(orderItems.orderId, params.id));
      await tx.delete(orders).where(eq(orders.id, params.id));
    });

    // Invalidate caches
    await invalidateCacheByPrefix('analytics:');
    await invalidateCacheByPrefix('stats:');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[ADMIN ORDERS] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}
