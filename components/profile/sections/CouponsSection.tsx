'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, Clock, Copy, CheckCircle2, XCircle, AlertCircle, TrendingUp, ShoppingBag } from 'lucide-react';
import { UserCoupon } from '@/app/profile/hooks/useProfileData';
import { Loader } from 'lucide-react';
import { toast } from 'sonner';

interface CouponsSectionProps {
  coupons: UserCoupon[];
  isLoadingData: boolean;
}

type TabType = 'all' | 'active' | 'used' | 'expired';

export default function CouponsSection({ coupons, isLoadingData }: CouponsSectionProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [stats, setStats] = useState({
    totalSavings: 0,
    usedCount: 0,
    activeCount: 0,
    expiredCount: 0,
  });

  // Calculate stats
  useEffect(() => {
    const totalSavings = coupons.reduce((sum, c) => sum + parseFloat(c.discountAmount || '0'), 0);
    const usedCount = coupons.filter(c => !c.isValid).length;
    const activeCount = coupons.filter(c => c.isValid && !c.isExpired).length;
    const expiredCount = coupons.filter(c => c.isExpired).length;
    
    setStats({ totalSavings, usedCount, activeCount, expiredCount });
  }, [coupons]);

  // Filter coupons based on active tab
  const filteredCoupons = coupons.filter(coupon => {
    switch (activeTab) {
      case 'active':
        return coupon.isValid && !coupon.isExpired;
      case 'used':
        return !coupon.isValid;
      case 'expired':
        return coupon.isExpired;
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
      {/* Stats Cards - Cyber Glassmorphism */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl p-4 border"
          style={{
            background: 'linear-gradient(135deg, rgba(108,92,231,0.1), rgba(0,210,255,0.1))',
            borderColor: 'rgba(108,92,231,0.3)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500">
              <TrendingUp size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Всего сэкономлено</p>
              <p className="text-2xl font-black text-white" style={{ textShadow: '0 0 10px rgba(108,92,231,0.5)' }}>
                {stats.totalSavings.toLocaleString('ru-RU')} ₽
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-2xl p-4 border"
          style={{
            background: 'linear-gradient(135deg, rgba(0,255,136,0.1), rgba(0,210,255,0.1))',
            borderColor: 'rgba(0,255,136,0.3)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-cyan-500">
              <CheckCircle2 size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Активных</p>
              <p className="text-2xl font-black text-white" style={{ textShadow: '0 0 10px rgba(0,255,136,0.5)' }}>
                {stats.activeCount}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative overflow-hidden rounded-2xl p-4 border"
          style={{
            background: 'linear-gradient(135deg, rgba(255,107,157,0.1), rgba(255,215,0,0.1))',
            borderColor: 'rgba(255,107,157,0.3)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500 to-yellow-500">
              <ShoppingBag size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Использовано</p>
              <p className="text-2xl font-black text-white" style={{ textShadow: '0 0 10px rgba(255,107,157,0.5)' }}>
                {stats.usedCount}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative overflow-hidden rounded-2xl p-4 border"
          style={{
            background: 'linear-gradient(135deg, rgba(255,0,0,0.1), rgba(255,107,157,0.1))',
            borderColor: 'rgba(255,0,0,0.3)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-red-500 to-pink-500">
              <XCircle size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Истекло</p>
              <p className="text-2xl font-black text-white" style={{ textShadow: '0 0 10px rgba(255,0,0,0.5)' }}>
                {stats.expiredCount}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs - Cyber Glassmorphism */}
      <div className="flex gap-2 p-2 rounded-2xl"
           style={{
             background: 'rgba(255,255,255,0.05)',
             border: '1px solid rgba(255,255,255,0.1)',
             backdropFilter: 'blur(20px)'
           }}>
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
            className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all relative overflow-hidden ${
              activeTab === tab.id ? 'text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            style={{
              background: activeTab === tab.id
                ? 'linear-gradient(135deg, #6C5CE7, #00D2FF)'
                : 'transparent',
              boxShadow: activeTab === tab.id
                ? '0 0 20px rgba(108,92,231,0.5), inset 0 0 10px rgba(255,255,255,0.2)'
                : 'none',
              border: activeTab === tab.id
                ? '1px solid rgba(255,255,255,0.3)'
                : '1px solid transparent'
            }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {tab.label}
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === tab.id
                  ? 'bg-white/20'
                  : 'bg-gray-200 dark:bg-gray-700'
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
                  whileHover={{ y: -4, scale: 1.01 }}
                  className="relative overflow-hidden rounded-2xl p-6 border-2 group"
                  style={{
                    background: isUsed
                      ? 'linear-gradient(135deg, rgba(0,255,136,0.05), rgba(0,210,255,0.05))'
                      : isExpired
                      ? 'linear-gradient(135deg, rgba(255,0,0,0.05), rgba(255,107,157,0.05))'
                      : 'linear-gradient(135deg, rgba(108,92,231,0.1), rgba(0,210,255,0.1))',
                    borderColor: isUsed
                      ? 'rgba(0,255,136,0.3)'
                      : isExpired
                      ? 'rgba(255,0,0,0.3)'
                      : 'rgba(108,92,231,0.3)',
                    boxShadow: isActive
                      ? '0 0 30px rgba(108,92,231,0.2)'
                      : 'none',
                    backdropFilter: 'blur(20px)'
                  }}
                >
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                        isActive
                          ? 'text-white'
                          : isUsed
                          ? 'text-white'
                          : 'text-white'
                      }`}
                      style={{
                        background: isActive
                          ? 'linear-gradient(135deg, #00FF88, #00D2FF)'
                          : isUsed
                          ? 'linear-gradient(135deg, #6C5CE7, #00D2FF)'
                          : 'linear-gradient(135deg, #FF0000, #FF6B9D)',
                        boxShadow: isActive
                          ? '0 0 20px rgba(0,255,136,0.5)'
                          : isUsed
                          ? '0 0 20px rgba(108,92,231,0.5)'
                          : '0 0 20px rgba(255,0,0,0.5)'
                      }}
                    >
                      {isActive && <CheckCircle2 size={14} />}
                      {isUsed && <ShoppingBag size={14} />}
                      {isExpired && <XCircle size={14} />}
                      {isActive ? 'Активен' : isUsed ? 'Использован' : 'Истёк'}
                    </motion.div>
                  </div>

                  {/* Coupon Code & Discount */}
                  <div className="mb-4 pr-32">
                    <div className="flex items-center gap-3 mb-2">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="p-3 rounded-xl"
                        style={{
                          background: isActive
                            ? 'linear-gradient(135deg, rgba(108,92,231,0.2), rgba(0,210,255,0.2))'
                            : 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)'
                        }}
                      >
                        <Ticket size={24} className={isActive ? 'text-purple-400' : 'text-gray-400'} />
                      </motion.div>
                      <div>
                        <h4 className="font-black text-white text-xl font-mono tracking-wider"
                            style={{ textShadow: isActive ? '0 0 20px rgba(108,92,231,0.5)' : 'none' }}>
                          {coupon.couponCode}
                        </h4>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Скидка: <span className="font-bold text-white">
                            {coupon.couponType === 'percent' ? `${coupon.couponDiscount}%` : `${coupon.couponDiscount} ₽`}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Savings & Date */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 rounded-xl"
                         style={{
                           background: 'rgba(255,255,255,0.05)',
                           border: '1px solid rgba(255,255,255,0.1)'
                         }}>
                      <p className="text-xs text-gray-400 mb-1 font-medium">Сэкономлено</p>
                      <p className="text-lg font-black text-green-400" style={{ textShadow: '0 0 10px rgba(0,255,136,0.5)' }}>
                        {parseFloat(coupon.discountAmount).toLocaleString('ru-RU')} ₽
                      </p>
                    </div>
                    <div className="p-3 rounded-xl"
                         style={{
                           background: 'rgba(255,255,255,0.05)',
                           border: '1px solid rgba(255,255,255,0.1)'
                         }}>
                      <p className="text-xs text-gray-400 mb-1 font-medium flex items-center gap-1">
                        <Clock size={12} />
                        {isUsed ? 'Использован' : 'Действует до'}
                      </p>
                      <p className="text-sm font-bold text-white">
                        {new Date(isUsed ? coupon.usedAt : (coupon.couponExpiresAt || coupon.usedAt)).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {isActive && (
                      <motion.button
                        onClick={() => copyToClipboard(coupon.couponCode)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                        style={{
                          background: 'linear-gradient(135deg, #6C5CE7, #00D2FF)',
                          color: '#fff',
                          boxShadow: '0 0 20px rgba(108,92,231,0.5)',
                          border: '1px solid rgba(255,255,255,0.2)'
                        }}
                      >
                        <Copy size={16} />
                        Копировать код
                      </motion.button>
                    )}
                    {coupon.orderId && (
                      <a
                        href={`/orders/${coupon.orderId}`}
                        className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-center"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          color: '#fff',
                          border: '1px solid rgba(255,255,255,0.2)'
                        }}
                      >
                        <ShoppingBag size={16} />
                        К заказу
                      </a>
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
