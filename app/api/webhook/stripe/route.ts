import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db';
import { orders } from '@/lib/schema';
import { eq } from 'drizzle-orm';

// 创建 Stripe 客户端的函数，仅在运行时调用
function getStripeInstance() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY не настроен в переменных окружения');
  }
  
  return new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16',
  });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  // 初始化 Stripe 客户端（仅在运行时）
  const stripe = getStripeInstance();
  
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntentSucceeded = event.data.object as Stripe.PaymentIntent;
        
        // Обновляем статус заказа в зависимости от метаданных
        const orderId = paymentIntentSucceeded.metadata?.orderId;
        if (orderId) {
          await db
            .update(orders)
            .set({ status: 'paid', updatedAt: new Date() })
            .where(eq(orders.id, orderId));
        }
        break;

      case 'payment_intent.payment_failed':
        const paymentIntentFailed = event.data.object as Stripe.PaymentIntent;
        
        // Обновляем статус заказа на "отменён"
        const failedOrderId = paymentIntentFailed.metadata?.orderId;
        if (failedOrderId) {
          await db
            .update(orders)
            .set({ status: 'cancelled', updatedAt: new Date() })
            .where(eq(orders.id, failedOrderId));
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook event:', error);
    return NextResponse.json(
      { error: 'Error processing webhook event' },
      { status: 500 }
    );
  }
}