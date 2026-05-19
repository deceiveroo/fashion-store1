'use client';

import { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, ToggleLeft, ToggleRight, AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  targetAudience: string;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    targetAudience: 'all',
    expiresAt: '',
  });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/admin/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Не удалось загрузить уведомления');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success('Уведомление создано');
        setShowForm(false);
        setFormData({
          title: '',
          message: '',
          type: 'info',
          targetAudience: 'all',
          expiresAt: '',
        });
        fetchNotifications();
      } else {
        toast.error('Ошибка при создании');
      }
    } catch (error) {
      console.error('Error creating notification:', error);
      toast.error('Ошибка при создании');
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (res.ok) {
        toast.success(currentStatus ? 'Уведомление деактивировано' : 'Уведомление активировано');
        fetchNotifications();
      }
    } catch (error) {
      toast.error('Ошибка при обновлении');
    }
  };

  const deleteNotification = async (id: string) => {
    if (!confirm('Удалить это уведомление?')) return;

    try {
      const res = await fetch(`/api/admin/notifications/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Уведомление удалено');
        fetchNotifications();
      }
    } catch (error) {
      toast.error('Ошибка при удалении');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-red-500" />;
      default: return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getAudienceLabel = (audience: string) => {
    const labels: Record<string, string> = {
      all: '🌍 Все пользователи',
      registered: '👥 Зарегистрированные',
      admins: '👑 Администраторы',
      specific: '🎯 Конкретные пользователи',
    };
    return labels[audience] || audience;
  };

  if (loading) {
    return <div className="p-8 text-center">Загрузка...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Bell className="h-8 w-8" />
            Системные уведомления
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Отправляйте уведомления всем пользователям или特定ным группам
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Новое уведомление
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Создать уведомление</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Заголовок</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                placeholder="Например: Технические работы"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Сообщение</label>
              <textarea
                required
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                placeholder="Текст уведомления..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Тип</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="info">ℹ️ Информация</option>
                  <option value="success">✅ Успех</option>
                  <option value="warning">⚠️ Предупреждение</option>
                  <option value="error">❌ Ошибка</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Аудитория</label>
                <select
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="all">Все пользователи</option>
                  <option value="registered">Зарегистрированные</option>
                  <option value="admins">Администраторы</option>
                  <option value="specific">Конкретные пользователи</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Срок действия (необязательно)
              </label>
              <input
                type="datetime-local"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Отправить уведомление
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Отмена
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Bell className="mx-auto h-12 w-12 opacity-20 mb-4" />
            <p>Нет уведомлений</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-6 bg-white dark:bg-gray-800 rounded-xl border-l-4 ${
                notification.isActive ? 'border-purple-500' : 'border-gray-300 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getTypeIcon(notification.type)}
                    <h3 className="text-lg font-semibold">{notification.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded ${
                      notification.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {notification.isActive ? 'Активно' : 'Неактивно'}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-3">{notification.message}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{getAudienceLabel(notification.targetAudience)}</span>
                    <span>•</span>
                    <span>{new Date(notification.createdAt).toLocaleDateString('ru-RU')}</span>
                    {notification.expiresAt && (
                      <>
                        <span>•</span>
                        <span>До {new Date(notification.expiresAt).toLocaleDateString('ru-RU')}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => toggleActive(notification.id, notification.isActive)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    {notification.isActive ? (
                      <ToggleRight className="h-6 w-6 text-green-500" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 rounded"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
