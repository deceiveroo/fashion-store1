import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { orderId, amount, phone } = await request.json();

    if (!orderId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // В реальной реализации здесь будет вызов API платёжного провайдера СБП
    // Ниже представлен упрощённый пример генерации URL для оплаты
    
    // Генерация уникального URL для оплаты СБП
    // В реальной интеграции вы бы вызвали API-метод конкретного провайдера (например, Яндекс.Касса, CloudPayments и т.д.)
    const paymentUrl = `https://your-sbp-provider.com/pay?orderId=${orderId}&amount=${amount}&phone=${encodeURIComponent(phone)}`;

    return NextResponse.json({ 
      success: true, 
      paymentUrl,
      orderId
    });
  } catch (error: any) {
    console.error('Error creating SBP payment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}