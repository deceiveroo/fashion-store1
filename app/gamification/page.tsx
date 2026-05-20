'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import GamificationDashboard from '@/components/gamification/GamificationDashboard';
import AchievementNotification from '@/components/gamification/AchievementNotification';

export default function GamificationPage() {
  const { user, isLoading } = useAuth();
  const [testing, setTesting] = useState(false);
  
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
      alert('❌ Только для администраторов!');
      return;
    }
    
    if (!confirm('Повысить уровень на 1 для тестирования?')) return;
    
    setTesting(true);
    try {
      const res = await fetch('/api/gamification/test-levelup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'levelup', levelsToAdd: 1 }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Ошибка');
        return;
      }

      alert(`✅ Уровень повышен!\n\n${data.message}\nXP начислено: ${data.xpAwarded}\n\nПроверьте модальное окно и колокольчик!`);
      
      // Reload page to refresh data
      window.location.reload();
    } catch (error) {
      console.error('Error:', error);
      alert('Ошибка сети');
    } finally {
      setTesting(false);
    }
  };

  const handleResetLevel = async () => {
    console.log('[TEST] Reset button clicked');
    console.log('[TEST] Is admin:', isAdmin);
    
    if (!isAdmin) {
      alert('❌ Только для администраторов!');
      return;
    }
    
    if (!confirm('Сбросить уровень до 1? Все монеты и прогресс будут потеряны!')) return;
    
    setTesting(true);
    try {
      const res = await fetch('/api/gamification/test-levelup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Ошибка');
        return;
      }

      alert('✅ Уровень сброшен до 1!');
      window.location.reload();
    } catch (error) {
      console.error('Error:', error);
      alert('Ошибка сети');
    } finally {
      setTesting(false);
    }
  };

  const handleResetAchievements = async () => {
    console.log('[TEST] Reset achievements button clicked');
    console.log('[TEST] Is admin:', isAdmin);
    
    if (!isAdmin) {
      alert('❌ Только для администраторов!');
      return;
    }
    
    if (!confirm('Сбросить ВСЕ достижения? Прогресс достижений будет потерян!')) return;
    
    setTesting(true);
    try {
      const res = await fetch('/api/gamification/reset-achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Ошибка');
        return;
      }

      alert(`✅ Достижения сброшены!\n\n${data.message}`);
      window.location.reload();
    } catch (error) {
      console.error('Error:', error);
      alert('Ошибка сети');
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
    </div>
  );
}
