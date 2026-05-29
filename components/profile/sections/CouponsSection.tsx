'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, Clock, Copy, CheckCircle2, XCircle, AlertCircle, TrendingUp, ShoppingBag, Trash2, Coins } from 'lucide-react';
import { UserCoupon } from '@/app/profile/hooks/useProfileData';
import { Loader } from 'lucide-react';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';

interface CouponsSectionProps {
  coupons: UserCoupon[];
  isLoadingData: boolean;
  loadCoupons?: () => Promise<void>;
}

type TabType = 'all' | 'active' | 'used' | 'expired';

export default function CouponsSection({ coupons, isLoadingData, loadCoupons }: CouponsSectionProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [stats, setStats] = useState({
    totalSavings: 0,
    usedCount: 0,
    activeCount: 0,
    expiredCount: 0,
  });

  // Calculate stats
  useEffect(() => {
    const totalSavings = coupons.reduce((sum, c) => {
      const amount = c.discountAmount || '0';
      return sum + (typeof amount === 'string' ? parseFloat(amount) : amount);
    }, 0);
    const usedCount = coupons.filter(c => c.status === 'used' || !c.isValid).length;
    const activeCount = coupons.filter(c => c.status === 'active' || (c.isValid && !c.isExpired)).length;
    const expiredCount = coupons.filter(c => c.status === 'expired' || c.isExpired).length;
    
    setStats({ totalSavings, usedCount, activeCount, expiredCount });
  }, [coupons]);

  // Filter coupons based on active tab
  const filteredCoupons = coupons.filter(coupon => {
    switch (activeTab) {
      case 'active':
        return coupon.status === 'active' || (coupon.isValid && !coupon.isExpired);
      case 'used':
        return coupon.status === 'used' || !coupon.isValid;
      case 'expired':
        return coupon.status === 'expired' || coupon.isExpired;
      default:
        return true;
    }
  });

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Промокод скопирован!', {
      icon: '📋',
    });
  };

  const deleteCoupon = async (couponId: string, couponCode: string) => {
    if (!confirm(`Удалить запись о использовании промокода ${couponCode}?\n\nЭто действие нельзя отменить.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/profile/coupons/${couponId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        toast.success('Запись удалена', { icon: '🗑️' });
        // Reload coupons data
        if (loadCoupons) {
          await loadCoupons();
        } else {
          window.location.reload();
        }
      } else {
        const data = await res.json();
        toast.error(data.error || 'Ошибка удаления');
      }
    } catch (error) {
      console.error('Error deleting coupon usage:', error);
      toast.error('Ошибка сети');
    }
  };

  if (isLoadingData) {
    return (
      <div className="text-center py-16">
        <Loader className="animate-spin mx-auto text-[#8b7cf6] mb-4" size={48} />
        <p className="text-[var(--text-secondary)]">Загрузка промокодов...</p>
      </div>
    );
  }

  if (coupons.length === 0) {
    return (
      <div className="text-center py-16">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
          style={{ backgroundImage: 'linear-gradient(135deg, #8b7cf6, #c4b5fd)' }}
        >
          <Ticket size={48} className="text-white" />
        </motion.div>
        <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">У вас пока нет промокодов</h3>
        <p className="text-[var(--text-secondary)] max-w-md mx-auto">
          Промокоды появятся здесь после использования при оформлении заказа или покупки в магазине геймификации
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards - Clean Design */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fc-glass-card p-4 transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#8b7cf6]/15">
              <TrendingUp size={18} className="text-[#8b7cf6]" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)]">Сэкономлено</p>
              <p className="text-xl font-bold text-[var(--foreground)]">
                {stats.totalSavings.toLocaleString('ru-RU')} ₽
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="fc-glass-card p-4 transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)]">Активных</p>
              <p className="text-xl font-bold text-[var(--foreground)]">
                {stats.activeCount}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="fc-glass-card p-4 transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <ShoppingBag size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)]">Использовано</p>
              <p className="text-xl font-bold text-[var(--foreground)]">
                {stats.usedCount}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="fc-glass-card p-4 transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/30">
              <XCircle size={18} className="text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)]">Истекло</p>
              <p className="text-xl font-bold text-[var(--foreground)]">
                {stats.expiredCount}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs - Clean Design */}
      <div className="flex gap-2 p-1 bg-[var(--fc-surface-elevated)] border border-[var(--fc-glass-border)] rounded-xl w-fit">
        {[
          { id: 'all', label: 'Все', count: coupons.length },
          { id: 'active', label: 'Активные', count: stats.activeCount },
          { id: 'used', label: 'Использованные', count: stats.usedCount },
          { id: 'expired', label: 'Истёкшие', count: stats.expiredCount },
        ].map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              activeTab === tab.id
                ? 'bg-[#8b7cf6] text-white shadow-sm shadow-purple-500/30'
                : 'text-[var(--text-secondary)] hover:text-[var(--foreground)]'
            }`}
          >
            <span className="flex items-center gap-2">
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id
                  ? 'bg-white/20 text-white'
                  : 'bg-[var(--fc-glass-border)] text-[var(--text-secondary)]'
              }`}>
                {tab.count}
              </span>
            </span>
          </motion.button>
        ))}
      </div>

      {/* Coupons Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {filteredCoupons.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <AlertCircle size={48} className="mx-auto text-[var(--text-secondary)] mb-4" />
              <p className="text-[var(--text-secondary)]">Нет промокодов в этой категории</p>
            </div>
          ) : (
            filteredCoupons.map((coupon, index) => {
              const isUsed = !coupon.isValid;
              const isExpired = coupon.isExpired;
              const isActive = coupon.isValid && !isExpired;
              const fromShop = coupon.source === 'shop';

              return (
                <motion.div
                  key={coupon.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`group relative overflow-hidden rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-md ${
                    isActive && fromShop
                      ? 'bg-gradient-to-br from-amber-50 via-white to-orange-50/50 dark:from-amber-950/30 dark:via-gray-800 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800'
                      : 'fc-glass-card'
                  }`}
                >
                  {isActive && fromShop && (
                    <>
                      <div className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full bg-amber-300/20 blur-3xl" />
                      <div className="pointer-events-none absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-orange-300/15 blur-3xl" />
                    </>
                  )}

                  <div className="relative">
                  {/* Header with Status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg ${
                        isActive && fromShop
                          ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-md shadow-amber-500/30'
                          : isActive
                          ? 'bg-[#8b7cf6]/15'
                          : isUsed
                          ? 'bg-blue-100 dark:bg-blue-900/30'
                          : 'bg-rose-100 dark:bg-rose-900/30'
                      }`}>
                        <Ticket size={20} className={
                          isActive && fromShop
                            ? 'text-white'
                            : isActive
                            ? 'text-[#8b7cf6]'
                            : isUsed
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-rose-600 dark:text-rose-400'
                        } />
                      </div>
                      <div>
                        <h4 className="font-mono font-bold text-[var(--foreground)] text-lg">
                          {coupon.code || coupon.couponCode}
                        </h4>
                        <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                          Скидка: <span className="font-semibold text-[var(--foreground)]">
                            {(coupon.type || coupon.couponType) === 'percent'
                              ? `${coupon.discount || coupon.couponDiscount}%`
                              : `${coupon.discount || coupon.couponDiscount} ₽`}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      isActive && fromShop
                        ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30'
                        : isActive
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : isUsed
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                    }`}>
                      {isActive && fromShop ? 'Из магазина' : isActive ? 'Активен' : isUsed ? 'Использован' : 'Истёк'}
                    </span>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {fromShop ? (
                      <div className="bg-amber-50/70 dark:bg-amber-950/30 rounded-lg p-3 border border-amber-100 dark:border-amber-900/50">
                        <p className="text-xs text-amber-700 dark:text-amber-300 mb-1 flex items-center gap-1">
                          <Coins size={12} />
                          Куплен за
                        </p>
                        <p className="text-lg font-bold text-amber-700 dark:text-amber-300">
                          {(coupon.coinsSpent || 0).toLocaleString('ru-RU')} монет
                        </p>
                      </div>
                    ) : (
                      <div className="bg-[var(--fc-surface-elevated)] border border-[var(--fc-glass-border)] rounded-xl p-3">
                        <p className="text-xs text-[var(--text-secondary)] mb-1">Сэкономлено</p>
                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          {coupon.discountAmount ? parseFloat(coupon.discountAmount).toLocaleString('ru-RU') : '0'} ₽
                        </p>
                      </div>
                    )}
                    <div className="bg-[var(--fc-surface-elevated)] border border-[var(--fc-glass-border)] rounded-xl p-3">
                      <p className="text-xs text-[var(--text-secondary)] mb-1 flex items-center gap-1">
                        <Clock size={12} />
                        {isUsed ? 'Использован' : 'Действует до'}
                      </p>
                      <p className="text-sm font-semibold text-[var(--foreground)]">
                        {(() => {
                          const d = isUsed
                            ? coupon.usedAt
                            : (coupon.expiresAt || coupon.couponExpiresAt);
                          return d ? new Date(d).toLocaleDateString('ru-RU') : '—';
                        })()}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {isActive && (
                      <Button
                        variant="primary"
                        size="sm"
                        fullWidth
                        icon={<Copy size={16} />}
                        onClick={() => copyToClipboard(coupon.code || coupon.couponCode || '')}
                        className={fromShop ? 'shadow-amber-500/30' : ''}
                        {...(fromShop
                          ? { style: { backgroundImage: 'linear-gradient(135deg, #f59e0b, #f97316)' } }
                          : {})}
                      >
                        Копировать код
                      </Button>
                    )}
                    {coupon.orderId && (
                      <Button
                        variant="outline"
                        size="sm"
                        fullWidth
                        icon={<ShoppingBag size={16} />}
                        href={`/orders/${coupon.orderId}`}
                      >
                        К заказу
                      </Button>
                    )}
                    {/* Delete button - only for used coupons */}
                    {isUsed && (
                      <Button
                        variant="danger"
                        size="sm"
                        icon={<Trash2 size={18} />}
                        onClick={() => deleteCoupon(coupon.id, coupon.code || coupon.couponCode || '')}
                        title="Удалить запись об использовании"
                      />
                    )}
                  </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
