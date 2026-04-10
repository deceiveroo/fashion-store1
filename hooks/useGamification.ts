'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface Achievement {
  name: string;
  description: string;
  icon: string;
  xp: number;
  coins: number;
  rarity: string;
}

export function useGamification() {
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);

  const awardXP = useCallback(async (amount: number, reason: string, metadata?: any) => {
    try {
      const response = await fetch('/api/gamification/award-xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, reason, metadata }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`+${amount} XP: ${reason}`);
        return data;
      }
    } catch (error) {
      console.error('Error awarding XP:', error);
    }
  }, []);

  const checkAchievements = useCallback(async (action: string, value?: number) => {
    try {
      const response = await fetch('/api/gamification/check-achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, value }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Show notifications for unlocked achievements
        if (data.unlocked && data.unlocked.length > 0) {
          data.unlocked.forEach((unlock: any) => {
            if (unlock.success && unlock.achievement) {
              setUnlockedAchievement({
                name: unlock.achievement.name,
                description: '',
                icon: '🏆',
                xp: unlock.achievement.xp,
                coins: unlock.achievement.coins,
                rarity: 'rare'
              });
              
              // Clear after showing
              setTimeout(() => setUnlockedAchievement(null), 6000);
            }
          });
        }
        
        return data;
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  }, []);

  const trackAction = useCallback(async (action: string, xpAmount: number = 10) => {
    // Award XP for the action
    await awardXP(xpAmount, action);
    
    // Check if any achievements were unlocked
    await checkAchievements(action);
  }, [awardXP, checkAchievements]);

  return {
    awardXP,
    checkAchievements,
    trackAction,
    unlockedAchievement,
    clearAchievement: () => setUnlockedAchievement(null),
  };
}
