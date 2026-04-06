import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

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
  try {
    // 初始化 Stripe 客户端（仅在运行时）
    const stripe = getStripeInstance();
    
    const { amount, currency } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: currency || 'rub',
      metadata: {
        // Здесь можно добавить информацию о заказе
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}