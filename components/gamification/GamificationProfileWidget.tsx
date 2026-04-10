'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Sparkles, TrendingUp, Award } from 'lucide-react';
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
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-purple-100 dark:border-purple-900/50">
        <div className="flex items-center justify-center py-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"
          />
        </div>
      </div>
    );
  }

  if (!userLevel) return null;

  const xpProgress = (userLevel.xp / userLevel.xp_to_next_level) * 100;
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }} />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="p-3 bg-white/20 backdrop-blur-sm rounded-xl"
            >
              <Trophy className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h3 className="text-white text-xl font-black">Уровень {userLevel.level}</h3>
              <p className="text-white/80 text-sm font-medium">{userLevel.title}</p>
            </div>
          </div>
          <Link
            href="/gamification"
            className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-white text-sm font-medium transition-all"
          >
            Подробнее
          </Link>
        </div>

        {/* XP Progress */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm text-white/90">
            <span className="font-medium">Опыт</span>
            <span className="font-bold">{userLevel.xp} / {userLevel.xp_to_next_level} XP</span>
          </div>
          <div className="relative h-3 bg-white/20 backdrop-blur-sm rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="absolute inset-y-0 left-0 bg-white rounded-full"
            />
            <motion.div
              animate={{ x: ['0%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              style={{ width: '50%' }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
            <Award className="w-5 h-5 text-white mx-auto mb-1" />
            <p className="text-white text-lg font-black">{unlockedCount}/{totalCount}</p>
            <p className="text-white/80 text-xs">Достижения</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
            <Star className="w-5 h-5 text-yellow-300 mx-auto mb-1" />
            <p className="text-white text-lg font-black">{userLevel.level}</p>
            <p className="text-white/80 text-xs">Уровень</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
            <Sparkles className="w-5 h-5 text-yellow-300 mx-auto mb-1" />
            <p className="text-white text-lg font-black">{userLevel.coins}</p>
            <p className="text-white/80 text-xs">Монеты</p>
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/gamification"
          className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-white font-semibold transition-all"
        >
          <TrendingUp className="w-4 h-4" />
          Смотреть все достижения
        </Link>
      </div>
    </motion.div>
  );
}
