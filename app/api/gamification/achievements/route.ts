import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Получаем userId из сессии или используем demo
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    // Для демо используем фиксированный UUID
    const userId = sessionCookie?.value || '00000000-0000-0000-0000-000000000000';

    // Получаем все достижения с информацией о разблокировке
    const result = await db.execute(sql`
      SELECT 
        a.id,
        a.code,
        a.name,
        a.description,
        a.icon,
        a.category,
        a.xp_reward,
        a.coins_reward,
        a.rarity,
        a.requirement,
        ua.unlocked_at,
        ua.seen,
        CASE WHEN ua.id IS NOT NULL THEN true ELSE false END as unlocked
      FROM achievements a
      LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ${userId}::uuid
      ORDER BY 
        CASE a.rarity
          WHEN 'legendary' THEN 1
          WHEN 'epic' THEN 2
          WHEN 'rare' THEN 3
          ELSE 4
        END,
        a.created_at
    `);

    // Возвращаем массив
    return NextResponse.json(result.rows || []);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json([], { status: 200 }); // Возвращаем пустой массив при ошибке
  }
}
