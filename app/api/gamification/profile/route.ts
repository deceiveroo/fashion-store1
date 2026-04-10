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

    // Получаем уровень пользователя
    const result = await db.execute(sql`
      SELECT 
        id,
        user_id,
        level,
        xp,
        xp_to_next_level,
        title,
        coins,
        created_at,
        updated_at
      FROM user_levels 
      WHERE user_id = ${userId}::uuid
    `);

    if (!result.rows || result.rows.length === 0) {
      // Создаем уровень если не существует
      try {
        await db.execute(sql`
          INSERT INTO user_levels (user_id, level, xp, xp_to_next_level, title, coins)
          VALUES (${userId}::uuid, 1, 0, 100, 'Новичок', 0)
          ON CONFLICT (user_id) DO NOTHING
        `);

        const newResult = await db.execute(sql`
          SELECT 
            id,
            user_id,
            level,
            xp,
            xp_to_next_level,
            title,
            coins,
            created_at,
            updated_at
          FROM user_levels 
          WHERE user_id = ${userId}::uuid
        `);

        if (newResult.rows && newResult.rows.length > 0) {
          return NextResponse.json(newResult.rows[0]);
        }
      } catch (insertError) {
        console.error('Error creating user level:', insertError);
      }

      // Возвращаем дефолтные значения
      return NextResponse.json({
        level: 1,
        xp: 0,
        xp_to_next_level: 100,
        title: 'Новичок',
        coins: 0
      });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching gamification profile:', error);
    // Возвращаем дефолтные значения при ошибке
    return NextResponse.json({
      level: 1,
      xp: 0,
      xp_to_next_level: 100,
      title: 'Новичок',
      coins: 0
    });
  }
}
