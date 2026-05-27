import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { giftCards } from '@/lib/schema';
import { safeQuery } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { sendEmail, renderGiftCardEmail } from '@/lib/email';

// POST /api/gift-cards - Create a new gift card
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, purchaserEmail, recipientEmail, recipientName, message } = body;

    // Validation
    if (!amount || !purchaserEmail || !recipientEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (amount < 100) {
      return NextResponse.json(
        { error: 'Minimum amount is 100 ₽' },
        { status: 400 }
      );
    }

    if (amount > 100000) {
      return NextResponse.json(
        { error: 'Maximum amount is 100,000 ₽' },
        { status: 400 }
      );
    }

    // Generate unique gift card code
    const generateCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 16; i++) {
        if (i > 0 && i % 4 === 0) {
          code += '-';
        }
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    let code = generateCode();
    let isUnique = false;
    let attempts = 0;

    // Ensure code uniqueness
    while (!isUnique && attempts < 10) {
      const existing = await safeQuery(() =>
        db.select().from(giftCards).where(eq(giftCards.code, code)).limit(1)
      );
      
      if (!existing || existing.length === 0) {
        isUnique = true;
      } else {
        code = generateCode();
        attempts++;
      }
    }

    if (!isUnique) {
      return NextResponse.json(
        { error: 'Failed to generate unique code' },
        { status: 500 }
      );
    }

    // Set expiration date (1 year from now)
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    // Create gift card
    const [giftCard] = await safeQuery(() =>
      db.insert(giftCards).values({
        code,
        amount: String(amount),
        balance: String(amount),
        purchaserEmail,
        recipientEmail,
        recipientName: recipientName || null,
        message: message || null,
        status: 'sent',
        expiresAt,
      }).returning()
    ) || [];

    // Send email to recipient (Resend in prod, dev log fallback if not configured).
    try {
      const { html, text } = renderGiftCardEmail({
        recipientName: recipientName || null,
        code,
        amount: `${Number(amount).toLocaleString('ru-RU')} ₽`,
        message: message || null,
      });
      await sendEmail({
        to: recipientEmail,
        subject: 'Вам подарили подарочную карту',
        html,
        text,
        tags: [{ name: 'category', value: 'gift-card' }],
      });
    } catch (emailError) {
      console.error('[gift-cards] sendEmail failed:', emailError);
      // Email failure should not block card creation — purchaser can resend manually.
    }

    return NextResponse.json({
      success: true,
      giftCard: {
        id: giftCard.id,
        code,
        amount,
        recipientEmail,
        recipientName,
        message,
        expiresAt,
      },
      // Show code to purchaser for immediate sharing
      displayCode: code,
    });
  } catch (error) {
    console.error('Error creating gift card:', error);
    return NextResponse.json(
      { error: 'Failed to create gift card' },
      { status: 500 }
    );
  }
}
