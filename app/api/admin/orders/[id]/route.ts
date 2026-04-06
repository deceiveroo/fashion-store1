import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user || !['admin', 'manager', 'support'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status, recipient, comment, deliveryMethod, paymentMethod } = body;

    const updateData: any = { updatedAt: new Date() };
    if (status) updateData.status = status;
    if (recipient) updateData.recipient = recipient;
    if (comment !== undefined) updateData.comment = comment;
    if (deliveryMethod) updateData.deliveryMethod = deliveryMethod;
    if (paymentMethod) updateData.paymentMethod = paymentMethod;

    await db.update(orders).set(updateData).where(eq(orders.id, params.id));

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
    const session = await auth();
    if (!session?.user || !['admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await db.delete(orderItems).where(eq(orderItems.orderId, params.id));
    await db.delete(orders).where(eq(orders.id, params.id));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[ADMIN ORDERS] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}
