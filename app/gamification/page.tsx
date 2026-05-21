'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import GamificationDashboard from '@/components/gamification/GamificationDashboard';
import AchievementNotification, { showLevelUpNotification, showCouponRewardNotification, showAchievementNotification } from '@/components/gamification/AchievementNotification';

export default function GamificationPage() {
  const { user, isLoading } = useAuth();
  const [testing, setTesting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState<{action: string, message: string} | null>(null);
  
  const isAdmin = user?.role === 'admin';

  // Debug log
  useEffect(() => {
    console.log('[Gamification Page] === DEBUG INFO ===');
    console.log('[Gamification Page] User:', user);
    console.log('[Gamification Page] Is Loading:', isLoading);
    console.log('[Gamification Page] User Role:', user?.role);
    console.log('[Gamification Page] Is Admin:', isAdmin);
    console.log('[Gamification Page] Buttons should show:', isAdmin && !isLoading);
    console.log('========================');
    
    // Auto-test if buttons are not showing
    if (!isLoading && !user) {
      console.warn('⚠️ WARNING: User is null - you might not be logged in!');
    } else if (!isLoading && user && !isAdmin) {
      console.warn(`⚠️ WARNING: User role is "${user?.role}" - not admin!`);
    }
  }, [user, isLoading, isAdmin]);

  const handleTestLevelUp = async () => {
    console.log('[TEST] Level up button clicked');
    console.log('[TEST] Is admin:', isAdmin);
    console.log('[TEST] User:', user);
    
    if (!isAdmin) {
      setShowConfirmModal({ action: 'error', message: '❌ Только для администраторов!' });
      return;
    }
    
    setShowConfirmModal({ 
      action: 'levelup', 
      message: '🧪 Повысить уровень на 1 для тестирования?\n\nВы получите XP, монеты и возможно промокод!' 
    });
  };

  const executeLevelUp = async () => {
    setShowConfirmModal(null);
    setTesting(true);
    try {
      const res = await fetch('/api/gamification/test-levelup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'levelup', levelsToAdd: 1 }),
      });

      const data = await res.json();

      if (!res.ok) {
        setShowConfirmModal({ action: 'error', message: data.error || 'Ошибка' });
        return;
      }

      // Show notifications BEFORE reload
      if (data.levelUpData) {
        const { newLevel, coinsAwarded, couponReward } = data.levelUpData;
        
        // Show level up notification
        showLevelUpNotification(newLevel, coinsAwarded);
        
        // Show coupon reward if exists
        if (couponReward) {
          setTimeout(() => {
            showCouponRewardNotification(
              couponReward.code,
              couponReward.discount,
              couponReward.discountType
            );
          }, 1500);
        }
      }

      setShowConfirmModal({ 
        action: 'success', 
        message: `✅ Уровень повышен!\n\n${data.message}\nXP начислено: ${data.xpAwarded}\n\nПроверьте модальное окно и колокольчик!` 
      });
      
      // Reload page to refresh data after 4 seconds (give time for notifications)
      setTimeout(() => window.location.reload(), 4000);
    } catch (error) {
      console.error('Error:', error);
      setShowConfirmModal({ action: 'error', message: 'Ошибка сети' });
    } finally {
      setTesting(false);
    }
  };

  const handleResetLevel = async () => {
    console.log('[TEST] Reset button clicked');
    console.log('[TEST] Is admin:', isAdmin);
    
    if (!isAdmin) {
      setShowConfirmModal({ action: 'error', message: '❌ Только для администраторов!' });
      return;
    }
    
    setShowConfirmModal({ 
      action: 'reset', 
      message: '⚠️ Сбросить уровень до 1?\n\nВсе монеты и прогресс будут потеряны! Это действие нельзя отменить.' 
    });
  };

  const executeReset = async () => {
    setShowConfirmModal(null);
    setTesting(true);
    try {
      const res = await fetch('/api/gamification/test-levelup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });

      const data = await res.json();

      if (!res.ok) {
        setShowConfirmModal({ action: 'error', message: data.error || 'Ошибка' });
        return;
      }

      setShowConfirmModal({ action: 'success', message: '✅ Уровень сброшен до 1!' });
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      console.error('Error:', error);
      setShowConfirmModal({ action: 'error', message: 'Ошибка сети' });
    } finally {
      setTesting(false);
    }
  };

  const handleResetAchievements = async () => {
    console.log('[TEST] Reset achievements button clicked');
    console.log('[TEST] Is admin:', isAdmin);
    
    if (!isAdmin) {
      setShowConfirmModal({ action: 'error', message: '❌ Только для администраторов!' });
      return;
    }
    
    setShowConfirmModal({ 
      action: 'reset_achievements', 
      message: '🗑️ Сбросить ВСЕ достижения?\n\nПрогресс достижений будет потерян! Вы сможете заработать их заново.' 
    });
  };

  const handleTestAchievement = async () => {
    console.log('[TEST] Test achievement button clicked');
    console.log('[TEST] Is admin:', isAdmin);
    
    if (!isAdmin) {
      setShowConfirmModal({ action: 'error', message: '❌ Только для администраторов!' });
      return;
    }
    
    setShowConfirmModal({ 
      action: 'test_achievement', 
      message: '🧪 Разблокировать тестовое достижение?\n\nВы получите XP и монеты за достижение "Первая покупка"' 
    });
  };

  const executeResetAchievements = async () => {
    setShowConfirmModal(null);
    setTesting(true);
    try {
      const res = await fetch('/api/gamification/reset-achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) {
        setShowConfirmModal({ action: 'error', message: data.error || 'Ошибка' });
        return;
      }

      setShowConfirmModal({ action: 'success', message: `✅ Достижения сброшены!\n\n${data.message}` });
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      console.error('Error:', error);
      setShowConfirmModal({ action: 'error', message: 'Ошибка сети' });
    } finally {
      setTesting(false);
    }
  };

  const executeTestAchievement = async () => {
    setShowConfirmModal(null);
    setTesting(true);
    try {
      const res = await fetch('/api/gamification/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ achievementCode: 'first_purchase' }),
      });

      const data = await res.json();

      if (!res.ok) {
        setShowConfirmModal({ action: 'error', message: data.error || 'Ошибка' });
        return;
      }

      // Show achievement notification
      if (data.achievement) {
        showAchievementNotification(
          `🏆 ${data.achievement.name}`,
          `Поздравляем! Вы получили достижение`,
          data.achievement.coins
        );
      }

      setShowConfirmModal({ 
        action: 'success', 
        message: `✅ Достижение разблокировано!\n\nXP: +${data.achievement.xp}\nМонеты: +${data.achievement.coins}\n\nПроверьте модальное окно и колокольчик!` 
      });
      
      // Reload page after 4 seconds
      setTimeout(() => window.location.reload(), 4000);
    } catch (error) {
      console.error('Error:', error);
      setShowConfirmModal({ action: 'error', message: 'Ошибка сети' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-pink-900/20 pt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-black text-gray-900 dark:text-white mb-4">
              🎮 Система достижений
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Зарабатывайте опыт, открывайте достижения и получайте награды!
            </p>
            
            {/* Admin Test Buttons */}
            {isLoading ? (
              <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Загрузка...</span>
                </div>
              </div>
            ) : !isAdmin ? (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  🔒 Кнопки тестирования доступны только администраторам
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
                  Текущая роль: {user?.role || 'не авторизован'}
                </p>
              </div>
            ) : (
              <div className="mt-6 flex gap-3 justify-center flex-wrap">
                <button
                  onClick={handleTestLevelUp}
                  disabled={testing}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {testing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Тестирование...
                    </>
                  ) : (
                    <>
                      🧪 Повысить уровень
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleTestAchievement}
                  disabled={testing}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {testing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Тестирование...
                    </>
                  ) : (
                    <>
                      🏆 Тест достижения
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleResetLevel}
                  disabled={testing}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {testing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Сброс...
                    </>
                  ) : (
                    <>
                      🔄 Сбросить уровень
                    </>
                  )}
                </button>

                <button
                  onClick={handleResetAchievements}
                  disabled={testing}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {testing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Сброс...
                    </>
                  ) : (
                    <>
                      🗑️ Сбросить достижения
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <GamificationDashboard isAdmin={isAdmin} />
        </div>
      </div>

      {/* Beautiful Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {showConfirmModal.action === 'error' ? '❌ Ошибка' :
                 showConfirmModal.action === 'success' ? '✅ Успех!' :
                 '⚠️ Подтверждение'}
              </h3>
              <button
                onClick={() => setShowConfirmModal(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Message */}
            <div className="mb-6 whitespace-pre-line text-gray-700 dark:text-gray-300 leading-relaxed">
              {showConfirmModal.message}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(null)}
                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-all"
              >
                Отмена
              </button>
              {(showConfirmModal.action === 'levelup' || showConfirmModal.action === 'reset' || showConfirmModal.action === 'reset_achievements' || showConfirmModal.action === 'test_achievement') && (
                <button
                  onClick={() => {
                    if (showConfirmModal.action === 'levelup') executeLevelUp();
                    else if (showConfirmModal.action === 'reset') executeReset();
                    else if (showConfirmModal.action === 'reset_achievements') executeResetAchievements();
                    else if (showConfirmModal.action === 'test_achievement') executeTestAchievement();
                  }}
                  disabled={testing}
                  className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    showConfirmModal.action === 'levelup'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
                      : showConfirmModal.action === 'reset'
                      ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white'
                      : 'bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white'
                  } disabled:opacity-50`}
                >
                  {testing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Выполняется...
                    </>
                  ) : (
                    'Подтвердить'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
