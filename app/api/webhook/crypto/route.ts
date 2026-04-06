import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // In a real implementation, this would receive webhook notifications from a crypto payment processor
    // For this demo, we'll simulate receiving a notification about a payment
    
    const payload = await request.json();
    
    // Verify webhook signature if applicable
    // This would involve checking a signature header against your secret
    
    if (!payload.transactionId || !payload.address || !payload.status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find the order associated with this crypto payment
    const order = await db
      .select()
      .from(orders)
      .where(eq(orders.cryptoAddress, payload.address))
      .limit(1);

    if (order.length === 0) {
      console.error(`Order not found for crypto address: ${payload.address}`);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Update the order based on the payment status
    let newStatus = order[0].status;
    if (payload.status === 'confirmed' || payload.status === 'completed') {
      newStatus = 'paid';
    } else if (payload.status === 'failed' || payload.status === 'expired') {
      newStatus = 'cancelled';
    }
    // Note: pending/processing statuses might not change the order status

    // Update the order in the database
    await db
      .update(orders)
      .set({ 
        status: newStatus,
        paymentStatus: payload.status,
        cryptoTxId: payload.transactionId,
        updatedAt: new Date()
      })
      .where(eq(orders.id, order[0].id));

    console.log(`Order ${order[0].id} payment status updated to ${newStatus} based on crypto payment`);

    // In a real implementation, you might want to send a notification to the user
    // or trigger other business logic depending on the payment status

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully',
      orderId: order[0].id,
      newStatus
    });
  } catch (error: any) {
    console.error('Error processing crypto payment webhook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}