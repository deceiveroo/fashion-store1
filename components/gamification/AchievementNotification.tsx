'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Gift, Sparkles, Crown, X, CheckCircle } from 'lucide-react';

interface LevelUpNotification {
  type: 'level_up' | 'coupon_reward' | 'achievement';
  level?: number;
  title?: string;
  message?: string;
  couponCode?: string;
  discount?: number;
  discountType?: string;
  coinsAwarded?: number;
}

export default function AchievementNotification() {
  const [notification, setNotification] = useState<LevelUpNotification | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Listen for custom achievement events
    const handleAchievement = (event: CustomEvent<LevelUpNotification>) => {
      setNotification(event.detail);
      setIsVisible(true);
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    };

    window.addEventListener('achievement-notification' as any, handleAchievement as any);

    return () => {
      window.removeEventListener('achievement-notification' as any, handleAchievement as any);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
  };

  const getIcon = () => {
    if (!notification) return null;

    switch (notification.type) {
      case 'level_up':
        return (
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
            <Crown className="w-8 h-8 text-white" />
          </div>
        );
      case 'coupon_reward':
        return (
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg">
            <Gift className="w-8 h-8 text-white" />
          </div>
        );
      case 'achievement':
        return (
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
            <Trophy className="w-8 h-8 text-white" />
          </div>
        );
      default:
        return null;
    }
  };

  const getTitle = () => {
    if (!notification) return '';

    switch (notification.type) {
      case 'level_up':
        return `🎉 Уровень ${notification.level} достигнут!`;
      case 'coupon_reward':
        return '🎁 Новый промокод получен!';
      case 'achievement':
        return notification.title || '🏆 Достижение разблокировано!';
      default:
        return '';
    }
  };

  const getMessage = () => {
    if (!notification) return '';

    switch (notification.type) {
      case 'level_up':
        return (
          <>
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              Поздравляем! Вы достигли нового уровня и получили{' '}
              <span className="font-bold text-yellow-600 dark:text-yellow-400">
                {notification.coinsAwarded} монет 💰
              </span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Продолжайте в том же духе!
            </p>
          </>
        );
      case 'coupon_reward':
        return (
          <>
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              За достижение уровня вам вручен эксклюзивный промокод:
            </p>
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl p-4 border-2 border-purple-300 dark:border-purple-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Ваш промокод:</p>
                  <p className="font-mono font-bold text-xl text-purple-700 dark:text-purple-400">
                    {notification.couponCode}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-purple-600 dark:text-purple-400">
                    {notification.discount}
                    {notification.discountType === 'percent' ? '%' : '₽'}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">скидка</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
              Используйте при оформлении заказа
            </p>
          </>
        );
      case 'achievement':
        return (
          <>
            <p className="text-gray-700 dark:text-gray-300">{notification.message}</p>
            {(notification.coinsAwarded ?? 0) > 0 && (
              <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2 font-medium">
                +{notification.coinsAwarded} монет 💰
              </p>
            )}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isVisible && notification && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[69]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl z-[70] px-4"
          >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-900/10 dark:to-pink-900/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getIcon()}
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                        {getTitle()}
                      </h2>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-8">
                <div className="text-center">
                  {getMessage()}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-center">
                <button
                  onClick={handleClose}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Отлично!
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Helper function to trigger notifications
export function showLevelUpNotification(level: number, coinsAwarded: number) {
  const event = new CustomEvent('achievement-notification', {
    detail: {
      type: 'level_up',
      level,
      coinsAwarded,
    } as LevelUpNotification,
  });
  window.dispatchEvent(event);
}

export function showCouponRewardNotification(
  couponCode: string,
  discount: number,
  discountType: string
) {
  const event = new CustomEvent('achievement-notification', {
    detail: {
      type: 'coupon_reward',
      couponCode,
      discount,
      discountType,
    } as LevelUpNotification,
  });
  window.dispatchEvent(event);
}

export function showAchievementNotification(
  title: string,
  message: string,
  coinsAwarded?: number
) {
  const event = new CustomEvent('achievement-notification', {
    detail: {
      type: 'achievement',
      title,
      message,
      coinsAwarded,
    } as LevelUpNotification,
  });
  window.dispatchEvent(event);
}
