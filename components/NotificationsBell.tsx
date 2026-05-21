'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  createdAt: string;
  expiresAt?: string;
  isRead: boolean;
  targetAudience?: 'all' | 'registered' | 'admins' | 'specific';
}

export default function NotificationsBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications', {
        credentials: 'include',
      });
      
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        credentials: 'include',
      });

      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
      
      await Promise.all(
        unreadIds.map(id =>
          fetch(`/api/notifications/${id}/read`, {
            method: 'POST',
            credentials: 'include',
          })
        )
      );

      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('Все уведомления отмечены как прочитанные');
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-l-green-500 bg-green-50 dark:bg-green-950/20';
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20';
      case 'error':
        return 'border-l-red-500 bg-red-50 dark:bg-red-950/20';
      default:
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays < 7) return `${diffDays} д назад`;
    return date.toLocaleDateString('ru-RU');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
        aria-label="Уведомления"
      >
        <Bell className="h-4 w-4" />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-3 w-96 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl z-50 overflow-hidden"
          >
            {/* Header - Gradient Background */}
            <div className="relative px-5 py-4 bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-orange-900/20 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <Bell className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      Уведомления
                    </h3>
                    {unreadCount > 0 && (
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                        {unreadCount} непрочитанных
                      </p>
                    )}
                  </div>
                </div>
                
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all active:scale-95"
                  >
                    Прочитать все
                  </button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-[28rem] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
              {loading ? (
                <div className="py-12 text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="inline-block h-8 w-8 rounded-full border-4 border-purple-600 border-t-transparent"
                  />
                  <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Загрузка...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 flex items-center justify-center">
                    <Bell className="h-10 w-10 text-purple-400 dark:text-purple-500" />
                  </div>
                  <p className="text-gray-900 dark:text-white font-semibold text-lg">Нет уведомлений</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Все прочитано ✓</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 border-l-4 ${getTypeColor(notification.type)} ${
                        !notification.isRead ? 'bg-opacity-50' : ''
                      }`}
                      onClick={() => !notification.isRead && markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              {/* Type Badge */}
                              {notification.targetAudience === 'specific' && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 mb-1">
                                  Персональное
                                </span>
                              )}
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {notification.title}
                              </h4>
                            </div>
                            {!notification.isRead && (
                              <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500" />
                            )}
                          </div>
                          <p className="mt-1 text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="mt-2 text-[10px] text-gray-400 dark:text-gray-500">
                            {formatDate(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
