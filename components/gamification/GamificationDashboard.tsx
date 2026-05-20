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

export default function GamificationDashboard({ isAdmin = false }: { isAdmin?: boolean }) {
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'achievements' | 'shop'>('achievements');
  const [shopCoupons, setShopCoupons] = useState<any[]>([]);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [showForceUnlockModal, setShowForceUnlockModal] = useState<string | null>(null);

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

      // Fetch shop coupons
      const shopRes = await fetch('/api/gamification/shop');
      const shopData = await shopRes.json();
      setShopCoupons(shopData.coupons || []);
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

  // Фильтрация достижений
  const filteredAchievements = achievements.filter(achievement => {
    // Фильтр по статусу
    if (filter === 'unlocked' && !achievement.unlocked) return false;
    if (filter === 'locked' && achievement.unlocked) return false;
    
    // Фильтр по категории
    if (categoryFilter !== 'all' && achievement.category !== categoryFilter) return false;
    
    return true;
  });

  // Сортировка: сначала разблокированные, потом по редкости
  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    // Сначала разблокированные
    if (a.unlocked && !b.unlocked) return -1;
    if (!a.unlocked && b.unlocked) return 1;
    
    // Потом по редкости
    const rarityOrder = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 };
    return (rarityOrder[a.rarity as keyof typeof rarityOrder] || 5) - 
           (rarityOrder[b.rarity as keyof typeof rarityOrder] || 5);
  });

  // Получаем уникальные категории
  const categories = Array.from(new Set(achievements.map(a => a.category)));

  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      shopping: '🛍️ Покупки',
      orders: '📦 Заказы',
      wishlist: '❤️ Избранное',
      browsing: '🔍 Просмотры',
      savings: '💰 Экономия',
      profile: '📱 Профиль',
      security: '🔐 Безопасность',
      special: '🎯 События',
      milestone: '🚀 Вехи',
    };
    return names[category] || category;
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      shopping: '🛍️',
      orders: '📦',
      wishlist: '❤️',
      browsing: '🔍',
      savings: '💰',
      profile: '📱',
      security: '🔐',
      special: '🎯',
      milestone: '🚀',
    };
    return icons[category] || '🌟';
  };

  const handlePurchaseCoupon = async (shopCouponId: string) => {
    if (!confirm('Купить этот промокод за монеты?')) return;

    setPurchasing(shopCouponId);
    try {
      const res = await fetch('/api/gamification/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopCouponId }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Ошибка покупки');
        return;
      }

      alert(`✅ Промокод куплен!\n\nКод: ${data.coupon.code}\nСкидка: ${data.coupon.discount}${data.coupon.discountType === 'percent' ? '%' : '₽'}\n\nОсталось монет: ${data.remainingCoins}`);
      
      // Refresh data
      fetchGamificationData();
    } catch (error) {
      console.error('Error purchasing coupon:', error);
      alert('Ошибка сети');
    } finally {
      setPurchasing(null);
    }
  };

  const handleForceUnlock = async (achievementCode: string) => {
    console.log('[ACHIEVEMENT] Force unlock clicked:', achievementCode);
    console.log('[ACHIEVEMENT] Is admin:', isAdmin);
    
    if (!isAdmin) {
      alert('❌ Только для администраторов!');
      return;
    }
    
    setShowForceUnlockModal(achievementCode);
  };

  const executeForceUnlock = async () => {
    if (!showForceUnlockModal) return;
    
    const achievementCode = showForceUnlockModal;
    setShowForceUnlockModal(null);

    try {
      const res = await fetch('/api/gamification/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ achievementCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Ошибка');
        return;
      }

      alert('✅ Достижение разблокировано!');
      fetchGamificationData();
    } catch (error) {
      console.error('Error unlocking achievement:', error);
      alert('Ошибка сети');
    }
  };

  return (
    <div className="space-y-6">
      {/* Level Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
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
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
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
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('achievements')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'achievements'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-gray-700'
            }`}
          >
            🏆 Достижения
          </button>
          <button
            onClick={() => setActiveTab('shop')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'shop'
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-yellow-100 dark:hover:bg-gray-700'
            }`}
          >
            🛒 Магазин промокодов
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{userLevel?.coins} 💰</span>
          </button>
        </div>

        {activeTab === 'achievements' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Trophy className="text-yellow-500" />
                Достижения
              </h3>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {unlockedCount} из {totalCount}
              </span>
            </div>

            {/* Фильтры - Ultra Premium Glassmorphism */}
            <div className="mb-8 space-y-4">
              {/* Статус фильтр - 3D Glass Pills */}
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 flex-wrap p-3 bg-gradient-to-br from-white/60 via-purple-50/40 to-pink-50/40 dark:from-gray-900/60 dark:via-purple-900/20 dark:to-pink-900/20 backdrop-blur-xl rounded-3xl border border-white/50 dark:border-gray-700/50 shadow-xl"
              >
                <motion.button
                  whileHover={{ scale: 1.05, transition: { duration: 0.15 } }}
                  whileTap={{ scale: 0.95, transition: { duration: 0.1 } }}
                  onClick={() => setFilter('all')}
                  className={`px-6 py-3 rounded-2xl font-bold transition-all duration-300 flex items-center gap-2 ${
                    filter === 'all'
                      ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white shadow-lg shadow-purple-500/40 scale-105 ring-2 ring-purple-300 dark:ring-purple-500'
                      : 'bg-white/70 dark:bg-gray-800/70 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-md border border-gray-200/50 dark:border-gray-600/50'
                  }`}
                >
                  <span className="text-xl">🎯</span>
                  <span>Все</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    filter === 'all' ? 'bg-white/25' : 'bg-gray-200 dark:bg-gray-700'
                  }`}>
                    {totalCount}
                  </span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, transition: { duration: 0.15 } }}
                  whileTap={{ scale: 0.95, transition: { duration: 0.1 } }}
                  onClick={() => setFilter('unlocked')}
                  className={`px-6 py-3 rounded-2xl font-bold transition-all duration-300 flex items-center gap-2 ${
                    filter === 'unlocked'
                      ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-green-500 text-white shadow-lg shadow-green-500/40 scale-105 ring-2 ring-green-300 dark:ring-green-500'
                      : 'bg-white/70 dark:bg-gray-800/70 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-md border border-gray-200/50 dark:border-gray-600/50'
                  }`}
                >
                  <span className="text-xl">✨</span>
                  <span>Открыто</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    filter === 'unlocked' ? 'bg-white/25' : 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                  }`}>
                    {unlockedCount}
                  </span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, transition: { duration: 0.15 } }}
                  whileTap={{ scale: 0.95, transition: { duration: 0.1 } }}
                  onClick={() => setFilter('locked')}
                  className={`px-6 py-3 rounded-2xl font-bold transition-all duration-300 flex items-center gap-2 ${
                    filter === 'locked'
                      ? 'bg-gradient-to-r from-gray-600 via-slate-600 to-gray-600 text-white shadow-lg shadow-gray-500/40 scale-105 ring-2 ring-gray-300 dark:ring-gray-500'
                      : 'bg-white/70 dark:bg-gray-800/70 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-md border border-gray-200/50 dark:border-gray-600/50'
                  }`}
                >
                  <span className="text-xl">🔒</span>
                  <span>Закрыто</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    filter === 'locked' ? 'bg-white/25' : 'bg-gray-200 dark:bg-gray-700'
                  }`}>
                    {totalCount - unlockedCount}
                  </span>
                </motion.button>
              </motion.div>

              {/* Категории - Premium Horizontal Scroll */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="relative"
              >
                <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide snap-x">
                  <motion.button
                    whileHover={{ scale: 1.05, transition: { duration: 0.15 } }}
                    whileTap={{ scale: 0.95, transition: { duration: 0.1 } }}
                    onClick={() => setCategoryFilter('all')}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap snap-start flex-shrink-0 ${
                      categoryFilter === 'all'
                        ? 'bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 text-white shadow-lg shadow-blue-500/40 ring-2 ring-blue-300 dark:ring-blue-500'
                        : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm'
                    }`}
                  >
                    🌟 Все категории
                  </motion.button>
                  {categories.map((category, idx) => (
                    <motion.button
                      key={category}
                      whileHover={{ scale: 1.05, transition: { duration: 0.15 } }}
                      whileTap={{ scale: 0.95, transition: { duration: 0.1 } }}
                      onClick={() => setCategoryFilter(category)}
                      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap snap-start flex-shrink-0 ${
                        categoryFilter === category
                          ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/40 ring-2 ring-purple-300 dark:ring-purple-500'
                          : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-700 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm'
                      }`}
                    >
                      {getCategoryIcon(category)} {getCategoryName(category).split(' ')[1] || getCategoryName(category)}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedAchievements.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                {filter === 'unlocked' 
                  ? '🎯 У вас пока нет разблокированных достижений в этой категории'
                  : filter === 'locked'
                  ? '🎉 Поздравляем! Вы разблокировали все достижения в этой категории'
                  : '😕 Достижения не найдены'}
              </p>
            </div>
          ) : (
            sortedAchievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.4, ease: "easeOut" }}
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

                {/* Admin Force Unlock Button */}
                {isAdmin && !achievement.unlocked && (
                  <button
                    onClick={() => handleForceUnlock(achievement.code)}
                    className="mt-3 w-full py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2"
                  >
                    ⚡ Выполнить
                  </button>
                )}
              </div>
            </motion.div>
            ))
          )}
        </div>
          </>
        )}

        {/* Shop Tab - Cyber-Glassmorphism Neo-Brutalism 2025 */}
        {activeTab === 'shop' && (
          <div className="relative">
            {/* Particle Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 3}s`,
                    animationDuration: `${2 + Math.random() * 3}s`
                  }}
                />
              ))}
            </div>

            {/* Hero Section - Liquid Neon Glassmorphism */}
            <div className="relative mb-8 overflow-hidden rounded-[20px] bg-gradient-to-br from-[#0a0a1a] via-[#1a0a2e] to-[#0a0a1a] p-8 shadow-2xl border border-white/10">
              {/* Animated Liquid Neon Gradient */}
              <div className="absolute inset-0 opacity-40">
                <div className="absolute inset-0 bg-gradient-to-r from-[#6C5CE7] via-[#00D2FF] to-[#FF6B9D] blur-[40px] animate-pulse" />
                <div className="absolute top-0 left-1/4 w-64 h-64 bg-[#6C5CE7]/30 rounded-full blur-[60px] animate-bounce" style={{ animationDuration: '4s' }} />
                <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#00D2FF]/30 rounded-full blur-[60px] animate-bounce" style={{ animationDuration: '5s', animationDelay: '1s' }} />
              </div>

              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h3 className="text-4xl font-black text-white mb-3 flex items-center gap-3 drop-shadow-lg">
                    <motion.span 
                      animate={{ rotateY: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="inline-block text-5xl"
                      style={{ textShadow: '0 0 20px #6C5CE7, 0 0 40px #00D2FF' }}
                    >
                      🛍️
                    </motion.span>
                    <span style={{ background: 'linear-gradient(135deg, #6C5CE7, #00D2FF, #FF6B9D)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      Магазин Промокодов
                    </span>
                  </h3>
                  <p className="text-white/70 text-lg max-w-xl font-medium">
                    Обменяйте монеты на эксклюзивные кибер-скидки!
                  </p>
                </div>
                
                {/* Holographic Coin Capsule */}
                <motion.div
                  whileHover={{ scale: 1.05, rotateY: 10 }}
                  className="relative px-6 py-4 rounded-2xl border border-[#FFD700]/30 shadow-2xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,215,0,0.1), rgba(108,92,231,0.1))',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 0 30px rgba(255,215,0,0.3), inset 0 0 20px rgba(255,215,0,0.1)'
                  }}
                >
                  <div className="text-[#FFD700]/80 text-sm font-medium mb-1 tracking-wider">БАЛАНС</div>
                  <div className="text-white text-3xl font-black flex items-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="inline-block text-2xl"
                    >
                      💰
                    </motion.span>
                    <span style={{ fontFamily: 'monospace', textShadow: '0 0 10px #FFD700' }}>{userLevel?.coins || 0}</span>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Coupons Grid - Cyber-Glassmorphism Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
              {shopCoupons.length === 0 ? (
                <div className="col-span-full">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-20 rounded-[20px] border-2 border-dashed border-[#6C5CE7]/50"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      backdropFilter: 'blur(20px)'
                    }}
                  >
                    <div className="text-7xl mb-4 animate-bounce">🎁</div>
                    <p className="text-2xl font-bold text-white mb-2" style={{ textShadow: '0 0 20px #6C5CE7' }}>Скоро открытие!</p>
                    <p className="text-white/60">Эксклюзивные кибер-промокоды уже в пути</p>
                  </motion.div>
                </div>
              ) : (
                shopCoupons.map((coupon, index) => {
                  const accentColor = coupon.alreadyPurchased ? '#00FF88' : 
                                     !coupon.inStock || !coupon.canAfford ? '#666' :
                                     ['#6C5CE7', '#00D2FF', '#FF6B9D', '#FFD700'][index % 4];
                  
                  return (
                  <motion.div
                    key={coupon.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08, type: "spring", stiffness: 100 }}
                    whileHover={coupon.alreadyPurchased || (!coupon.inStock || !coupon.canAfford) ? {} : {
                      translateY: -8,
                      boxShadow: `0 0 30px ${accentColor}40, 0 0 60px ${accentColor}20`,
                      transition: { duration: 0.2, ease: "easeOut" }
                    }}
                    className={`group relative overflow-hidden rounded-[20px] p-6 border transition-all duration-300 ${
                      coupon.alreadyPurchased
                        ? 'opacity-100'
                        : !coupon.inStock || !coupon.canAfford
                        ? 'opacity-50'
                        : ''
                    }`}
                    style={{
                      background: coupon.alreadyPurchased 
                        ? 'rgba(0,255,136,0.05)'
                        : 'rgba(255,255,255,0.05)',
                      backdropFilter: 'blur(20px)',
                      border: coupon.alreadyPurchased
                        ? '1px solid rgba(0,255,136,0.5)'
                        : !coupon.inStock || !coupon.canAfford
                        ? '1px solid rgba(255,255,255,0.1)'
                        : `1px solid linear-gradient(135deg, ${accentColor}40, ${accentColor}80)`,
                      boxShadow: coupon.alreadyPurchased
                        ? '0 0 20px rgba(0,255,136,0.3), inset 0 0 20px rgba(0,255,136,0.1)'
                        : 'none'
                    }}
                  >
                    {/* Shine Effect on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                    <div className="relative z-10">
                      {/* Coupon Header with 3D Icon */}
                      <div className="mb-6 flex items-start justify-between">
                        <motion.div 
                          whileHover={{ scale: 1.15, rotate: [0, -5, 5, 0] }}
                          transition={{ duration: 0.4 }}
                          className="text-5xl p-3 rounded-2xl relative"
                          style={{
                            background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,107,157,0.15))',
                            boxShadow: coupon.alreadyPurchased 
                              ? '0 8px 32px rgba(0,255,136,0.3)'
                              : '0 8px 32px rgba(108,92,231,0.3)',
                            border: '1px solid rgba(255,255,255,0.1)'
                          }}
                        >
                          {coupon.alreadyPurchased ? '✅' : '🎫'}
                        </motion.div>
                        
                        {/* Already Purchased Badge - Neon Green */}
                        {coupon.alreadyPurchased && (
                          <motion.div 
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, type: "spring" }}
                            className="px-4 py-2 text-white text-xs font-black rounded-full shadow-lg flex items-center gap-2"
                            style={{
                              background: 'linear-gradient(135deg, #00FF88, #00D2FF)',
                              boxShadow: '0 0 20px rgba(0,255,136,0.5), inset 0 0 10px rgba(255,255,255,0.2)',
                              border: '1px solid rgba(255,255,255,0.3)'
                            }}
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            КУПЛЕНО
                          </motion.div>
                        )}
                      </div>

                      {/* Coupon Name & Description */}
                      <div className="mb-5">
                        <h4 className="font-black text-white text-xl mb-2 line-clamp-1 tracking-tight"
                            style={{ textShadow: '0 0 20px rgba(108,92,231,0.5)' }}>
                          {coupon.name}
                        </h4>
                        <p className="text-xs text-gray-300/80 line-clamp-2 leading-relaxed">
                          {coupon.description}
                        </p>
                      </div>

                      {/* Discount Display - Huge Gradient Text */}
                      <div className="mb-5 p-4 rounded-2xl relative overflow-hidden"
                           style={{
                             background: 'linear-gradient(135deg, rgba(108,92,231,0.2), rgba(0,210,255,0.2))',
                             border: '1px solid rgba(108,92,231,0.3)',
                             backdropFilter: 'blur(10px)'
                           }}>
                        {/* Animated Background Glow */}
                        <div className="absolute inset-0 opacity-30">
                          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 animate-pulse" />
                        </div>
                        
                        <div className="relative z-10 text-center">
                          <div className="text-xs text-gray-300 mb-1 font-bold uppercase tracking-wider">ВАША СКИДКА</div>
                          <div className="text-5xl font-black" 
                               style={{
                                 background: 'linear-gradient(135deg, #6C5CE7, #00D2FF, #FF6B9D)',
                                 WebkitBackgroundClip: 'text',
                                 WebkitTextFillColor: 'transparent',
                                 filter: 'drop-shadow(0 0 10px rgba(108,92,231,0.5))'
                               }}>
                            {coupon.discount}{coupon.discountType === 'percent' ? '%' : '₽'}
                          </div>
                        </div>
                      </div>

                      {/* Details Grid - Micro-Chips */}
                      <div className="space-y-3 mb-5">
                        {coupon.minOrder && (
                          <div className="flex items-center justify-between text-xs p-3 rounded-xl"
                               style={{
                                 background: 'rgba(255,255,255,0.05)',
                                 border: '1px solid rgba(255,255,255,0.1)',
                                 backdropFilter: 'blur(10px)'
                               }}>
                            <span className="text-gray-400 flex items-center gap-2 font-medium">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Мин. заказ:
                            </span>
                            <span className="font-black text-white" style={{ textShadow: '0 0 10px rgba(0,210,255,0.5)' }}>
                              {parseInt(coupon.minOrder).toLocaleString('ru-RU')} ₽
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-xs p-3 rounded-xl"
                             style={{
                               background: 'rgba(255,255,255,0.05)',
                               border: '1px solid rgba(255,255,255,0.1)',
                               backdropFilter: 'blur(10px)'
                             }}>
                          <span className="text-gray-400 flex items-center gap-2 font-medium">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Срок действия:
                          </span>
                          <span className="font-black text-white" style={{ textShadow: '0 0 10px rgba(255,107,157,0.5)' }}>
                            {coupon.expiresDays} дней
                          </span>
                        </div>
                        {coupon.stock && (
                          <div className="flex items-center justify-between text-xs p-3 rounded-xl"
                               style={{
                                 background: 'rgba(255,255,255,0.05)',
                                 border: '1px solid rgba(255,255,255,0.1)',
                                 backdropFilter: 'blur(10px)'
                               }}>
                            <span className="text-gray-400 flex items-center gap-2 font-medium">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                              Осталось:
                            </span>
                            <span className={`font-black ${
                              coupon.stock - (coupon.purchasedCount || 0) <= 5
                                ? 'text-red-400'
                                : 'text-orange-400'
                            }`} style={{ textShadow: '0 0 10px currentColor' }}>
                              {coupon.stock - (coupon.purchasedCount || 0)} шт
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Purchase Button - Cyber Glow Effect */}
                      <motion.button
                        onClick={() => handlePurchaseCoupon(coupon.id)}
                        disabled={!coupon.canAfford || !coupon.inStock || coupon.alreadyPurchased || purchasing === coupon.id}
                        whileHover={coupon.canAfford && coupon.inStock && !coupon.alreadyPurchased ? { scale: 1.02, y: -2, transition: { duration: 0.15 } } : {}}
                        whileTap={coupon.canAfford && coupon.inStock && !coupon.alreadyPurchased ? { scale: 0.98, transition: { duration: 0.1 } } : {}}
                        className={`w-full py-4 rounded-2xl font-black transition-all duration-300 flex items-center justify-center gap-3 text-sm uppercase tracking-wider relative overflow-hidden ${
                          coupon.alreadyPurchased
                            ? 'cursor-default'
                            : !coupon.inStock || !coupon.canAfford
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                        }`}
                        style={{
                          background: coupon.alreadyPurchased
                            ? 'linear-gradient(135deg, #00FF88, #00D2FF)'
                            : !coupon.inStock || !coupon.canAfford
                            ? 'rgba(255,255,255,0.05)'
                            : 'linear-gradient(135deg, #6C5CE7, #00D2FF)',
                          color: coupon.alreadyPurchased || (coupon.canAfford && coupon.inStock) ? '#fff' : 'rgba(255,255,255,0.3)',
                          boxShadow: coupon.alreadyPurchased
                            ? '0 0 30px rgba(0,255,136,0.5), inset 0 0 20px rgba(255,255,255,0.2)'
                            : coupon.canAfford && coupon.inStock
                            ? '0 0 30px rgba(108,92,231,0.5), inset 0 0 20px rgba(255,255,255,0.1)'
                            : 'none',
                          border: '1px solid rgba(255,255,255,0.2)',
                          backdropFilter: 'blur(10px)'
                        }}
                      >
                        {/* Ripple Effect Overlay */}
                        {coupon.canAfford && coupon.inStock && !coupon.alreadyPurchased && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        )}
                        
                        {purchasing === coupon.id ? (
                          <>
                            <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Покупка...</span>
                          </>
                        ) : coupon.alreadyPurchased ? (
                          <>
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span>Уже куплено</span>
                          </>
                        ) : !coupon.inStock ? (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                            <span>Нет в наличии</span>
                          </>
                        ) : !coupon.canAfford ? (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span>Недостаточно монет</span>
                          </>
                        ) : (
                          <>
                            <motion.span
                              animate={{ rotate: [0, 360] }}
                              transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                              className="inline-block"
                            >
                              💰
                            </motion.span>
                            <span>Купить за {coupon.priceCoins}</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Force Unlock Confirmation Modal */}
      {showForceUnlockModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">⚡ Принудительная разблокировка</h3>
              <button
                onClick={() => setShowForceUnlockModal(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6 text-gray-700 dark:text-gray-300">
              <p className="mb-2">Разблокировать достижение:</p>
              <p className="font-mono font-bold text-lg text-purple-600 dark:text-purple-400">{showForceUnlockModal}</p>
              <p className="text-sm mt-4 text-gray-500 dark:text-gray-400">
                Вы получите XP и монеты за это достижение.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowForceUnlockModal(null)}
                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-all"
              >
                Отмена
              </button>
              <button
                onClick={executeForceUnlock}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-semibold transition-all"
              >
                Разблокировать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
