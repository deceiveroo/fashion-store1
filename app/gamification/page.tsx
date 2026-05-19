'use client';

import { useState } from 'react';
import GamificationDashboard from '@/components/gamification/GamificationDashboard';
import { toast } from 'sonner';

export default function GamificationPage() {
  const [showDebug, setShowDebug] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchDebug = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/gamification/debug', {
        credentials: 'include',
      });
      const data = await res.json();
      setDebugData(data);
      setShowDebug(true);
      console.log('🔍 Debug data:', data);
    } catch (error) {
      toast.error('Failed to fetch debug data');
      console.error(error);
    } finally {
      setLoading(false);
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
            
            {/* Debug Button */}
            <button
              onClick={fetchDebug}
              disabled={loading}
              className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Загрузка...' : '🔍 Проверить уровень и XP'}
            </button>
          </div>

          {/* Debug Panel */}
          {showDebug && debugData && (
            <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">📊 Статистика уровня</h2>
              
              {debugData.userLevel ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Уровень</div>
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{debugData.userLevel.level}</div>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Текущий XP</div>
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{debugData.userLevel.xp}</div>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400">До следующего</div>
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">{debugData.userLevel.xp_to_next_level}</div>
                  </div>
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Монеты</div>
                    <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{debugData.userLevel.coins}</div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
                  ⚠️ Таблица user_levels не найдена! Выполните SQL миграцию.
                </div>
              )}

              <div className="mb-4">
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Всего заработано XP: {debugData.totalXPEarned || 0}</h3>
              </div>

              {debugData.xpHistory && debugData.xpHistory.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">История XP (последние 20):</h3>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {debugData.xpHistory.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{item.reason}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(item.created_at).toLocaleString('ru-RU')}
                          </div>
                        </div>
                        <div className={`font-bold ${item.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.amount > 0 ? '+' : ''}{item.amount} XP
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {debugData.achievements && debugData.achievements.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Разблокированные достижения:</h3>
                  <div className="space-y-2">
                    {debugData.achievements.map((ach: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{ach.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(ach.unlocked_at).toLocaleString('ru-RU')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-purple-600 dark:text-purple-400">+{ach.xp_reward} XP</div>
                          <div className="text-sm font-bold text-yellow-600 dark:text-yellow-400">+{ach.coins_reward} монет</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <GamificationDashboard />
        </div>
      </div>
    </div>
  );
}
