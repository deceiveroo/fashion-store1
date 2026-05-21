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
export async function awardXP(userId: string, amount: number, reason: string, metadata?: Record<string, unknown>) {
  try {
    // Add XP to history
    await db.execute(sql`
      INSERT INTO xp_history (user_id, amount, reason, metadata)
      VALUES (${userId}, ${amount}, ${reason}, ${metadata ? JSON.stringify(metadata) : null}::jsonb)
    `);

    // Update user level
    const result = await db.execute(sql`
      UPDATE user_levels
      SET xp = xp + ${amount},
          updated_at = NOW()
      WHERE user_id = ${userId}
      RETURNING xp, xp_to_next_level, level, coins
    `);

    let levelUpData = null;

    if (result.rows && result.rows.length > 0) {
      const userLevel = result.rows[0] as any;
      
      // Check if level up
      if (userLevel.xp >= userLevel.xp_to_next_level) {
        levelUpData = await levelUp(userId, userLevel.level);
      }
    }

    return { 
      success: true, 
      amount,
      levelUp: levelUpData // Return level up info if it happened
    };
  } catch (error) {
    console.error('Error awarding XP:', error);
    return { success: false, error };
  }
}

// Level up user
async function levelUp(userId: string, currentLevel: number) {
  const newLevel = currentLevel + 1;
  const newXpRequired = Math.floor(100 * Math.pow(newLevel, 1.5));
  const coinsAwarded = newLevel * 10;
  
  // Get new title
  const titleResult = await db.execute(sql`
    SELECT get_title_by_level(${newLevel}) as title
  `);
  
  const newTitle = titleResult.rows?.[0]?.title || 'Новичок';
  
  // Update level and award coins
  await db.execute(sql`
    UPDATE user_levels
    SET level = ${newLevel},
        xp = 0,
        xp_to_next_level = ${newXpRequired},
        title = ${newTitle},
        coins = coins + ${coinsAwarded},
        updated_at = NOW()
    WHERE user_id = ${userId}
  `);

  // Create notification for level up
  try {
    await db.execute(sql`
      INSERT INTO system_notifications (title, message, type, target_audience, is_active, created_at)
      VALUES (
        '🎉 Уровень ${newLevel} достигнут!',
        'Поздравляем! Вы получили новый уровень и ${coinsAwarded} монет',
        'success',
        'registered',
        true,
        NOW()
      )
    `);
    console.log('Notification created for level up');
  } catch (error) {
    console.error('Error creating level up notification:', error);
  }

  let couponReward = null;
  
  // Check if there's a level reward coupon
  try {
    const rewardResult = await db.execute(sql`
      SELECT * FROM level_rewards WHERE level = ${newLevel}
    `);
    
    if (rewardResult.rows && rewardResult.rows.length > 0) {
      const reward = rewardResult.rows[0] as any;
      
      // Generate unique random coupon code for this user
      const generateRandomCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const length = Math.floor(Math.random() * 3) + 8; // 8-10 characters
        let code = '';
        for (let i = 0; i < length; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      };
      
      // Ensure code is unique
      let uniqueCode = generateRandomCode();
      let attempts = 0;
      while (attempts < 10) {
        const existing = await db.execute(sql`
          SELECT id FROM coupons WHERE code = ${uniqueCode}
        `);
        if (!existing.rows || existing.rows.length === 0) break;
        uniqueCode = generateRandomCode();
        attempts++;
      }
      
      // Create the coupon in the coupons table
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (reward.expires_days || 30));
      
      await db.execute(sql`
        INSERT INTO coupons (code, discount, type, min_order, max_uses, used_count, active, expires_at, created_by)
        VALUES (
          ${uniqueCode},
          ${reward.discount},
          ${reward.discount_type},
          ${reward.min_order},
          ${reward.max_uses},
          0,
          true,
          ${expiresAt},
          ${userId}
        )
        RETURNING code
      `);
      
      console.log(`Level ${newLevel} reward coupon created: ${uniqueCode}`);
      
      couponReward = {
        code: uniqueCode,
        discount: reward.discount,
        discountType: reward.discount_type,
      };
      
      // Create notification in system_notifications table
      try {
        await db.execute(sql`
          INSERT INTO system_notifications (title, message, type, target_audience, is_active, created_at, expires_at)
          VALUES (
            '🎁 Промокод за уровень ${newLevel}',
            'Вам вручен промокод ${uniqueCode} на скидку ${reward.discount}${reward.discount_type === 'percent' ? '%' : '₽'}',
            'success',
            'registered',
            true,
            NOW(),
            NOW() + INTERVAL '${reward.expires_days || 30} days'
          )
        `);
        console.log('Notification created for coupon reward');
      } catch (error) {
        console.error('Error creating notification:', error);
      }
    }
  } catch (error) {
    console.error('Error creating level reward coupon:', error);
    // Don't fail level up if coupon creation fails
  }
  
  // Check level achievements
  await checkAchievements(userId, 'level_up', newLevel);
  
  return { 
    newLevel, 
    newTitle, 
    coinsAwarded,
    couponReward // Return coupon info if awarded
  };
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
      WHERE user_id = ${userId} AND achievement_id = ${achievement.id}::uuid
    `);

    if (checkResult.rows && checkResult.rows.length > 0) {
      return { success: false, error: 'Already unlocked' };
    }

    // Unlock achievement
    await db.execute(sql`
      INSERT INTO user_achievements (user_id, achievement_id, unlocked_at, seen)
      VALUES (${userId}, ${achievement.id}::uuid, NOW(), false)
    `);

    // Award XP and coins
    await awardXP(userId, achievement.xp_reward, `Достижение: ${achievement.name}`, {
      achievement: achievementCode
    });

    await db.execute(sql`
      UPDATE user_levels
      SET coins = coins + ${achievement.coins_reward}
      WHERE user_id = ${userId}
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
          WHERE user_id = ${userId} AND status != 'cancelled'
        `);
        
        if (purchaseResult.rows && purchaseResult.rows.length > 0) {
          const { count, total_spent } = purchaseResult.rows[0] as any;
          const purchaseCount = parseInt(count || 0);
          const totalSpent = parseFloat(total_spent || 0);
          
          if (purchaseCount >= 1) achievements.push('first_purchase');
          if (purchaseCount >= 2) achievements.push('second_chance');
          if (purchaseCount >= 5) achievements.push('regular_customer');
          if (purchaseCount >= 10) achievements.push('fashionista');
          if (purchaseCount >= 25) achievements.push('loyal_shopper');
          if (purchaseCount >= 50) achievements.push('shopaholic');
          if (totalSpent >= 100000) achievements.push('vip_member');
          if (totalSpent >= 500000) achievements.push('whale');
          
          // Check single purchase amount if value provided
          if (value && value >= 10000) achievements.push('big_spender');
        }
        break;

      case 'favorite':
        // Check favorites count
        const favResult = await db.execute(sql`
          SELECT COUNT(*) as count
          FROM wishlist
          WHERE user_id = ${userId}
        `);
        
        if (favResult.rows && favResult.rows.length > 0) {
          const count = parseInt((favResult.rows[0] as any).count || 0);
          if (count >= 1) achievements.push('first_favorite');
          if (count >= 10) achievements.push('collector');
          if (count >= 50) achievements.push('wishlist_master');
          if (count >= 100) achievements.push('wishlist_hoarder');
        }
        break;

      case 'profile_complete':
        // Check profile completion
        const profileResult = await db.execute(sql`
          SELECT first_name, last_name, phone, address, avatar
          FROM user_profiles
          WHERE user_id = ${userId}
        `);
        
        if (profileResult.rows && profileResult.rows.length > 0) {
          const profile = profileResult.rows[0] as any;
          const hasName = profile.first_name && profile.last_name;
          const hasPhone = profile.phone;
          const hasAddress = profile.address;
          const hasAvatar = profile.avatar;
          
          if (hasName && hasPhone && hasAddress && hasAvatar) {
            achievements.push('profile_complete');
          }
          if (hasAvatar) achievements.push('avatar_setter');
          if (hasPhone) achievements.push('phone_verified');
          if (hasAddress) achievements.push('address_setter');
        }
        break;

      case 'coupon_used':
        // Check coupon usage
        const couponResult = await db.execute(sql`
          SELECT COUNT(DISTINCT coupon_id) as count
          FROM orders
          WHERE user_id = ${userId} AND coupon_id IS NOT NULL
        `);
        
        if (couponResult.rows && couponResult.rows.length > 0) {
          const count = parseInt((couponResult.rows[0] as any).count || 0);
          if (count >= 1) achievements.push('coupon_hunter');
          if (count >= 5) achievements.push('smart_shopper');
          if (count >= 20) achievements.push('discount_master');
        }
        
        // Check total savings
        const savingsResult = await db.execute(sql`
          SELECT COALESCE(SUM(discount), 0) as total_saved
          FROM orders
          WHERE user_id = ${userId}
        `);
        
        if (savingsResult.rows && savingsResult.rows.length > 0) {
          const totalSaved = parseFloat((savingsResult.rows[0] as any).total_saved || 0);
          if (totalSaved >= 5000) achievements.push('saver');
          if (totalSaved >= 20000) achievements.push('super_saver');
        }
        break;

      case 'receipt_download':
        // Track receipt downloads (would need a receipts table)
        // For now, skip this check
        break;

      case 'support_chat':
        // User contacted support
        achievements.push('support_user');
        break;

      case 'order_check':
        // Track order checks (would need tracking table)
        // For now, skip this check
        break;

      case 'product_view':
        // Track product views (would need analytics table)
        // For now, skip this check
        break;

      case 'login':
        // Check login time achievements
        const now = new Date();
        const hour = now.getHours();
        const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
        
        if (hour === 6) achievements.push('early_bird');
        if (hour === 2) achievements.push('night_owl');
        if (dayOfWeek === 0 || dayOfWeek === 6) achievements.push('weekend_warrior');
        
        // Check special months
        const month = now.getMonth() + 1; // 1-12
        if (month === 12) achievements.push('new_year_shopper');
        if (month >= 6 && month <= 8) achievements.push('summer_sale');
        break;

      case 'level_up':
        // Check level milestones
        if (value) {
          if (value >= 5) achievements.push('level_5');
          if (value >= 10) achievements.push('level_10');
          if (value >= 25) achievements.push('level_25');
        }
        break;

      case 'achievement_unlocked':
        // Check achievement count milestones
        const achievementCountResult = await db.execute(sql`
          SELECT COUNT(*) as count
          FROM user_achievements
          WHERE user_id = ${userId}
        `);
        
        if (achievementCountResult.rows && achievementCountResult.rows.length > 0) {
          const count = parseInt((achievementCountResult.rows[0] as any).count || 0);
          if (count >= 10) achievements.push('achievement_hunter');
          if (count >= 50) achievements.push('completionist');
        }
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
        (SELECT COUNT(*) FROM user_achievements WHERE user_id = ${userId}) as achievements_unlocked,
        (SELECT COUNT(*) FROM achievements) as total_achievements
      FROM user_levels ul
      WHERE ul.user_id = ${userId}
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
