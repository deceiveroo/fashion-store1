'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Star, Zap, Crown, Target, TrendingUp, Award,
  Sparkles, Gift, Flame, Medal, ChevronRight
} from 'lucide-react';

interface UserLevel {
  level: number;
  xp: number;
  xp_to_next_level: number;
  title: string;
  coins: number;
}

interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xp_reward: number;
  coins_reward: number;
  rarity: string;
  unlocked: boolean;
  unlocked_at?: string;
}

export default function GamificationDashboard() {
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGamificationData();
  }, []);

  const fetchGamificationData = async () => {
    try {
      // Fetch user level
      const levelRes = await fetch('/api/gamification/profile');
      const levelData = await levelRes.json();
      setUserLevel(levelData);

      // Fetch achievements
      const achievementsRes = await fetch('/api/gamification/achievements');
      const achievementsData = await achievementsRes.json();
      // Убедимся что это массив
      setAchievements(Array.isArray(achievementsData) ? achievementsData : []);
    } catch (error) {
      console.error('Error fetching gamification data:', error);
      setAchievements([]); // Установим пустой массив при ошибке
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-500 to-orange-500';
      case 'epic': return 'from-purple-500 to-pink-500';
      case 'rare': return 'from-blue-500 to-cyan-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'border-yellow-500';
      case 'epic': return 'border-purple-500';
      case 'rare': return 'border-blue-500';
      default: return 'border-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const xpProgress = userLevel ? (userLevel.xp / userLevel.xp_to_next_level) * 100 : 0;
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  return (
    <div className="space-y-6">
      {/* Level Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }} />
        </div>

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl"
                >
                  <Crown className="w-8 h-8" />
                </motion.div>
                <div>
                  <h2 className="text-3xl font-black">Уровень {userLevel?.level}</h2>
                  <p className="text-white/80 text-lg font-medium">{userLevel?.title}</p>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <Sparkles className="w-5 h-5" />
                <span className="font-bold text-lg">{userLevel?.coins} монет</span>
              </div>
            </div>
          </div>

          {/* XP Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Опыт</span>
              <span className="font-bold">{userLevel?.xp} / {userLevel?.xp_to_next_level} XP</span>
            </div>
            <div className="relative h-4 bg-white/20 backdrop-blur-sm rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-white to-yellow-200 rounded-full"
              />
              <motion.div
                animate={{ x: ['0%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                style={{ width: '50%' }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Trophy, label: 'Достижения', value: `${unlockedCount}/${totalCount}`, color: 'from-yellow-500 to-orange-500' },
          { icon: Star, label: 'Уровень', value: userLevel?.level || 0, color: 'from-purple-500 to-pink-500' },
          { icon: Zap, label: 'Опыт', value: userLevel?.xp || 0, color: 'from-blue-500 to-cyan-500' },
          { icon: Sparkles, label: 'Монеты', value: userLevel?.coins || 0, color: 'from-green-500 to-emerald-500' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
          >
            <div className={`p-3 bg-gradient-to-br ${stat.color} rounded-xl w-fit mb-3`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Achievements */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Trophy className="text-yellow-500" />
            Достижения
          </h3>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {unlockedCount} из {totalCount}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02, y: -2 }}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border-2 ${
                achievement.unlocked
                  ? getRarityBorder(achievement.rarity)
                  : 'border-gray-200 dark:border-gray-700 opacity-60'
              } ${!achievement.unlocked && 'grayscale'}`}
            >
              {/* Rarity Glow */}
              {achievement.unlocked && (
                <div className={`absolute inset-0 bg-gradient-to-br ${getRarityColor(achievement.rarity)} opacity-10 rounded-2xl`} />
              )}

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className={`text-4xl p-3 bg-gradient-to-br ${getRarityColor(achievement.rarity)} rounded-xl`}>
                    {achievement.icon}
                  </div>
                  {achievement.unlocked && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="p-2 bg-green-500 rounded-full"
                    >
                      <Award className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                </div>

                <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                  {achievement.name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {achievement.description}
                </p>

                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium">
                    <Zap className="w-3 h-3" />
                    +{achievement.xp_reward} XP
                  </span>
                  <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 font-medium">
                    <Sparkles className="w-3 h-3" />
                    +{achievement.coins_reward}
                  </span>
                </div>

                {achievement.unlocked && achievement.unlocked_at && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    Получено: {new Date(achievement.unlocked_at).toLocaleDateString('ru-RU')}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
