import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { paymentMethods } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const methods = await db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.userId, user.id));

    return NextResponse.json({ methods });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json({ error: 'Failed to fetch payment methods' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { cardNumber, holderName, expiryMonth, expiryYear, cvv, isDefault } = body;

    // Validate card data
    if (!cardNumber || !holderName || !expiryMonth || !expiryYear || !cvv) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get card brand from first digit
    const firstDigit = cardNumber[0];
    let brand = 'Unknown';
    if (firstDigit === '4') brand = 'Visa';
    else if (firstDigit === '5') brand = 'Mastercard';
    else if (firstDigit === '2') brand = 'Mir';

    // If this is default, unset other defaults
    if (isDefault) {
      await db
        .update(paymentMethods)
        .set({ isDefault: false })
        .where(eq(paymentMethods.userId, user.id));
    }

    // Store only last 4 digits
    const last4 = cardNumber.slice(-4);

    const [method] = await db
      .insert(paymentMethods)
      .values({
        userId: user.id,
        type: 'card',
        last4,
        brand,
        expiryMonth: parseInt(expiryMonth),
        expiryYear: parseInt(expiryYear),
        holderName,
        isDefault: isDefault || false,
      })
      .returning();

    return NextResponse.json({ method });
  } catch (error) {
    console.error('Error adding payment method:', error);
    return NextResponse.json({ error: 'Failed to add payment method' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const methodId = searchParams.get('id');

    if (!methodId) {
      return NextResponse.json({ error: 'Method ID required' }, { status: 400 });
    }

    await db
      .delete(paymentMethods)
      .where(
        and(
          eq(paymentMethods.id, methodId),
          eq(paymentMethods.userId, user.id)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    return NextResponse.json({ error: 'Failed to delete payment method' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { methodId, isDefault } = body;

    if (!methodId) {
      return NextResponse.json({ error: 'Method ID required' }, { status: 400 });
    }

    // Unset all defaults
    await db
      .update(paymentMethods)
      .set({ isDefault: false })
      .where(eq(paymentMethods.userId, user.id));

    // Set new default
    await db
      .update(paymentMethods)
      .set({ isDefault: true })
      .where(
        and(
          eq(paymentMethods.id, methodId),
          eq(paymentMethods.userId, user.id)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating payment method:', error);
    return NextResponse.json({ error: 'Failed to update payment method' }, { status: 500 });
  }
}
