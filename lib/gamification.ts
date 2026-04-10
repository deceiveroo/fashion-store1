// Gamification System - XP and Achievement Management
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export interface AchievementProgress {
  code: string;
  currentValue: number;
  requiredValue: number;
  unlocked: boolean;
}

// Award XP to user
export async function awardXP(userId: string, amount: number, reason: string, metadata?: any) {
  try {
    // Add XP to history
    await db.execute(sql`
      INSERT INTO xp_history (user_id, amount, reason, metadata)
      VALUES (${userId}::uuid, ${amount}, ${reason}, ${metadata ? JSON.stringify(metadata) : null}::jsonb)
    `);

    // Update user level
    const result = await db.execute(sql`
      UPDATE user_levels
      SET xp = xp + ${amount},
          updated_at = NOW()
      WHERE user_id = ${userId}::uuid
      RETURNING xp, xp_to_next_level, level
    `);

    if (result.rows && result.rows.length > 0) {
      const userLevel = result.rows[0] as any;
      
      // Check if level up
      if (userLevel.xp >= userLevel.xp_to_next_level) {
        await levelUp(userId, userLevel.level);
      }
    }

    return { success: true, amount };
  } catch (error) {
    console.error('Error awarding XP:', error);
    return { success: false, error };
  }
}

// Level up user
async function levelUp(userId: string, currentLevel: number) {
  const newLevel = currentLevel + 1;
  const newXpRequired = Math.floor(100 * Math.pow(newLevel, 1.5));
  
  // Get new title
  const titleResult = await db.execute(sql`
    SELECT get_title_by_level(${newLevel}) as title
  `);
  
  const newTitle = titleResult.rows?.[0]?.title || 'Новичок';
  
  // Update level
  await db.execute(sql`
    UPDATE user_levels
    SET level = ${newLevel},
        xp = 0,
        xp_to_next_level = ${newXpRequired},
        title = ${newTitle},
        coins = coins + ${newLevel * 10},
        updated_at = NOW()
    WHERE user_id = ${userId}::uuid
  `);

  // Award bonus coins for leveling up
  await awardXP(userId, 0, `Достигнут уровень ${newLevel}`, { level: newLevel });
  
  return { newLevel, newTitle, coinsAwarded: newLevel * 10 };
}

// Unlock achievement
export async function unlockAchievement(userId: string, achievementCode: string) {
  try {
    // Get achievement details
    const achievementResult = await db.execute(sql`
      SELECT id, xp_reward, coins_reward, name
      FROM achievements
      WHERE code = ${achievementCode}
    `);

    if (!achievementResult.rows || achievementResult.rows.length === 0) {
      return { success: false, error: 'Achievement not found' };
    }

    const achievement = achievementResult.rows[0] as any;

    // Check if already unlocked
    const checkResult = await db.execute(sql`
      SELECT id FROM user_achievements
      WHERE user_id = ${userId}::uuid AND achievement_id = ${achievement.id}::uuid
    `);

    if (checkResult.rows && checkResult.rows.length > 0) {
      return { success: false, error: 'Already unlocked' };
    }

    // Unlock achievement
    await db.execute(sql`
      INSERT INTO user_achievements (user_id, achievement_id, unlocked_at, seen)
      VALUES (${userId}::uuid, ${achievement.id}::uuid, NOW(), false)
    `);

    // Award XP and coins
    await awardXP(userId, achievement.xp_reward, `Достижение: ${achievement.name}`, {
      achievement: achievementCode
    });

    await db.execute(sql`
      UPDATE user_levels
      SET coins = coins + ${achievement.coins_reward}
      WHERE user_id = ${userId}::uuid
    `);

    return {
      success: true,
      achievement: {
        name: achievement.name,
        xp: achievement.xp_reward,
        coins: achievement.coins_reward
      }
    };
  } catch (error) {
    console.error('Error unlocking achievement:', error);
    return { success: false, error };
  }
}

// Check and unlock achievements based on user actions
export async function checkAchievements(userId: string, action: string, value?: number) {
  const achievements: string[] = [];

  try {
    switch (action) {
      case 'purchase':
        // Check purchase count achievements
        const purchaseResult = await db.execute(sql`
          SELECT COUNT(*) as count, SUM(total) as total_spent
          FROM orders
          WHERE user_id = ${userId}::uuid AND status != 'cancelled'
        `);
        
        if (purchaseResult.rows && purchaseResult.rows.length > 0) {
          const { count, total_spent } = purchaseResult.rows[0] as any;
          
          if (count >= 1) achievements.push('first_purchase');
          if (count >= 10) achievements.push('fashionista');
          if (count >= 50) achievements.push('shopaholic');
          if (parseFloat(total_spent) >= 100000) achievements.push('vip_member');
        }
        break;

      case 'favorite':
        // Check favorites count
        const favResult = await db.execute(sql`
          SELECT COUNT(*) as count
          FROM favorites
          WHERE user_id = ${userId}::uuid
        `);
        
        if (favResult.rows && favResult.rows.length > 0) {
          const count = (favResult.rows[0] as any).count;
          if (count >= 10) achievements.push('collector');
        }
        break;

      case 'review':
        // Check reviews count
        const reviewResult = await db.execute(sql`
          SELECT COUNT(*) as count
          FROM reviews
          WHERE user_id = ${userId}::uuid
        `);
        
        if (reviewResult.rows && reviewResult.rows.length > 0) {
          const count = (reviewResult.rows[0] as any).count;
          if (count >= 5) achievements.push('reviewer');
        }
        break;

      case 'login':
        // Check login time achievements
        const hour = new Date().getHours();
        if (hour === 6) achievements.push('early_bird');
        if (hour === 2) achievements.push('night_owl');
        break;
    }

    // Unlock all eligible achievements
    const results = [];
    for (const code of achievements) {
      const result = await unlockAchievement(userId, code);
      if (result.success) {
        results.push(result);
      }
    }

    return { success: true, unlocked: results };
  } catch (error) {
    console.error('Error checking achievements:', error);
    return { success: false, error };
  }
}

// Get user's gamification stats
export async function getUserStats(userId: string) {
  try {
    const result = await db.execute(sql`
      SELECT 
        ul.level,
        ul.xp,
        ul.xp_to_next_level,
        ul.title,
        ul.coins,
        (SELECT COUNT(*) FROM user_achievements WHERE user_id = ${userId}::uuid) as achievements_unlocked,
        (SELECT COUNT(*) FROM achievements) as total_achievements
      FROM user_levels ul
      WHERE ul.user_id = ${userId}::uuid
    `);

    if (result.rows && result.rows.length > 0) {
      return { success: true, stats: result.rows[0] };
    }

    return { success: false, error: 'User not found' };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return { success: false, error };
  }
}
