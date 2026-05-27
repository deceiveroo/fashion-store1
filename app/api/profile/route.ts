import { NextRequest, NextResponse } from 'next/server';
import { db, safeQuery } from '@/lib/db';
import { userProfiles, users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { jsonWithNoCache } from '@/lib/no-cache';
import { checkAchievements, awardXP } from '@/lib/gamification';
import { getJwtSecret } from '@/lib/jwt-secret';

// Force dynamic rendering - never cache
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const secret = getJwtSecret();

async function getUserId(request: NextRequest): Promise<string | null> {
  let userId: string | null = null;

  // Try NextAuth session (cookies)
  const session = await auth();
  if (session?.user?.id) {
    userId = session.user.id;
    console.log('[PROFILE AUTH] Got user ID from NextAuth session:', userId);
  } else {
    console.log('[PROFILE AUTH] No NextAuth session found');
    // Try Bearer token
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const { payload } = await jwtVerify(token, secret);
        userId = payload.userId as string;
        console.log('[PROFILE AUTH] Got user ID from bearer token:', userId);
      } catch (error) {
        console.error('[PROFILE AUTH] Invalid bearer token:', error);
      }
    } else {
      console.log('[PROFILE AUTH] No authorization header');
    }
  }

  return userId;
}

// GET - получить профиль
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  
  if (!userId) {
    console.log('[PROFILE GET] No user ID found');
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }

  console.log('[PROFILE GET] Fetching profile for user:', userId);

  try {
    const userData = await safeQuery(() => db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        image: users.image,
        firstName: userProfiles.firstName,
        lastName: userProfiles.lastName,
        phone: userProfiles.phone,
        address: userProfiles.address,
        avatar: userProfiles.avatar,
      })
      .from(users)
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .where(eq(users.id, userId))
      .limit(1));

    if (!userData || userData.length === 0) {
      console.log('[PROFILE GET] User not found in database:', userId);
      return NextResponse.json({ message: 'Пользователь не найден' }, { status: 404 });
    }

    const user = userData[0];
    console.log('[PROFILE GET] Returning profile for:', user.email);
    
    const nameParts = user.name?.split(' ') || ['', ''];

    // Use avatar from userProfiles if available, otherwise fall back to users.image
    const avatarUrl = user.avatar || user.image;
    
    return jsonWithNoCache({
      id: user.id,
      email: user.email,
      name: user.name,
      firstName: user.firstName || nameParts[0],
      lastName: user.lastName || nameParts[1] || '',
      phone: user.phone || '',
      address: user.address || '',
      avatar: avatarUrl,
      image: avatarUrl, // Return both for compatibility
    });
  } catch (error) {
    console.error('[PROFILE GET] Error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// POST - обновить профиль или сменить пароль
export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  
  if (!userId) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Проверяем это смена пароля или обновление профиля
    if (body.currentPassword && body.newPassword) {
      // Смена пароля
      const userData = await db
        .select({ password: users.password })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (userData.length === 0 || !userData[0].password) {
        return NextResponse.json(
          { message: 'Пользователь не найден' },
          { status: 404 }
        );
      }

      const isValid = await bcrypt.compare(body.currentPassword, userData[0].password);
      if (!isValid) {
        return NextResponse.json(
          { message: 'Неверный текущий пароль' },
          { status: 401 }
        );
      }

      const hashedPassword = await bcrypt.hash(body.newPassword, 12);
      await db
        .update(users)
        .set({ password: hashedPassword, updatedAt: new Date() })
        .where(eq(users.id, userId));

      return NextResponse.json({ message: 'Пароль успешно изменен' });
    } else {
      // Обновление профиля
      const { firstName, lastName, phone, address, avatar } = body;

      const existingProfile = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId))
        .limit(1);

      if (existingProfile.length > 0) {
        await safeQuery(() => db
          .update(userProfiles)
          .set({
            firstName: firstName || existingProfile[0].firstName,
            lastName: lastName || existingProfile[0].lastName,
            phone: phone !== undefined ? phone : existingProfile[0].phone,
            address: address !== undefined ? address : existingProfile[0].address,
            avatar: avatar !== undefined ? avatar : existingProfile[0].avatar,
            updatedAt: new Date(),
          })
          .where(eq(userProfiles.userId, userId)));
      } else {
        await safeQuery(() => db.insert(userProfiles).values({
          id: crypto.randomUUID(),
          userId,
          firstName,
          lastName,
          phone,
          address,
          avatar,
        }));
      }

      const avatarUrl = avatar !== undefined ? avatar : existingProfile[0]?.avatar;
      if (avatarUrl) {
        await safeQuery(() => db
          .update(users)
          .set({ image: avatarUrl, updatedAt: new Date() })
          .where(eq(users.id, userId)));
      }

      return NextResponse.json({ message: 'Профиль успешно обновлен' });
    }
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// POST - обновить профиль с проверкой достижений
export async function PUT(request: NextRequest) {
  const userId = await getUserId(request);
  
  if (!userId) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { firstName, lastName, phone, address, avatar } = body;

    // Проверяем, заполнен ли профиль полностью
    const isProfileComplete = firstName && lastName && phone && address;

    const existingProfile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    if (existingProfile.length > 0) {
      await safeQuery(() => db
        .update(userProfiles)
        .set({
          firstName: firstName || existingProfile[0].firstName,
          lastName: lastName || existingProfile[0].lastName,
          phone: phone !== undefined ? phone : existingProfile[0].phone,
          address: address !== undefined ? address : existingProfile[0].address,
          avatar: avatar !== undefined ? avatar : existingProfile[0].avatar,
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.userId, userId)));
    } else {
      await safeQuery(() => db.insert(userProfiles).values({
        id: crypto.randomUUID(),
        userId,
        firstName,
        lastName,
        phone,
        address,
        avatar,
      }));
    }

    const avatarUrl = avatar !== undefined ? avatar : existingProfile[0]?.avatar;
    if (avatarUrl) {
      await safeQuery(() => db
        .update(users)
        .set({ image: avatarUrl, updatedAt: new Date() })
        .where(eq(users.id, userId)));
    }

    // Gamification: Check if profile is complete and award achievement
    if (isProfileComplete) {
      try {
        await awardXP(userId, 30, 'Profile completed', { firstName, lastName });
        await checkAchievements(userId, 'profile_complete');
      } catch (gamificationError) {
        console.error('Gamification error:', gamificationError);
      }
    }

    return NextResponse.json({ message: 'Профиль успешно обновлен' });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
