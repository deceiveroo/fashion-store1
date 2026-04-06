import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { users, userProfiles } from '@/lib/schema';
import { eq, inArray } from 'drizzle-orm';
import { getSession, isStaff, isAdmin } from '@/lib/server-auth';

// Helper function with retry logic for Supabase pooler
async function queryWithRetry<T>(queryFn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await queryFn();
    } catch (error: any) {
      lastError = error;
      const isConnectionError = 
        error.message?.includes('Connection terminated') ||
        error.message?.includes('ECONNRESET') ||
        error.message?.includes('Pool is draining and cannot accept new connections') ||
        error.code === 'ECONNRESET';
      
      if (isConnectionError && i < maxRetries - 1) {
        console.warn(`Query failed (attempt ${i + 1}), retrying...`, error.message);
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
        continue;
      }
      throw error;
    }
  }
  
  throw lastError;
}

export async function GET(request: NextRequest) {
  try {
    // Проверяем сессию пользователя
    const session = await getSession();
    
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Не авторизован. Требуется вход в систему.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!(await isStaff())) {
      return new Response(
        JSON.stringify({ error: 'Доступ запрещен.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Получаем параметры пагинации
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50'); // Ограничиваем до 50 пользователей
    const offset = parseInt(searchParams.get('offset') || '0');

    // Получаем пользователей с профилями, только с ролями 'admin', 'manager', 'support' (команда)
    const usersWithProfiles = await queryWithRetry(() =>
      db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          firstName: userProfiles.firstName,
          lastName: userProfiles.lastName,
          phone: userProfiles.phone,
          role: users.role,
          image: users.image,
          status: users.status,
          createdAt: users.createdAt,
          emailVerified: users.emailVerified,
          avatar: userProfiles.avatar,
        })
        .from(users)
        .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
        .where(inArray(users.role, ['admin', 'manager', 'support'])) // Только пользователи с ролями команды
        .orderBy(users.createdAt)
        .limit(Math.min(limit, 100)) // Максимум 100
        .offset(offset)
    );

    // Возвращаем пользователей без чувствительных данных
    const filteredUsers = usersWithProfiles.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role || 'user',
      image: user.image,
      status: user.status,
      createdAt: user.createdAt,
      emailVerified: user.emailVerified,
      avatar: user.avatar,
    }));

    return new Response(JSON.stringify(filteredUsers), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Ошибка получения списка команды:', error);
    return new Response(
      JSON.stringify({ error: 'Ошибка сервера при получении списка команды' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}