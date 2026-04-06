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

    // Получаем пользователей с профилями, только с ролями 'admin', 'manager', 'support'
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
        .where(inArray(users.role, ['admin', 'manager', 'support'])) // Только пользователи с ролями admin, manager, support
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
      role: user.role || 'customer',
      image: user.image,
      status: user.status,
      createdAt: user.createdAt,
      emailVerified: user.emailVerified,
      avatar: user.avatar,
    }));

    return new Response(JSON.stringify(filteredUsers), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Ошибка получения списка пользователей:', error);
    return new Response(
      JSON.stringify({ error: 'Ошибка сервера при получении списка пользователей' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Проверяем, является ли пользователь администратором
    const isAdminUser = await isAdmin();
    
    if (!isAdminUser) {
      return new Response(
        JSON.stringify({ error: 'Доступ запрещен. Требуются права администратора.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Получаем сессию пользователя
    const session = await getSession();
    
    const { userId, updates } = await request.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'ID пользователя обязателен' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Проверяем, что нельзя изменить собственный статус администратора
    if (session?.user?.id === userId && updates.role && updates.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Нельзя изменить свой собственный статус администратора' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Prepare user updates - sync image field with avatar
    const userUpdates: any = {
      ...updates,
      updatedAt: new Date(),
    };
    
    // If avatar is being updated, also update the image field for consistency
    if (updates.avatar) {
      userUpdates.image = updates.avatar;
    }
    
    // Обновляем пользователя
    await db.update(users).set(userUpdates).where(eq(users.id, userId));

    // Если есть обновления профиля, обновляем его тоже
    if (updates.firstName || updates.lastName || updates.phone || updates.avatar || updates.image) {
      const existingProfile = await queryWithRetry(() =>
        db
          .select({ id: userProfiles.id })
          .from(userProfiles)
          .where(eq(userProfiles.userId, userId))
          .limit(1)
      );

      // Sync avatar field - use avatar if provided, otherwise use image
      const avatarUrl = updates.avatar || updates.image;
      
      if (existingProfile.length > 0) {
        await queryWithRetry(() =>
          db
            .update(userProfiles)
            .set({
              firstName: updates.firstName,
              lastName: updates.lastName,
              phone: updates.phone,
              avatar: avatarUrl,
              updatedAt: new Date(),
            })
            .where(eq(userProfiles.userId, userId))
        );
      } else {
        await queryWithRetry(() =>
          db.insert(userProfiles).values({
            id: crypto.randomUUID(),
            userId,
            firstName: updates.firstName,
            lastName: updates.lastName,
            phone: updates.phone,
            avatar: avatarUrl,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        );
      }
    }

    return new Response(
      JSON.stringify({ message: 'Пользователь успешно обновлен' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Ошибка обновления пользователя:', error);
    return new Response(
      JSON.stringify({ error: 'Ошибка сервера при обновлении пользователя' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Проверяем сессию пользователя
    const session = await getSession();
    
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Не авторизован. Требуется вход в систему.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Проверяем, является ли пользователь администратором
    const isAdminUser = await isAdmin();
    
    if (!isAdminUser) {
      return new Response(
        JSON.stringify({ error: 'Доступ запрещен. Требуются права администратора.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'ID пользователя обязателен' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Нельзя удалить самого себя
    if (session?.user?.id === id) {
      return new Response(
        JSON.stringify({ error: 'Нельзя удалить собственную учетную запись' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Удаляем пользователя (каскадно удалит связанные данные)
    await queryWithRetry(() =>
      db.delete(users).where(eq(users.id, id))
    );

    return new Response(
      JSON.stringify({ message: 'Пользователь удален успешно' }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error deleting user:', error);
    return new Response(
      JSON.stringify({ error: 'Ошибка при удалении пользователя' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}