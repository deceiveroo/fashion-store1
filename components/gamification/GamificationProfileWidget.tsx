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
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-slate-900 to-black rounded-3xl p-8 shadow-2xl border border-yellow-600/30">
        {/* Subtle Gold Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,215,0,.1) 35px, rgba(255,215,0,.1) 70px)',
          }} />
        </div>
        
        <div className="relative z-10 space-y-6">
          {/* Header skeleton */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-800/80 rounded-2xl animate-pulse" />
              <div className="space-y-2">
                <div className="h-10 w-48 bg-gray-800/80 rounded-lg animate-pulse" />
                <div className="h-6 w-32 bg-gray-800/80 rounded-lg animate-pulse" />
              </div>
            </div>
            <div className="h-14 w-48 bg-gray-800/80 rounded-2xl animate-pulse" />
          </div>
          
          {/* XP bar skeleton */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <div className="h-5 w-16 bg-gray-800/80 rounded animate-pulse" />
              <div className="h-5 w-40 bg-gray-800/80 rounded animate-pulse" />
            </div>
            <div className="h-5 bg-gray-800/80 rounded-full animate-pulse" />
            <div className="h-4 w-48 ml-auto bg-gray-800/80 rounded animate-pulse" />
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
    <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-slate-900 to-black dark:from-gray-900 dark:via-slate-900 dark:to-black rounded-3xl p-6 md:p-8 text-white shadow-2xl border border-yellow-600/30 animate-fade-in">
      {/* Subtle Gold Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,215,0,.1) 35px, rgba(255,215,0,.1) 70px)',
        }} />
      </div>
      
      {/* Gold Glow Effect */}
      <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 md:w-64 md:h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-4 md:mb-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl shadow-lg shadow-yellow-500/30">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl md:text-4xl font-black mb-1 bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                Уровень {userLevel.level}
              </h2>
              <p className="text-base md:text-lg text-gray-300 font-medium">{userLevel.title}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-yellow-500/30">
            <Sparkles className="w-6 h-6 text-yellow-400" />
            <span className="font-bold text-lg md:text-xl text-yellow-200">{userLevel.coins.toLocaleString('ru-RU')} монет</span>
          </div>
        </div>

        {/* XP Progress Bar - Gold Style */}
        <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
          <div className="flex items-center justify-between text-xs md:text-sm font-medium">
            <span className="text-gray-300">Опыт</span>
            <span className="text-yellow-200 font-bold">{userLevel.xp.toLocaleString('ru-RU')} / {userLevel.xp_to_next_level.toLocaleString('ru-RU')} XP</span>
          </div>
          <div className="relative h-3 md:h-5 bg-gray-800/80 rounded-full overflow-hidden border border-yellow-600/30">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 rounded-full shadow-lg shadow-yellow-500/50 animate-progress-fill"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
          <p className="text-[10px] md:text-xs text-gray-400 text-right">
            До следующего уровня: {(userLevel.xp_to_next_level - userLevel.xp).toLocaleString('ru-RU')} XP
          </p>
        </div>

        {/* Stats Grid with enhanced cards */}
        <div className="grid grid-cols-3 gap-2 md:gap-3 mb-3 md:mb-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg md:rounded-xl p-2 md:p-3 text-center border border-white/10">
            <Award className="w-4 h-4 md:w-5 md:h-5 text-yellow-400 mx-auto mb-1 md:mb-2" />
            <p className="text-white text-base md:text-lg font-black">{unlockedCount}/{totalCount}</p>
            <p className="text-gray-400 text-[10px] md:text-xs font-medium">Достижения</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg md:rounded-xl p-2 md:p-3 text-center border border-white/10">
            <Star className="w-4 h-4 md:w-5 md:h-5 text-yellow-400 mx-auto mb-1 md:mb-2" />
            <p className="text-white text-base md:text-lg font-black">{userLevel.level}</p>
            <p className="text-gray-400 text-[10px] md:text-xs font-medium">Уровень</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg md:rounded-xl p-2 md:p-3 text-center border border-white/10">
            <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-yellow-400 mx-auto mb-1 md:mb-2" />
            <p className="text-white text-base md:text-lg font-black">{userLevel.coins.toLocaleString('ru-RU')}</p>
            <p className="text-gray-400 text-[10px] md:text-xs font-medium">Монеты</p>
          </div>
        </div>

        {/* Enhanced CTA Button */}
        <Link
          href="/gamification"
          className="w-full flex items-center justify-center gap-2 py-2 md:py-3 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 hover:from-yellow-500/30 hover:to-amber-500/30 backdrop-blur-sm rounded-lg md:rounded-xl text-yellow-200 font-semibold transition-all border border-yellow-500/30 group/btn text-sm md:text-base"
        >
          <TrendingUp className="w-4 h-4 group-hover/btn:animate-bounce" />
          <span>Смотреть все достижения</span>
          <ChevronRight className="w-4 h-4 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
        </Link>
      </div>
    </div>
  );
}
