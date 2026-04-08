import { NextRequest, NextResponse } from 'next/server';
import { db, safeQuery } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'your-secret-key';
const secret = new TextEncoder().encode(JWT_SECRET);

async function getUserId(request: NextRequest): Promise<string | null> {
  const session = await auth();
  if (session?.user?.id) return session.user.id;
  
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const { payload } = await jwtVerify(token, secret);
      return payload.userId as string;
    } catch {}
  }
  return null;
}

function getDeviceInfo(userAgent: string) {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Unknown Browser';
}

// GET - получить активные сессии и историю входов
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  
  if (!userId) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }

  try {
    const sessions = await safeQuery(() =>
      db.execute(sql`
        SELECT id, device, location, ip_address, last_active, is_current
        FROM user_sessions
        WHERE user_id = ${userId}
        ORDER BY last_active DESC
      `)
    );

    const loginHistory = await safeQuery(() =>
      db.execute(sql`
        SELECT id, device, location, ip_address, success, created_at
        FROM login_history
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT 20
      `)
    );

    return NextResponse.json({
      sessions: sessions?.rows || [],
      loginHistory: loginHistory?.rows || [],
    });
  } catch (error) {
    console.error('Sessions fetch error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// POST - создать новую сессию (при входе)
export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  
  if (!userId) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }

  try {
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const device = getDeviceInfo(userAgent);
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown';

    // Помечаем все предыдущие сессии как не текущие
    await safeQuery(() =>
      db.execute(sql`
        UPDATE user_sessions
        SET is_current = false
        WHERE user_id = ${userId}
      `)
    );

    // Создаем новую сессию
    await safeQuery(() =>
      db.execute(sql`
        INSERT INTO user_sessions (id, user_id, device, location, ip_address, user_agent, is_current)
        VALUES (gen_random_uuid(), ${userId}, ${device}, ${'Москва, Россия'}, ${ip}, ${userAgent}, true)
      `)
    );

    // Добавляем в историю входов
    await safeQuery(() =>
      db.execute(sql`
        INSERT INTO login_history (id, user_id, device, location, ip_address, user_agent, success)
        VALUES (gen_random_uuid(), ${userId}, ${device}, ${'Москва, Россия'}, ${ip}, ${userAgent}, true)
      `)
    );

    return NextResponse.json({ message: 'Сессия создана' });
  } catch (error) {
    console.error('Session create error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// DELETE - завершить сессию
export async function DELETE(request: NextRequest) {
  const userId = await getUserId(request);
  
  if (!userId) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');
    const terminateAll = searchParams.get('all') === 'true';

    if (terminateAll) {
      // Завершаем все сессии кроме текущей
      await safeQuery(() =>
        db.execute(sql`
          DELETE FROM user_sessions
          WHERE user_id = ${userId} AND is_current = false
        `)
      );
      return NextResponse.json({ message: 'Все сессии завершены' });
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'ID сессии не указан' }, { status: 400 });
    }

    await safeQuery(() =>
      db.execute(sql`
        DELETE FROM user_sessions
        WHERE id = ${sessionId} AND user_id = ${userId}
      `)
    );

    return NextResponse.json({ message: 'Сессия завершена' });
  } catch (error) {
    console.error('Session delete error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
