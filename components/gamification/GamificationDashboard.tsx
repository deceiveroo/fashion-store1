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
    if (!confirm(`Принудительно разблокировать достижение "${achievementCode}"?`)) return;

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

            {/* Фильтры */}
            <div className="mb-6 space-y-4">
          {/* Фильтр по статусу */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                filter === 'all'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-gray-700'
              }`}
            >
              Все ({totalCount})
            </button>
            <button
              onClick={() => setFilter('unlocked')}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                filter === 'unlocked'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-gray-700'
              }`}
            >
              ✅ Разблокировано ({unlockedCount})
            </button>
            <button
              onClick={() => setFilter('locked')}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                filter === 'locked'
                  ? 'bg-gray-600 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              🔒 Заблокировано ({totalCount - unlockedCount})
            </button>
          </div>

          {/* Фильтр по категории */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                categoryFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-gray-700'
              }`}
            >
              Все категории
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  categoryFilter === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-gray-700'
                }`}
              >
                {getCategoryName(category)}
              </button>
            ))}
          </div>
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

        {/* Shop Tab */}
        {activeTab === 'shop' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                🛒 Магазин промокодов
              </h3>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Ваш баланс: <span className="font-bold text-yellow-600 dark:text-yellow-400">{userLevel?.coins} 💰</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shopCoupons.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400 text-lg">🛍️ Промокоды скоро появятся</p>
                </div>
              ) : (
                shopCoupons.map((coupon, index) => (
                  <motion.div
                    key={coupon.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className={`relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border-2 ${
                      coupon.alreadyPurchased
                        ? 'border-green-500'
                        : !coupon.inStock || !coupon.canAfford
                        ? 'border-gray-200 dark:border-gray-700 opacity-60'
                        : 'border-yellow-400 dark:border-yellow-600'
                    }`}
                  >
                    {/* Already Purchased Badge */}
                    {coupon.alreadyPurchased && (
                      <div className="absolute top-3 right-3 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                        ✓ Куплено
                      </div>
                    )}

                    <div className="relative z-10">
                      <div className="mb-4">
                        <div className="text-4xl mb-2">🎫</div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-1">
                          {coupon.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {coupon.description}
                        </p>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Скидка:</span>
                          <span className="font-bold text-purple-600 dark:text-purple-400">
                            {coupon.discount}{coupon.discountType === 'percent' ? '%' : '₽'}
                          </span>
                        </div>
                        {coupon.minOrder && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Мин. заказ:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {parseInt(coupon.minOrder).toLocaleString('ru-RU')} ₽
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Срок действия:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {coupon.expiresDays} дней
                          </span>
                        </div>
                        {coupon.stock && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Осталось:</span>
                            <span className="font-medium text-orange-600 dark:text-orange-400">
                              {coupon.stock - (coupon.purchasedCount || 0)} шт
                            </span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handlePurchaseCoupon(coupon.id)}
                        disabled={!coupon.canAfford || !coupon.inStock || coupon.alreadyPurchased || purchasing === coupon.id}
                        className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                          coupon.alreadyPurchased
                            ? 'bg-green-500 text-white cursor-default'
                            : !coupon.inStock || !coupon.canAfford
                            ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl'
                        }`}
                      >
                        {purchasing === coupon.id ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Покупка...
                          </>
                        ) : coupon.alreadyPurchased ? (
                          <>
                            ✓ Уже куплено
                          </>
                        ) : !coupon.inStock ? (
                          'Нет в наличии'
                        ) : !coupon.canAfford ? (
                          <>
                            🔒 Недостаточно монет
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5" />
                            Купить за {coupon.priceCoins} 💰
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
