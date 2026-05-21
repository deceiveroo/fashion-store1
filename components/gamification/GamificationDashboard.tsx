'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Star, Zap, Crown, Target, TrendingUp, Award,
  Sparkles, Gift, Flame, Medal, ChevronRight, Lock, CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

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
      setAchievements(Array.isArray(achievementsData) ? achievementsData : []);

      // Fetch shop coupons
      const shopRes = await fetch('/api/gamification/shop');
      const shopData = await shopRes.json();
      setShopCoupons(shopData.coupons || []);
    } catch (error) {
      console.error('Error fetching gamification data:', error);
      setAchievements([]);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'from-amber-400 via-yellow-500 to-amber-600';
      case 'epic': return 'from-violet-500 via-purple-600 to-violet-700';
      case 'rare': return 'from-sky-400 via-blue-500 to-sky-600';
      default: return 'from-slate-400 via-gray-500 to-slate-600';
    }
  };

  const getRarityName = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'Легендарное';
      case 'epic': return 'Эпическое';
      case 'rare': return 'Редкое';
      default: return 'Обычное';
    }
  };

  const getAchievementIcon = (category: string, unlocked: boolean) => {
    // Different icons based on achievement category
    const icons: Record<string, string> = {
      shopping: '🛍️',
      orders: '📦',
      wishlist: '❤️',
      browsing: '🔍',
      savings: '💰',
      profile: '👤',
      security: '🔐',
      special: '🎯',
      milestone: '🚀',
    };
    
    return icons[category] || (unlocked ? '✨' : '🔒');
  };

  // Don't show loading - render content immediately with skeleton states
  const xpProgress = userLevel ? (userLevel.xp / userLevel.xp_to_next_level) * 100 : 0;
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  const filteredAchievements = achievements.filter(achievement => {
    if (filter === 'unlocked' && !achievement.unlocked) return false;
    if (filter === 'locked' && achievement.unlocked) return false;
    if (categoryFilter !== 'all' && achievement.category !== categoryFilter) return false;
    return true;
  });

  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    if (a.unlocked && !b.unlocked) return -1;
    if (!a.unlocked && b.unlocked) return 1;
    const rarityOrder = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 };
    return (rarityOrder[a.rarity as keyof typeof rarityOrder] || 5) - 
           (rarityOrder[b.rarity as keyof typeof rarityOrder] || 5);
  });

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

  const handlePurchase = async (couponId: string) => {
    setPurchasing(couponId);
    try {
      const res = await fetch('/api/gamification/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopCouponId: couponId }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Ошибка покупки');
        return;
      }

      toast.success('Промокод успешно куплен!', { icon: '🎉' });
      fetchGamificationData();
    } catch (error) {
      console.error('Error purchasing coupon:', error);
      toast.error('Ошибка сети');
    } finally {
      setPurchasing(null);
    }
  };

  const handleForceUnlock = async (achievementCode: string) => {
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
    <div className="space-y-8">
      {/* Luxury Level Card - Dark Gold Theme */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-slate-900 to-black rounded-3xl p-8 text-white shadow-2xl border border-yellow-600/30"
      >
        {/* Subtle Gold Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,215,0,.1) 35px, rgba(255,215,0,.1) 70px)',
          }} />
        </div>
        
        {/* Gold Glow Effect */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          {userLevel ? (
            <>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl shadow-lg shadow-yellow-500/30">
                    <Crown className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-black mb-1 bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                      Уровень {userLevel.level}
                    </h2>
                    <p className="text-lg text-gray-300 font-medium">{userLevel.title}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-yellow-500/30">
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                  <span className="font-bold text-xl text-yellow-200">{userLevel.coins.toLocaleString('ru-RU')} монет</span>
                </div>
              </div>

              {/* XP Progress Bar - Gold Style */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span className="text-gray-300">Опыт</span>
                  <span className="text-yellow-200 font-bold">{userLevel.xp.toLocaleString('ru-RU')} / {userLevel.xp_to_next_level.toLocaleString('ru-RU')} XP</span>
                </div>
                <div className="relative h-5 bg-gray-800/80 rounded-full overflow-hidden border border-yellow-600/30">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${xpProgress}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 rounded-full shadow-lg shadow-yellow-500/50"
                  />
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                </div>
                <p className="text-xs text-gray-400 text-right">
                  До следующего уровня: {(userLevel.xp_to_next_level - userLevel.xp).toLocaleString('ru-RU')} XP
                </p>
              </div>
            </>
          ) : (
            /* Skeleton loading state */
            <div className="space-y-6">
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
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <div className="h-5 w-16 bg-gray-800/80 rounded animate-pulse" />
                  <div className="h-5 w-40 bg-gray-800/80 rounded animate-pulse" />
                </div>
                <div className="h-5 bg-gray-800/80 rounded-full animate-pulse" />
                <div className="h-4 w-48 ml-auto bg-gray-800/80 rounded animate-pulse" />
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Tabs - Luxury Style */}
      <div className="flex gap-3">
        <button
          onClick={() => setActiveTab('achievements')}
          className={`px-8 py-3 rounded-xl font-semibold transition-all ${
            activeTab === 'achievements'
              ? 'bg-gradient-to-r from-gray-900 to-slate-900 text-yellow-400 shadow-lg border border-yellow-600/50'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
          }`}
        >
          🏆 Достижения ({unlockedCount}/{totalCount})
        </button>
        <button
          onClick={() => setActiveTab('shop')}
          className={`px-8 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'shop'
              ? 'bg-gradient-to-r from-gray-900 to-slate-900 text-amber-400 shadow-lg border border-amber-600/50'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
          }`}
        >
          🛒 Магазин
          <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">{userLevel?.coins} 💰</span>
        </button>
      </div>

      {activeTab === 'achievements' && (
        <>
          {/* Filters - Luxury Style */}
          <div className="flex flex-wrap gap-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            >
              <option value="all">Все достижения</option>
              <option value="unlocked">Разблокированные</option>
              <option value="locked">Заблокированные</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            >
              <option value="all">Все категории</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{getCategoryName(cat)}</option>
              ))}
            </select>
          </div>

          {/* Achievements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              // Skeleton loading state
              Array.from({ length: 6 }).map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border-2 border-gray-200 dark:border-gray-700"
                >
                  {/* Gradient bar placeholder */}
                  <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  
                  <div className="p-6 space-y-4">
                    {/* Header with icon and title */}
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </div>
                    </div>
                    
                    {/* Rewards placeholders */}
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-700">
                      <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                      <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                    </div>
                    
                    {/* Status placeholder */}
                    <div className="flex justify-between">
                      <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              // Actual achievements
              sortedAchievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`relative group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border-2 transition-all hover:shadow-xl ${
                  achievement.unlocked
                    ? `border-${getRarityBorder(achievement.rarity)} shadow-lg`
                    : 'border-gray-200 dark:border-gray-700 opacity-75'
                }`}
              >
                {/* Rarity Gradient Bar - Top */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${getRarityColor(achievement.rarity)}`} />

                <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    {/* Achievement Icon - Large Emoji */}
                    <div className={`text-4xl leading-none p-3 rounded-xl bg-gradient-to-br ${getRarityColor(achievement.rarity)} bg-opacity-10`}>
                      <span className="filter drop-shadow-lg">{getAchievementIcon(achievement.category, achievement.unlocked)}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                        {achievement.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {achievement.description}
                      </p>
                    </div>
                  </div>

                  {/* Rewards - Innovative Colors */}
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border border-cyan-200 dark:border-cyan-800">
                      <Zap className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      <span className="text-sm font-bold text-cyan-700 dark:text-cyan-300">+{achievement.xp_reward} XP</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 border border-rose-200 dark:border-rose-800">
                      <Sparkles className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      <span className="text-sm font-bold text-rose-700 dark:text-rose-300">+{achievement.coins_reward}</span>
                    </div>
                  </div>

                {/* Status */}
                {achievement.unlocked ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm font-medium">
                        Получено: {new Date(achievement.unlocked_at!).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                    {/* Rarity Label */}
                    <span className={`text-xs font-semibold px-2 py-1 rounded-md bg-gradient-to-r ${getRarityColor(achievement.rarity)} bg-opacity-10 text-gray-700 dark:text-gray-300`}>
                      {getRarityName(achievement.rarity)}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <Lock className="w-5 h-5" />
                      <span className="text-sm">Заблокировано</span>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => handleForceUnlock(achievement.code)}
                        className="text-xs px-3 py-1 rounded-lg bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30 text-cyan-700 dark:text-cyan-400 hover:from-cyan-200 hover:to-blue-200 dark:hover:from-cyan-900/50 dark:hover:to-blue-900/50 transition-all border border-cyan-300 dark:border-cyan-700"
                      >
                        Разблокировать
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
              ))
            )}
          </div>

          {!loading && sortedAchievements.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">Достижения не найдены</p>
            </div>
          )}
        </>
      )}

      {activeTab === 'shop' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shopCoupons.map((coupon) => {
            // Calculate discount display - use correct field names from API
            const discountValue = coupon.discount || 0;
            const discountType = coupon.discountType || coupon.type || 'percent';
            const discountDisplay = discountValue 
              ? `${discountValue}${discountType === 'percent' ? '%' : '₽'}`
              : '—';
            
            // Use priceCoins from API (not price or cost)
            const price = coupon.priceCoins || coupon.price || coupon.cost || 0;
            
            return (
              <motion.div
                key={coupon.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02, y: -4 }}
                className="group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 hover:border-amber-400 dark:hover:border-amber-400 transition-all shadow-sm hover:shadow-2xl"
              >
                {/* Discount Badge - Top Left Corner */}
                <div className="absolute top-0 left-0 bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 text-white px-4 py-2 rounded-br-2xl shadow-lg z-10">
                  <p className="text-2xl font-black leading-none">{discountDisplay}</p>
                  <p className="text-[10px] font-medium uppercase tracking-wider opacity-90">скидка</p>
                </div>

                <div className="pt-16 pb-6 px-6">
                  {/* Icon and Name */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                      <Gift className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{coupon.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{coupon.description}</p>
                    </div>
                  </div>

                  {/* Price and Action - Innovative Colors */}
                  <div className="flex items-center justify-between pt-4 border-t-2 border-gray-100 dark:border-gray-700">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Цена</p>
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center">
                          <Sparkles className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-xl font-black bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                          {price.toLocaleString('ru-RU')}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handlePurchase(coupon.id)}
                      disabled={purchasing === coupon.id || (userLevel?.coins || 0) < price}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white font-bold shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                      {purchasing === coupon.id ? (
                        <span className="flex items-center gap-2">
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                          />
                          ...
                        </span>
                      ) : (
                        'Купить'
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {shopCoupons.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Gift className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">Магазин временно пуст</p>
            </div>
          )}
        </div>
      )}

      {/* Force Unlock Modal - Luxury Style */}
      <AnimatePresence>
        {showForceUnlockModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowForceUnlockModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full border-2 border-yellow-600/50 shadow-2xl shadow-yellow-500/20"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-yellow-500" />
                Принудительно разблокировать?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Это действие разблокирует достижение без выполнения условий. Использовать только для тестирования.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowForceUnlockModal(null)}
                  className="flex-1 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={executeForceUnlock}
                  className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-medium hover:shadow-lg transition-all"
                >
                  Разблокировать
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const getRarityBorder = (rarity: string) => {
  switch (rarity) {
    case 'legendary': return 'yellow-500';
    case 'epic': return 'purple-500';
    case 'rare': return 'blue-500';
    default: return 'gray-400';
  }
};
