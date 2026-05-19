import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { jsonWithNoCache } from '@/lib/no-cache';
import { parseUserAgent } from '@/lib/user-agent';

// Force dynamic rendering - never cache
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/profile/sessions - Получить информацию о текущей сессии пользователя
 * Примечание: Supabase Auth не предоставляет список всех сессий пользователя
 */
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Получаем информацию о текущем запросе
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               request.headers.get('x-real-ip') || 'Unknown';

    // Создаем mock-сессию для текущего пользователя
    // Так как Supabase не предоставляет список сессий, показываем только текущую
    const session = {
      id: `current_${user.id}_${Date.now()}`,
      userId: user.id,
      token: '', // Не доступен на клиенте
      device: parseUserAgent(userAgent).device,
      location: 'Россия', // Можно добавить геолокацию по IP
      ip,
      userAgent,
      lastActive: new Date(),
      createdAt: new Date(),
      isCurrent: true,
      parsedUA: parseUserAgent(userAgent),
      lastActiveRelative: 'только что',
    };

    return jsonWithNoCache({ sessions: [session] });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

/**
 * DELETE /api/profile/sessions - Завершить сессии
 * Для завершения всех других сессий предлагаем сменить пароль
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');
    const terminateAll = searchParams.get('all') === 'true';

    if (terminateAll) {
      // Для завершения всех других сессий нужно сменить пароль
      // Это инвалидирует все старые токены
      return NextResponse.json({ 
        success: false,
        message: 'Для завершения всех сессий пожалуйста смените пароль в настройках профиля' 
      }, { status: 400 });
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Удаление конкретной сессии невозможно без доступа к auth.sessions
    // Supabase Admin API требует и userId и sessionId, но мы не можем получить список сессий
    return NextResponse.json({ 
      error: 'Невозможно завершить отдельную сессию. Используйте функцию "Завершить все другие сессии" в настройках безопасности.' 
    }, { status: 400 });

  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
