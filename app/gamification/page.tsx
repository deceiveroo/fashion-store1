'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import GamificationDashboard from '@/components/gamification/GamificationDashboard';
import AchievementNotification from '@/components/gamification/AchievementNotification';

export default function GamificationPage() {
  const { user } = useAuth();
  const [testing, setTesting] = useState(false);
  
  const isAdmin = user?.role === 'admin';

  const handleTestLevelUp = async () => {
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
            {isAdmin && (
              <div className="mt-6 flex gap-3 justify-center">
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
              </div>
            )}
            {isAdmin && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                🔒 Только для администраторов
              </p>
            )}
          </div>

          <GamificationDashboard isAdmin={isAdmin} />
        </div>
      </div>
    </div>
  );
}
