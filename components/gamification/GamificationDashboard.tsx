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
      // Профиль может вернуть {error} при 401 — берём только валидный объект уровня,
      // иначе userLevel.coins/xp undefined и .toLocaleString() роняет рендер.
      if (levelRes.ok && levelData && typeof levelData.level === 'number') {
        setUserLevel(levelData);
      } else {
        setUserLevel(null);
      }

      // Fetch achievements
      const achievementsRes = await fetch('/api/gamification/achievements');
      const achievementsData = achievementsRes.ok ? await achievementsRes.json() : [];
      setAchievements(Array.isArray(achievementsData) ? achievementsData : []);

      // Fetch shop coupons
      const shopRes = await fetch('/api/gamification/shop');
      const shopData = shopRes.ok ? await shopRes.json() : {};
      setShopCoupons(Array.isArray(shopData?.coupons) ? shopData.coupons : []);
    } catch (error) {
      console.error('Error fetching gamification data:', error);
      setAchievements([]);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'from-amber-400/90 via-amber-500/90 to-amber-600/90';
      case 'epic': return 'from-violet-500/85 via-purple-600/85 to-violet-700/85';
      case 'rare': return 'from-sky-400/85 via-blue-500/85 to-sky-600/85';
      default: return 'from-slate-400/85 via-slate-500/85 to-slate-600/85';
    }
  };

  const getRarityGlow = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'shadow-[0_0_36px_-12px_rgba(245,158,11,0.45)] hover:shadow-[0_0_52px_-12px_rgba(245,158,11,0.65)] border-amber-300/50 dark:border-amber-500/35';
      case 'epic': return 'shadow-[0_0_36px_-12px_rgba(139,124,246,0.45)] hover:shadow-[0_0_52px_-12px_rgba(139,124,246,0.65)] border-violet-300/50 dark:border-violet-500/35';
      case 'rare': return 'shadow-[0_0_28px_-12px_rgba(59,130,246,0.4)] hover:shadow-[0_0_46px_-12px_rgba(59,130,246,0.55)] border-sky-300/50 dark:border-sky-500/35';
      default: return 'shadow-[var(--fc-shadow-soft)] hover:shadow-[var(--fc-shadow-lifted)] border-[var(--fc-glass-border)]';
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

  const getAchievementIcon = (achievement: Achievement) => {
    // Каждое достижение имеет свой кураторский emoji в БД — используем его.
    if (achievement.icon && achievement.icon.trim()) return achievement.icon;

    // Фолбэк по категории, если icon почему-то пустой.
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

    return icons[achievement.category] || (achievement.unlocked ? '✨' : '🔒');
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
      {/* Luxury Level Card - Glass + Gold Accent */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="fc-glass-card relative overflow-hidden p-8 text-[var(--foreground)]"
      >
        {/* Subtle accent glow */}
        <div
          className="pointer-events-none absolute top-0 right-0 w-96 h-96 rounded-full opacity-70"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.12), transparent 70%)' }}
        />

        <div className="relative z-10">
          {userLevel ? (
            <>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl shadow-[0_8px_24px_-6px_rgba(245,158,11,0.45)]">
                    <Crown className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-black mb-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 bg-clip-text text-transparent">
                      Уровень {userLevel.level}
                    </h2>
                    <p className="text-lg text-[var(--text-secondary)] font-medium">{userLevel.title}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-amber-500/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-amber-400/30">
                  <Sparkles className="w-6 h-6 text-amber-500" />
                  <span className="font-bold text-xl text-amber-600 dark:text-amber-300">{userLevel.coins.toLocaleString('ru-RU')} монет</span>
                </div>
              </div>

              {/* XP Progress Bar - Gold → Accent */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span className="text-[var(--text-secondary)]">Опыт</span>
                  <span className="text-amber-600 dark:text-amber-300 font-bold">{userLevel.xp.toLocaleString('ru-RU')} / {userLevel.xp_to_next_level.toLocaleString('ru-RU')} XP</span>
                </div>
                <div className="fc-neomorph-inset relative h-5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${xpProgress}%` }}
                    transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 via-amber-500 to-[var(--fc-accent)] rounded-full shadow-[0_0_18px_-4px_rgba(245,158,11,0.6)]"
                  />
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-pulse" />
                </div>
                <p className="text-xs text-[var(--text-secondary)] text-right">
                  До следующего уровня: {(userLevel.xp_to_next_level - userLevel.xp).toLocaleString('ru-RU')} XP
                </p>
              </div>
            </>
          ) : (
            /* Skeleton loading state */
            <div className="space-y-6">
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

              <div className="space-y-3">
                <div className="flex justify-between">
                  <div className="h-5 w-16 bg-[var(--surface-hover)] rounded animate-pulse" />
                  <div className="h-5 w-40 bg-[var(--surface-hover)] rounded animate-pulse" />
                </div>
                <div className="h-5 bg-[var(--surface-hover)] rounded-full animate-pulse" />
                <div className="h-4 w-48 ml-auto bg-[var(--surface-hover)] rounded animate-pulse" />
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Segmented tabs + balance */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex p-1 rounded-full bg-[var(--surface-hover)] border border-[var(--fc-glass-border)] backdrop-blur-[20px]">
          <button
            type="button"
            onClick={() => setActiveTab('achievements')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
              activeTab === 'achievements'
                ? 'bg-[var(--fc-surface-elevated)] text-[var(--fc-accent)] shadow-[var(--fc-shadow-soft)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--foreground)]'
            }`}
          >
            <Trophy className="w-4 h-4" />
            Достижения
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${
              activeTab === 'achievements'
                ? 'bg-[rgb(var(--fc-accent-rgb)/0.15)] text-[var(--fc-accent)]'
                : 'bg-[var(--surface)] text-[var(--text-secondary)]'
            }`}>
              {unlockedCount}/{totalCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('shop')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
              activeTab === 'shop'
                ? 'bg-[var(--fc-surface-elevated)] text-[var(--fc-accent)] shadow-[var(--fc-shadow-soft)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--foreground)]'
            }`}
          >
            <Gift className="w-4 h-4" />
            Магазин
          </button>
        </div>

        {/* Coins balance */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/30">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-bold text-amber-600 dark:text-amber-300">
            {(userLevel?.coins ?? 0).toLocaleString('ru-RU')}
          </span>
          <span className="text-xs text-amber-600/70 dark:text-amber-300/70">монет</span>
        </div>
      </div>

      {activeTab === 'achievements' && (
        <>
          {/* Filters — compact */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[var(--text-secondary)]">Показать:</span>
            <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="appearance-none pl-3 pr-9 py-1.5 rounded-lg bg-[var(--fc-surface)] backdrop-blur-[20px] border border-[var(--fc-glass-border)] text-[var(--foreground)] font-medium hover:border-[var(--fc-accent)] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--fc-accent-rgb)/0.4)] cursor-pointer"
              >
                <option value="all">Все</option>
                <option value="unlocked">Открытые</option>
                <option value="locked">Закрытые</option>
              </select>
              <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] rotate-90 pointer-events-none" />
            </div>

            {categories.length > 0 && (
              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="appearance-none pl-3 pr-9 py-1.5 rounded-lg bg-[var(--fc-surface)] backdrop-blur-[20px] border border-[var(--fc-glass-border)] text-[var(--foreground)] font-medium hover:border-[var(--fc-accent)] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--fc-accent-rgb)/0.4)] cursor-pointer"
                >
                  <option value="all">Все категории</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {getCategoryName(cat)}
                    </option>
                  ))}
                </select>
                <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] rotate-90 pointer-events-none" />
              </div>
            )}

            {(filter !== 'all' || categoryFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setFilter('all');
                  setCategoryFilter('all');
                }}
                className="ml-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
              >
                Сбросить
              </button>
            )}

            <span className="ml-auto text-[var(--text-secondary)] text-xs">
              {sortedAchievements.length}{' '}
              {sortedAchievements.length === 1
                ? 'достижение'
                : sortedAchievements.length < 5
                ? 'достижения'
                : 'достижений'}
            </span>
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
                  className="fc-glass-card relative rounded-2xl overflow-hidden"
                >
                  {/* Gradient bar placeholder */}
                  <div className="h-1.5 w-full bg-[var(--surface-hover)] animate-pulse" />

                  <div className="p-6 space-y-4">
                    {/* Header with icon and title */}
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-xl bg-[var(--surface-hover)] animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-5 w-3/4 bg-[var(--surface-hover)] rounded animate-pulse" />
                        <div className="h-4 w-full bg-[var(--surface-hover)] rounded animate-pulse" />
                      </div>
                    </div>

                    {/* Rewards placeholders */}
                    <div className="flex items-center gap-3 pb-4 border-b border-[var(--fc-glass-border)]">
                      <div className="h-8 w-24 bg-[var(--surface-hover)] rounded-lg animate-pulse" />
                      <div className="h-8 w-24 bg-[var(--surface-hover)] rounded-lg animate-pulse" />
                    </div>

                    {/* Status placeholder */}
                    <div className="flex justify-between">
                      <div className="h-5 w-32 bg-[var(--surface-hover)] rounded animate-pulse" />
                      <div className="h-6 w-20 bg-[var(--surface-hover)] rounded-md animate-pulse" />
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              // Actual achievements
              sortedAchievements.map((achievement, index) => {
                const rarityGradient = getRarityColor(achievement.rarity);
                const isLegendary = achievement.rarity === 'legendary';
                const isEpic = achievement.rarity === 'epic';

                return (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04, ease: [0.34, 1.56, 0.64, 1] }}
                  whileHover={{ y: -6 }}
                  className={`group relative overflow-hidden rounded-3xl bg-[var(--fc-surface)] backdrop-blur-[20px] border transition-all duration-500 flex flex-col min-h-[340px] ${
                    achievement.unlocked
                      ? `${getRarityGlow(achievement.rarity)} shadow-[var(--fc-shadow-soft)]`
                      : 'border-[var(--fc-glass-border)] shadow-[var(--fc-shadow-soft)] hover:shadow-[var(--fc-shadow-lifted)]'
                  }`}
                >
                  {/* Hero band — softened gradient by rarity */}
                  <div className={`relative h-44 overflow-hidden bg-gradient-to-br ${rarityGradient} ${achievement.unlocked ? 'opacity-90' : 'grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-80 transition-all'}`}>
                    {/* Diagonal shine on hover */}
                    <div className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12" />

                    {/* Rarity label top-right */}
                    <span className="absolute top-3 right-3 z-10 text-[10px] font-bold uppercase tracking-[0.2em] px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-md text-white border border-white/20">
                      {getRarityName(achievement.rarity)}
                    </span>

                    {/* Lock badge for locked */}
                    {!achievement.unlocked && (
                      <span className="absolute top-3 left-3 z-10 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/20">
                        <Lock className="w-3 h-3" />
                        Закрыто
                      </span>
                    )}

                    {/* Unlocked checkmark */}
                    {achievement.unlocked && (
                      <span className="absolute top-3 left-3 z-10 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/90 backdrop-blur-md text-white border border-white/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Получено
                      </span>
                    )}

                    {/* Big emoji icon — centered in the hero band, no overlap */}
                    <div className={`absolute inset-0 flex items-center justify-center pointer-events-none`}>
                      <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-6xl shadow-xl ring-4 ring-white/40 bg-gradient-to-br ${rarityGradient} group-hover:scale-110 transition-transform duration-300`}>
                        <span className="drop-shadow-lg">
                          {getAchievementIcon(achievement)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="relative px-6 pt-6 pb-5 flex-1 flex flex-col">
                    <div className="text-center mb-4">
                      <h3 className="font-bold text-lg text-[var(--foreground)] leading-tight mb-1.5">
                        {achievement.name}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                        {achievement.description}
                      </p>
                    </div>

                    {/* Rewards row */}
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgb(var(--fc-accent-rgb)/0.1)] border border-[rgb(var(--fc-accent-rgb)/0.25)]">
                        <Zap className="w-4 h-4 text-[var(--fc-accent)]" />
                        <span className="text-sm font-bold text-[var(--fc-accent)]">+{achievement.xp_reward} XP</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-400/30">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-bold text-amber-600 dark:text-amber-300">+{achievement.coins_reward}</span>
                      </div>
                    </div>

                    {/* Footer — date or admin button */}
                    <div className="mt-auto pt-3 border-t border-[var(--fc-glass-border)]">
                      {achievement.unlocked ? (
                        <p className="text-xs text-center text-[var(--text-secondary)]">
                          Получено {new Date(achievement.unlocked_at!).toLocaleDateString('ru-RU')}
                        </p>
                      ) : isAdmin ? (
                        <button
                          onClick={() => handleForceUnlock(achievement.code)}
                          className="w-full text-xs font-medium px-3 py-1.5 rounded-lg text-white transition-all shadow-[0_4px_14px_-4px_rgba(var(--fc-accent-rgb)/0.5)] hover:shadow-[0_6px_18px_-4px_rgba(var(--fc-accent-rgb)/0.7)]"
                          style={{ backgroundImage: 'linear-gradient(135deg, #8b7cf6, #c4b5fd)' }}
                        >
                          Разблокировать
                        </button>
                      ) : (
                        <p className="text-xs text-center text-[var(--text-secondary)]">
                          Выполните условие, чтобы открыть
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Legendary/Epic outer glow */}
                  {achievement.unlocked && (isLegendary || isEpic) && (
                    <div className={`pointer-events-none absolute -inset-1 rounded-3xl blur-2xl opacity-25 group-hover:opacity-40 transition-opacity bg-gradient-to-br ${rarityGradient} -z-10`} />
                  )}
                </motion.div>
                );
              })
            )}
          </div>

          {!loading && sortedAchievements.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 mx-auto text-[var(--text-secondary)] opacity-50 mb-4" />
              <p className="text-[var(--text-secondary)] text-lg">Достижения не найдены</p>
            </div>
          )}
        </>
      )}

      {activeTab === 'shop' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {shopCoupons.map((coupon, idx) => {
            // Calculate discount display - use correct field names from API
            const discountValue = coupon.discount || 0;
            const discountType = coupon.discountType || coupon.type || 'percent';
            const discountDisplay = discountValue
              ? `${discountValue}${discountType === 'percent' ? '%' : '₽'}`
              : '—';

            // Use priceCoins from API (not price or cost)
            const price = coupon.priceCoins || coupon.price || coupon.cost || 0;
            const userCoins = userLevel?.coins || 0;
            const canAfford = userCoins >= price;
            const shortage = canAfford ? 0 : price - userCoins;

            return (
              <motion.div
                key={coupon.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, ease: [0.34, 1.56, 0.64, 1] }}
                whileHover={{ y: -6 }}
                className="group relative overflow-hidden rounded-3xl bg-[var(--fc-surface)] backdrop-blur-[20px] border border-[var(--fc-glass-border)] shadow-[var(--fc-shadow-soft)] hover:shadow-[var(--fc-shadow-lifted)] transition-all duration-500 flex flex-col min-h-[340px]"
              >
                {/* Subtle accent glow */}
                <div
                  className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full opacity-60 group-hover:opacity-80 transition-opacity"
                  style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.16), transparent 70%)' }}
                />

                {/* Diagonal shine on hover */}
                <div className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12" />

                {/* Big discount label */}
                <div className="relative z-10 px-7 pt-7 pb-2 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-amber-600/80 dark:text-amber-300/80 font-semibold mb-2">
                      Скидка
                    </p>
                    <p className="text-6xl font-black leading-none bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 bg-clip-text text-transparent drop-shadow-sm">
                      {discountDisplay}
                    </p>
                  </div>
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-[0_8px_24px_-6px_rgba(245,158,11,0.45)] group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300">
                    <Gift className="w-7 h-7 text-white" />
                  </div>
                </div>

                {/* Name + description */}
                <div className="relative z-10 px-7 pt-3 pb-2 flex-1">
                  <h3 className="font-bold text-xl text-[var(--foreground)] mb-2 leading-snug line-clamp-2">
                    {coupon.name}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-3">
                    {coupon.description}
                  </p>
                </div>

                {/* Footer: price + button */}
                <div className="relative z-10 px-7 pb-6 pt-4 mt-auto">
                  <div className="border-t border-dashed border-[var(--fc-glass-border)] pt-4 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                        Цена
                      </p>
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span className="text-2xl font-black text-[var(--foreground)] tabular-nums">
                          {price.toLocaleString('ru-RU')}
                        </span>
                      </div>
                      {!canAfford && (
                        <p className="mt-1.5 text-[11px] font-medium text-rose-500 dark:text-rose-400">
                          Не хватает {shortage.toLocaleString('ru-RU')} 💰
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handlePurchase(coupon.id)}
                      disabled={purchasing === coupon.id || !canAfford}
                      style={canAfford ? { backgroundImage: 'linear-gradient(135deg, #8b7cf6, #c4b5fd)' } : undefined}
                      className={`px-5 py-3 rounded-2xl font-semibold text-sm whitespace-nowrap transition-all ${
                        canAfford
                          ? 'text-white shadow-[0_8px_24px_-6px_rgba(var(--fc-accent-rgb)/0.5)] hover:shadow-[0_12px_28px_-6px_rgba(var(--fc-accent-rgb)/0.7)] hover:scale-105 active:scale-95'
                          : 'bg-[var(--surface-hover)] text-[var(--text-secondary)] cursor-not-allowed'
                      } disabled:opacity-70`}
                    >
                      {purchasing === coupon.id ? (
                        <span className="flex items-center gap-2">
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                          />
                          Покупка
                        </span>
                      ) : canAfford ? (
                        'Купить'
                      ) : (
                        'Недоступно'
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {shopCoupons.length === 0 && (
            <div className="col-span-full text-center py-16">
              <Gift className="w-20 h-20 mx-auto text-[var(--text-secondary)] opacity-50 mb-4" />
              <p className="text-[var(--text-secondary)] text-lg font-medium">Магазин временно пуст</p>
              <p className="text-[var(--text-secondary)] opacity-70 text-sm mt-1">Скоро здесь появятся новые промокоды</p>
            </div>
          )}
        </div>
      )}

      {/* Force Unlock Modal - Glass Style */}
      <AnimatePresence>
        {showForceUnlockModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => setShowForceUnlockModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ ease: [0.34, 1.56, 0.64, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="fc-glass-card p-6 max-w-md w-full border border-[var(--fc-glass-border)]"
            >
              <h3 className="text-xl font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-[var(--fc-accent)]" />
                Принудительно разблокировать?
              </h3>
              <p className="text-[var(--text-secondary)] mb-6">
                Это действие разблокирует достижение без выполнения условий. Использовать только для тестирования.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowForceUnlockModal(null)}
                  className="flex-1 px-4 py-2 rounded-xl bg-[var(--surface-hover)] text-[var(--foreground)] font-medium hover:bg-[var(--surface)] border border-[var(--fc-glass-border)] transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={executeForceUnlock}
                  className="flex-1 px-4 py-2 rounded-xl text-white font-medium transition-all shadow-[0_8px_24px_-6px_rgba(var(--fc-accent-rgb)/0.5)] hover:shadow-[0_12px_28px_-6px_rgba(var(--fc-accent-rgb)/0.7)]"
                  style={{ backgroundImage: 'linear-gradient(135deg, #8b7cf6, #c4b5fd)' }}
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
