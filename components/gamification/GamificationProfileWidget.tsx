'use client';

import { useState, useEffect } from 'react';
import { Trophy, Star, Sparkles, TrendingUp, Award, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface UserLevel {
  level: number;
  xp: number;
  xp_to_next_level: number;
  title: string;
  coins: number;
}

interface Achievement {
  unlocked: boolean;
}

export default function GamificationProfileWidget() {
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [levelRes, achievementsRes] = await Promise.all([
        fetch('/api/gamification/profile'),
        fetch('/api/gamification/achievements')
      ]);
      
      const levelData = await levelRes.json();
      const achievementsData = await achievementsRes.json();
      
      setUserLevel(levelData);
      setAchievements(Array.isArray(achievementsData) ? achievementsData : []);
    } catch (error) {
      console.error('Error fetching gamification data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fc-glass-card relative overflow-hidden p-8">
        {/* Subtle accent glow */}
        <div
          className="pointer-events-none absolute top-0 right-0 w-72 h-72 rounded-full opacity-60"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.1), transparent 70%)' }}
        />

        <div className="relative z-10 space-y-6">
          {/* Header skeleton */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[var(--surface-hover)] rounded-2xl animate-pulse" />
              <div className="space-y-2">
                <div className="h-10 w-48 bg-[var(--surface-hover)] rounded-lg animate-pulse" />
                <div className="h-6 w-32 bg-[var(--surface-hover)] rounded-lg animate-pulse" />
              </div>
            </div>
            <div className="h-14 w-48 bg-[var(--surface-hover)] rounded-2xl animate-pulse" />
          </div>

          {/* XP bar skeleton */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <div className="h-5 w-16 bg-[var(--surface-hover)] rounded animate-pulse" />
              <div className="h-5 w-40 bg-[var(--surface-hover)] rounded animate-pulse" />
            </div>
            <div className="h-5 bg-[var(--surface-hover)] rounded-full animate-pulse" />
            <div className="h-4 w-48 ml-auto bg-[var(--surface-hover)] rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!userLevel) return null;

  const xpProgress = (userLevel.xp / userLevel.xp_to_next_level) * 100;
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  return (
    <div className="fc-glass-card relative overflow-hidden p-6 md:p-8 text-[var(--foreground)] animate-fade-in">
      {/* Subtle accent glow */}
      <div
        className="pointer-events-none absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 rounded-full opacity-60"
        style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.1), transparent 70%)' }}
      />

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-4 md:mb-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl shadow-[0_8px_24px_-6px_rgba(245,158,11,0.45)]">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl md:text-4xl font-black mb-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 bg-clip-text text-transparent">
                Уровень {userLevel.level}
              </h2>
              <p className="text-base md:text-lg text-[var(--text-secondary)] font-medium">{userLevel.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-amber-500/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-amber-400/30">
            <Sparkles className="w-6 h-6 text-amber-500" />
            <span className="font-bold text-lg md:text-xl text-amber-600 dark:text-amber-300">{userLevel.coins.toLocaleString('ru-RU')} монет</span>
          </div>
        </div>

        {/* XP Progress Bar - Gold → Accent */}
        <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
          <div className="flex items-center justify-between text-xs md:text-sm font-medium">
            <span className="text-[var(--text-secondary)]">Опыт</span>
            <span className="text-amber-600 dark:text-amber-300 font-bold">{userLevel.xp.toLocaleString('ru-RU')} / {userLevel.xp_to_next_level.toLocaleString('ru-RU')} XP</span>
          </div>
          <div className="fc-neomorph-inset relative h-3 md:h-5 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 via-amber-500 to-[var(--fc-accent)] rounded-full shadow-[0_0_18px_-4px_rgba(245,158,11,0.6)] animate-progress-fill"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
          <p className="text-[10px] md:text-xs text-[var(--text-secondary)] text-right">
            До следующего уровня: {(userLevel.xp_to_next_level - userLevel.xp).toLocaleString('ru-RU')} XP
          </p>
        </div>

        {/* Stats Grid with enhanced cards */}
        <div className="grid grid-cols-3 gap-2 md:gap-3 mb-3 md:mb-4">
          <div className="bg-[var(--surface-hover)] backdrop-blur-sm rounded-lg md:rounded-xl p-2 md:p-3 text-center border border-[var(--fc-glass-border)]">
            <Award className="w-4 h-4 md:w-5 md:h-5 text-amber-500 mx-auto mb-1 md:mb-2" />
            <p className="text-[var(--foreground)] text-base md:text-lg font-black">{unlockedCount}/{totalCount}</p>
            <p className="text-[var(--text-secondary)] text-[10px] md:text-xs font-medium">Достижения</p>
          </div>
          <div className="bg-[var(--surface-hover)] backdrop-blur-sm rounded-lg md:rounded-xl p-2 md:p-3 text-center border border-[var(--fc-glass-border)]">
            <Star className="w-4 h-4 md:w-5 md:h-5 text-amber-500 mx-auto mb-1 md:mb-2" />
            <p className="text-[var(--foreground)] text-base md:text-lg font-black">{userLevel.level}</p>
            <p className="text-[var(--text-secondary)] text-[10px] md:text-xs font-medium">Уровень</p>
          </div>
          <div className="bg-[var(--surface-hover)] backdrop-blur-sm rounded-lg md:rounded-xl p-2 md:p-3 text-center border border-[var(--fc-glass-border)]">
            <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-amber-500 mx-auto mb-1 md:mb-2" />
            <p className="text-[var(--foreground)] text-base md:text-lg font-black">{userLevel.coins.toLocaleString('ru-RU')}</p>
            <p className="text-[var(--text-secondary)] text-[10px] md:text-xs font-medium">Монеты</p>
          </div>
        </div>

        {/* Enhanced CTA Button - Accent */}
        <Link
          href="/gamification"
          className="w-full flex items-center justify-center gap-2 py-2 md:py-3 rounded-lg md:rounded-xl text-white font-semibold transition-all shadow-[0_8px_24px_-6px_rgba(var(--fc-accent-rgb)/0.5)] hover:shadow-[0_12px_28px_-6px_rgba(var(--fc-accent-rgb)/0.7)] group/btn text-sm md:text-base"
          style={{ backgroundImage: 'linear-gradient(135deg, #8b7cf6, #c4b5fd)' }}
        >
          <TrendingUp className="w-4 h-4 group-hover/btn:animate-bounce" />
          <span>Смотреть все достижения</span>
          <ChevronRight className="w-4 h-4 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
        </Link>
      </div>
    </div>
  );
}
