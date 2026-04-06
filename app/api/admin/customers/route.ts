import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { users, userProfiles } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
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
        error.message?.includes('connection failure') ||
        error.code === 'ECONNRESET' ||
        error.code === 'ENOTFOUND';
      
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
      console.error('Customer API: No session found');
      return new Response(
        JSON.stringify({ error: 'Не авторизован. Требуется вход в систему.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!(await isStaff())) {
      console.error('Customer API: Not authorized as staff', session.user?.role);
      return new Response(
        JSON.stringify({ error: 'Доступ запрещен.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Получаем параметры пагинации
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Максимум 100
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log(`Fetching customers with limit: ${limit}, offset: ${offset}`);

    // Получаем пользователей с профилями, только с ролью 'user' (клиенты)
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
        .where(eq(users.role, 'user')) // Только пользователи с ролью 'user' (клиенты)
        .orderBy(users.createdAt)
        .limit(limit)
        .offset(offset)
    );

    console.log(`Found ${usersWithProfiles.length} customers`);

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

    return new Response(JSON.stringify({
      users: filteredUsers,
      count: filteredUsers.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Ошибка получения списка клиентов:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Ошибка сервера при получении списка клиентов',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}