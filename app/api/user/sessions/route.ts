import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { jsonWithNoCache } from '@/lib/no-cache';
import { parseUserAgent } from '@/lib/user-agent';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Force dynamic rendering - never cache
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/user/sessions - Получить сессии текущего пользователя
 * Возвращает информацию о текущей сессии (так как Supabase не предоставляет список всех сессий)
 */
export async function GET(request: NextRequest) {
  try {
    // Проверка авторизации
    const currentUser = await verifyAuth(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Получаем токен из cookies или headers
    const authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie');
    
    // Supabase Auth не предоставляет API для получения списка всех сессий пользователя
    // Поэтому возвращаем информацию о текущей сессии на основе данных входа
    
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               request.headers.get('x-real-ip') || 'Unknown';

    // Создаем mock-сессию для текущего пользователя
    const session = {
      id: `current_${currentUser.id}_${Date.now()}`,
      userId: currentUser.id,
      isCurrent: true,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      userAgent,
      ip,
      parsedUA: parseUserAgent(userAgent),
      lastActiveRelative: 'только что',
      device: parseUserAgent(userAgent).device,
    };

    return jsonWithNoCache({ sessions: [session] });
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

/**
 * DELETE /api/user/sessions - Завершить все другие сессии пользователя
 * Так как мы не можем получить список сессий, завершаем все кроме текущей
 * путем обновления пароля (это инвалидирует все старые сессии)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Проверка авторизации
    const currentUser = await verifyAuth(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const terminateAll = searchParams.get('all') === 'true';

    if (terminateAll) {
      // Для завершения всех других сессий нужно использовать другой подход
      // Так как Supabase не предоставляет список сессий, мы не можем удалить конкретные
      // Вместо этого можно предложить пользователю сменить пароль
      
      return NextResponse.json({ 
        success: false, 
        message: 'Для завершения всех сессий пожалуйста смените пароль в настройках профиля' 
      }, { status: 400 });
    }

    // Удаление конкретной сессии невозможно без sessionId
    // Supabase Admin API требует и userId и sessionId
    return NextResponse.json({ 
      error: 'Невозможно завершить отдельную сессию. Используйте функцию "Завершить все другие сессии" в настройках безопасности.' 
    }, { status: 400 });

  } catch (error) {
    console.error('Error deleting user session:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
