import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders } from '@/lib/schema';
import { eq } from 'drizzle-orm';

// Mock addresses for demonstration purposes
// In a real implementation, you would integrate with a cryptocurrency payment service
const MOCK_ADDRESSES: Record<string, string> = {
  LTC: 'Lfa6c3a7b8c9d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8',
  'USDT TRC-20': 'TQwBf6c3a7b8c9d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8',
  TON: 'EQBf6c3a7b8c9d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0',
  NOT: '0xAbCdEf1234567890aBcDeF1234567890aBcDeF123',
};

export async function POST(request: NextRequest) {
  try {
    const { orderId, cryptoCurrency, amount } = await request.json();

    if (!orderId || !cryptoCurrency || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify the order exists
    const order = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (order.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // In a real implementation, you would calculate the crypto amount based on the exchange rate
    // For this demo, we'll just return a mock address
    const cryptoAddress = MOCK_ADDRESSES[cryptoCurrency.toUpperCase() as keyof typeof MOCK_ADDRESSES];
    
    if (!cryptoAddress) {
      return NextResponse.json({ error: 'Unsupported cryptocurrency' }, { status: 400 });
    }

    // Update the order with crypto payment details
    await db
      .update(orders)
      .set({
        cryptoCurrency,
        cryptoAddress,
        paymentStatus: 'pending', // Set to pending until payment is confirmed
      })
      .where(eq(orders.id, orderId));

    // Here you would typically store the payment details in the database
    // and possibly track the payment status via blockchain monitoring

    return NextResponse.json({ 
      success: true, 
      address: cryptoAddress,
      orderId,
      cryptoCurrency,
      amount,
      // In a real implementation, you would calculate the amount in crypto
      cryptoAmount: calculateCryptoAmount(amount, cryptoCurrency.toLowerCase()),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes from now
    });
  } catch (error: any) {
    console.error('Error creating crypto payment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper function to calculate crypto amount based on exchange rates
function calculateCryptoAmount(fiatAmount: number, cryptoCurrency: string): number {
  // Mock exchange rates - in a real implementation you would fetch from an exchange
  const exchangeRates: Record<string, number> = {
    ltc: 0.0025, // 1 RUB = 0.0025 LTC (example rate)
    'usdt trc-20': 0.011, // 1 RUB = 0.011 USDT
    ton: 0.0003, // 1 RUB = 0.0003 TON
    not: 0.00005 // 1 RUB = 0.00005 NOT
  };

  const rate = exchangeRates[cryptoCurrency] || 1; // Default to 1:1 if rate not found
  return parseFloat((fiatAmount * rate).toFixed(8)); // Crypto amounts usually have up to 8 decimals
}