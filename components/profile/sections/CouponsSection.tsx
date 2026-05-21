'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, Clock, Copy, CheckCircle2, XCircle, AlertCircle, TrendingUp, ShoppingBag, Trash2 } from 'lucide-react';
import { UserCoupon } from '@/app/profile/hooks/useProfileData';
import { Loader } from 'lucide-react';
import { toast } from 'sonner';

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
        <Loader className="animate-spin mx-auto text-purple-600 mb-4" size={48} />
        <p className="text-gray-600 dark:text-gray-400">Загрузка промокодов...</p>
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
          className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center"
        >
          <Ticket size={48} className="text-purple-600 dark:text-purple-400" />
        </motion.div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">У вас пока нет промокодов</h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
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
          className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <TrendingUp size={18} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Сэкономлено</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {stats.totalSavings.toLocaleString('ru-RU')} ₽
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 size={18} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Активных</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {stats.activeCount}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <ShoppingBag size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Использовано</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {stats.usedCount}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
              <XCircle size={18} className="text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Истекло</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {stats.expiredCount}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs - Clean Design */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
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
            className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
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
              <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Нет промокодов в этой категории</p>
            </div>
          ) : (
            filteredCoupons.map((coupon, index) => {
              const isUsed = !coupon.isValid;
              const isExpired = coupon.isExpired;
              const isActive = coupon.isValid && !isExpired;
              
              return (
                <motion.div
                  key={coupon.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-all"
                >
                  {/* Header with Status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg ${
                        isActive
                          ? 'bg-purple-100 dark:bg-purple-900/30'
                          : isUsed
                          ? 'bg-blue-100 dark:bg-blue-900/30'
                          : 'bg-red-100 dark:bg-red-900/30'
                      }`}>
                        <Ticket size={20} className={
                          isActive
                            ? 'text-purple-600 dark:text-purple-400'
                            : isUsed
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-red-600 dark:text-red-400'
                        } />
                      </div>
                      <div>
                        <h4 className="font-mono font-bold text-gray-900 dark:text-white text-lg">
                          {coupon.code || coupon.couponCode}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          Скидка: <span className="font-semibold text-gray-900 dark:text-white">
                            {(coupon.type || coupon.couponType) === 'percent' 
                              ? `${coupon.discount || coupon.couponDiscount}%` 
                              : `${coupon.discount || coupon.couponDiscount} ₽`}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      isActive
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : isUsed
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {isActive ? 'Активен' : isUsed ? 'Использован' : 'Истёк'}
                    </span>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Сэкономлено</p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        {coupon.discountAmount ? parseFloat(coupon.discountAmount).toLocaleString('ru-RU') : '0'} ₽
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                        <Clock size={12} />
                        {isUsed ? 'Использован' : 'Действует до'}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {new Date(isUsed ? (coupon.usedAt || '') : (coupon.expiresAt || coupon.couponExpiresAt || '')).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {isActive && (
                      <motion.button
                        onClick={() => copyToClipboard(coupon.code || coupon.couponCode || '')}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                      >
                        <Copy size={16} />
                        Копировать код
                      </motion.button>
                    )}
                    {coupon.orderId && (
                      <a
                        href={`/orders/${coupon.orderId}`}
                        className="flex-1 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 text-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
                      >
                        <ShoppingBag size={16} />
                        К заказу
                      </a>
                    )}
                    {/* Delete button - only for used coupons */}
                    {isUsed && (
                      <motion.button
                        onClick={() => deleteCoupon(coupon.id, coupon.code || coupon.couponCode || '')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                        title="Удалить запись об использовании"
                      >
                        <Trash2 size={18} />
                      </motion.button>
                    )}
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
