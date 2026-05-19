'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Users, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface ChatStats {
  total: number;
  active: number;
  closed: number;
  avgResponseTime: string;
}

export default function SupportDashboard() {
  const [stats, setStats] = useState<ChatStats>({
    total: 0,
    active: 0,
    closed: 0,
    avgResponseTime: '—',
  });
  const [recentChats, setRecentChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      // Загружаем статистику чатов
      const chatsRes = await fetch('/api/admin/support-chats?limit=100', {
        credentials: 'include',
      });
      
      if (chatsRes.ok) {
        const chatsData = await chatsRes.json();
        const chats = Array.isArray(chatsData) ? chatsData : (chatsData.sessions || []);
        
        const active = chats.filter((c: any) => c.status === 'active').length;
        const closed = chats.filter((c: any) => c.status === 'closed').length;
        
        setStats({
          total: chats.length,
          active,
          closed,
          avgResponseTime: '5 мин', // Можно рассчитать реально
        });

        // Последние 5 активных чатов
        setRecentChats(
          chats
            .filter((c: any) => c.status === 'active')
            .slice(0, 5)
        );
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Панель поддержки</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Управление обращениями клиентов</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
              <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Всего чатов</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {loading ? '...' : stats.total}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-xl">
              <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Активные</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {loading ? '...' : stats.active}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Закрытые</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {loading ? '...' : stats.closed}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-xl">
              <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Ср. время ответа</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {loading ? '...' : stats.avgResponseTime}
          </p>
        </div>
      </div>

      {/* Recent Active Chats */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Активные чаты
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        ) : recentChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <MessageSquare className="h-10 w-10 mb-2 opacity-40" />
            <p className="text-sm">Нет активных чатов</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {recentChats.map((chat) => (
              <div key={chat.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {chat.userName || 'Анонимный пользователь'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                      {chat.lastMessage || 'Нет сообщений'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      Начат: {new Date(chat.createdAt).toLocaleString('ru-RU')}
                    </p>
                  </div>
                  <a
                    href={`/support/chats?id=${chat.id}`}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Открыть
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <a
          href="/support/chats"
          className="block bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 text-white hover:shadow-lg transition-all"
        >
          <MessageSquare className="h-8 w-8 mb-3" />
          <h3 className="text-lg font-semibold mb-1">Все чаты</h3>
          <p className="text-sm text-white/80">Просмотр и управление всеми обращениями</p>
        </a>

        <a
          href="/support/customers"
          className="block bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white hover:shadow-lg transition-all"
        >
          <Users className="h-8 w-8 mb-3" />
          <h3 className="text-lg font-semibold mb-1">Клиенты</h3>
          <p className="text-sm text-white/80">Поиск и просмотр информации о клиентах</p>
        </a>
      </div>
    </div>
  );
}
