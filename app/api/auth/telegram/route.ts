import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { createHash, createHmac } from 'crypto';
import jwt from 'jsonwebtoken';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'secret';

// Verify Telegram data hash
function verifyTelegramData(data: Record<string, string>): boolean {
  if (!BOT_TOKEN) return false;
  const { hash, ...rest } = data;
  const checkString = Object.keys(rest)
    .sort()
    .map(k => `${k}=${rest[k]}`)
    .join('\n');
  const secretKey = createHash('sha256').update(BOT_TOKEN).digest();
  const hmac = createHmac('sha256', secretKey).update(checkString).digest('hex');
  return hmac === hash;
}

export async function POST(request: NextRequest) {
  try {
    if (!BOT_TOKEN) {
      return NextResponse.json({ error: 'Telegram bot not configured' }, { status: 500 });
    }

    const telegramData = await request.json();

    // Verify authenticity
    if (!verifyTelegramData(telegramData)) {
      return NextResponse.json({ error: 'Invalid Telegram data' }, { status: 401 });
    }

    // Check data is not too old (5 min)
    const authDate = parseInt(telegramData.auth_date);
    if (Date.now() / 1000 - authDate > 300) {
      return NextResponse.json({ error: 'Telegram data expired' }, { status: 401 });
    }

    const telegramId = telegramData.id;
    const firstName = telegramData.first_name || '';
    const lastName = telegramData.last_name || '';
    const username = telegramData.username || '';
    const photoUrl = telegramData.photo_url || '';

    // Find existing user by telegram_id or create new
    // First check if user with this telegram_id exists (stored in image field as tg:id)
    const telegramEmail = `tg_${telegramId}@telegram.user`;

    let existingUser = await db.select()
      .from(users)
      .where(eq(users.email, telegramEmail))
      .limit(1);

    let userId: string;

    if (existingUser.length === 0) {
      // Create new user
      userId = crypto.randomUUID();
      const name = [firstName, lastName].filter(Boolean).join(' ') || username || `User${telegramId}`;
      
      await db.insert(users).values({
        id: userId,
        email: telegramEmail,
        name,
        image: photoUrl || null,
        password: crypto.randomUUID(), // Random password - login only via Telegram
        role: 'customer',
        status: 'active',
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
      userId = existingUser[0].id;
      // Update photo if changed
      if (photoUrl && existingUser[0].image !== photoUrl) {
        await db.update(users).set({ image: photoUrl, updatedAt: new Date() }).where(eq(users.id, userId));
      }
    }

    // Create JWT token
    const token = jwt.sign(
      { userId, email: telegramEmail, telegramId },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return NextResponse.json({ success: true, token, userId });
  } catch (error: any) {
    console.error('[TELEGRAM AUTH] Error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
