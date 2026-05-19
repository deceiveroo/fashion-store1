'use client';

import { useState, useEffect } from 'react';
import { Search, MessageSquare, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface ChatSession {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  status: 'active' | 'closed' | 'pending';
  rating?: number;
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
}

export default function SupportChatsPage() {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [filteredChats, setFilteredChats] = useState<ChatSession[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    filterChats();
  }, [chats, search, statusFilter]);

  const loadChats = async () => {
    try {
      const res = await fetch('/api/admin/support-chats?limit=200', {
        credentials: 'include',
      });
      
      if (!res.ok) {
        toast.error('Не удалось загрузить чаты');
        return;
      }
      
      const data = await res.json();
      const chatsList = Array.isArray(data) ? data : (data.sessions || []);
      setChats(chatsList);
    } catch (error) {
      console.error('Error loading chats:', error);
      toast.error('Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  const filterChats = () => {
    let filtered = chats;

    // Фильтр по статусу
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    // Поиск
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(c => 
        (c.userName || '').toLowerCase().includes(q) ||
        (c.userEmail || '').toLowerCase().includes(q) ||
        (c.lastMessage || '').toLowerCase().includes(q)
      );
    }

    setFilteredChats(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700';
      case 'closed': return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700';
      case 'pending': return 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Clock className="h-4 w-4" />;
      case 'closed': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <XCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Чаты поддержки</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Управление обращениями клиентов</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск по имени, email или сообщению..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex gap-2">
          {(['all', 'active', 'closed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                statusFilter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {status === 'all' ? 'Все' : status === 'active' ? 'Активные' : 'Закрытые'}
            </button>
          ))}
        </div>
      </div>

      {/* Chats List */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <MessageSquare className="h-12 w-12 mb-3 opacity-40" />
            <p className="text-sm">Чаты не найдены</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {filteredChats.map((chat) => (
              <div key={chat.id} className="p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {chat.userName || 'Анонимный пользователь'}
                      </h3>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(chat.status)}`}>
                        {getStatusIcon(chat.status)}
                        {chat.status === 'active' ? 'Активен' : chat.status === 'closed' ? 'Закрыт' : 'Ожидание'}
                      </span>
                    </div>
                    
                    {chat.userEmail && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{chat.userEmail}</p>
                    )}
                    
                    {chat.lastMessage && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-2">
                        {chat.lastMessage}
                      </p>
                    )}
                    
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Создан: {new Date(chat.createdAt).toLocaleString('ru-RU')}
                    </p>
                  </div>
                  
                  <a
                    href={`/admin/support-chats?id=${chat.id}`}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    <Eye className="h-4 w-4" />
                    Просмотр
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats Summary */}
      {!loading && (
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <p>Всего чатов: {filteredChats.length}</p>
          <p>Активных: {chats.filter(c => c.status === 'active').length}</p>
        </div>
      )}
    </div>
  );
}
