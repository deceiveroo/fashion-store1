'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  Edit2,
  Trash2,
  Eye,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Users,
  X,
  RefreshCw,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import AdminShell from '@/components/admin/AdminShell';

interface UserWithNotifications {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role: string;
  createdAt: string;
  notifications: Notification[];
  totalNotifications: number;
  unreadCount: number;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isActive: boolean;
  createdAt: string;
  readCount?: number;
  dismissCount?: number;
  isRead?: boolean; // Track if current user has read it
  isDismissed?: boolean; // Track if current user has dismissed it
}

interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isActive: boolean;
  createdAt: string;
  targetAudience: string;
  readCount?: number;
}

const TYPE_CONFIG = {
  info: { 
    label: 'Инфо', 
    icon: Info, 
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    gradient: 'from-blue-500 to-cyan-500',
  },
  success: { 
    label: 'Успех', 
    icon: CheckCircle, 
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    gradient: 'from-emerald-500 to-teal-500',
  },
  warning: { 
    label: 'Предупреждение', 
    icon: AlertTriangle, 
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    gradient: 'from-amber-500 to-orange-500',
  },
  error: { 
    label: 'Ошибка', 
    icon: XCircle, 
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    gradient: 'from-red-500 to-pink-500',
  },
};

export default function AdminNotificationsPage() {
  const [users, setUsers] = useState<UserWithNotifications[]>([]);
  const [systemNotifications, setSystemNotifications] = useState<SystemNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // State for editing notification
  const [editingNotification, setEditingNotification] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<{id: string; type: 'personal' | 'system'; userId?: string} | null>(null);
  
  // Form state for creating notifications
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning' | 'error',
    targetAudience: 'all' as 'all' | 'registered' | 'admins' | 'specific',
    targetUserIds: [] as string[],
  });

  // User search state
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{id: string; email: string; firstName?: string; lastName?: string; avatar?: string}>>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  // Load users with their notifications
  const loadData = async () => {
    setLoading(true);
    try {
      // Load users with personal notifications using new endpoint
      const usersRes = await fetch('/api/admin/notifications/users', {
        credentials: 'include',
      });
      
      if (!usersRes.ok) {
        toast.error('Не удалось загрузить пользователей');
        return;
      }

      const usersData = await usersRes.json();
      setUsers(usersData.users || []);

      // Load system notifications
      const sysNotifRes = await fetch('/api/admin/notifications?page=1&limit=100', {
        credentials: 'include',
      });
      
      let sysNotifications: SystemNotification[] = [];
      if (sysNotifRes.ok) {
        const sysData = await sysNotifRes.json();
        sysNotifications = (sysData.notifications || []).filter(
          (n: any) => n.targetAudience !== 'specific'
        );
      }

      setSystemNotifications(sysNotifications);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredUsers = users.filter(user => {
    const query = search.toLowerCase();
    const name = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
    return name.includes(query) || user.email.toLowerCase().includes(query);
  });

  const toggleUserExpand = (userId: string) => {
    setExpandedUserId(expandedUserId === userId ? null : userId);
  };

  const displayName = (user: UserWithNotifications) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email.split('@')[0];
  };

  // Search users for personal notifications
  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchingUsers(true);
    try {
      const res = await fetch(`/api/admin/customers?search=${encodeURIComponent(query)}&limit=10`, {
        credentials: 'include',
      });
      
      if (res.ok) {
        const data = await res.json();
        const customers = Array.isArray(data) ? data : (data.customers || []);
        setSearchResults(customers.map((c: any) => ({
          id: c.id,
          email: c.email,
          firstName: c.firstName,
          lastName: c.lastName,
          avatar: c.avatar || c.image,
        })));
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearchingUsers(false);
    }
  };

  // Load all users when switching to specific audience
  useEffect(() => {
    if (formData.targetAudience === 'specific') {
      // Load all users immediately (no search query)
      loadAllUsers();
    } else {
      setSearchResults([]);
    }
  }, [formData.targetAudience]);

  // Debounced user search for filtering
  useEffect(() => {
    const timer = setTimeout(() => {
      if (userSearch && formData.targetAudience === 'specific') {
        searchUsers(userSearch);
      } else if (formData.targetAudience === 'specific' && !userSearch) {
        // If no search text, reload all users
        loadAllUsers();
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [userSearch, formData.targetAudience]);

  // Load all users without search filter
  const loadAllUsers = async () => {
    setSearchingUsers(true);
    try {
      const res = await fetch('/api/admin/customers?limit=50', {
        credentials: 'include',
      });
      
      if (res.ok) {
        const data = await res.json();
        const customers = Array.isArray(data) ? data : (data.customers || []);
        setSearchResults(customers.map((c: any) => ({
          id: c.id,
          email: c.email,
          firstName: c.firstName,
          lastName: c.lastName,
          avatar: c.avatar || c.image,
        })));
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setSearchingUsers(false);
    }
  };

  const addUserToNotification = (userId: string) => {
    if (!formData.targetUserIds.includes(userId)) {
      setFormData({ ...formData, targetUserIds: [...formData.targetUserIds, userId] });
    }
    setUserSearch('');
    setSearchResults([]);
  };

  const removeUserFromNotification = (userId: string) => {
    setFormData({
      ...formData,
      targetUserIds: formData.targetUserIds.filter(id => id !== userId),
    });
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Заполните все поля');
      return;
    }

    if (formData.targetAudience === 'specific' && formData.targetUserIds.length === 0) {
      toast.error('Добавьте хотя бы одного пользователя');
      return;
    }

    setIsSaving(true);
    try {
      if (editingNotification) {
        // Editing existing notification
        const res = await fetch(`/api/admin/notifications/${editingNotification.id}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formData.title,
            message: formData.message,
            type: formData.type,
            isActive: editingNotification.isActive,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          toast.error(data.error || 'Ошибка обновления');
          return;
        }

        toast.success('Уведомление обновлено');
      } else if (formData.targetAudience === 'specific') {
        // Send personal notification to each user
        for (const userId of formData.targetUserIds) {
          const res = await fetch('/api/admin/notifications/send-personal', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              title: formData.title,
              message: formData.message,
              type: formData.type,
            }),
          });

          if (!res.ok) {
            const data = await res.json();
            toast.error(data.error || 'Ошибка отправки');
            return;
          }
        }

        toast.success(`Уведомление отправлено ${formData.targetUserIds.length} пользователю(ям)`);
      } else {
        // Create system notification
        const res = await fetch('/api/admin/notifications', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formData.title,
            message: formData.message,
            type: formData.type,
            targetAudience: formData.targetAudience,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          toast.error(data.error || 'Ошибка создания');
          return;
        }

        toast.success('Системное уведомление создано');
      }

      setShowCreateModal(false);
      setEditingNotification(null);
      setFormData({
        title: '',
        message: '',
        type: 'info',
        targetAudience: 'all',
        targetUserIds: [],
      });
      setUserSearch('');
      setSearchResults([]);
      loadData();
    } catch {
      toast.error('Ошибка сети');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteNotification = async (notificationId: string, type: 'personal' | 'system', userId?: string) => {
    setNotificationToDelete({ id: notificationId, type, userId });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!notificationToDelete) return;
    
    try {
      const res = await fetch(`/api/admin/notifications/${notificationToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        toast.error('Ошибка удаления');
        return;
      }

      toast.success('Уведомление удалено');
      setShowDeleteModal(false);
      setNotificationToDelete(null);
      loadData();
    } catch {
      toast.error('Ошибка сети');
    }
  };

  const openEditModal = (notification: any, userId?: string) => {
    setEditingNotification(notification);
    setFormData({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      targetAudience: userId ? 'specific' : 'all',
      targetUserIds: userId ? [userId] : [],
    });
    setShowCreateModal(true);
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Bell className="h-7 w-7 text-purple-600 dark:text-purple-400" />
              Уведомления
            </h1>
            <p className="text-sm text-gray-500 dark:text-white/40 mt-1">
              Управление персональными и системными уведомлениями
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadData}
              className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-2.5 text-sm text-gray-700 dark:text-white/60 hover:text-gray-900 dark:hover:text-white transition-all"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Обновить
            </button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all"
            >
              <Plus className="h-5 w-5" />
              Создать
            </motion.button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-white/20" />
          <input
            type="text"
            placeholder="Поиск по имени или email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 py-2.5 pl-9 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/20 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/10 dark:to-white/[0.02] p-5">
            <p className="text-xs font-medium text-gray-500 dark:text-white/50 uppercase tracking-wider mb-2">Пользователей</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/10 dark:to-white/[0.02] p-5">
            <p className="text-xs font-medium text-gray-500 dark:text-white/50 uppercase tracking-wider mb-2">Системных</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{systemNotifications.length}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/10 dark:to-white/[0.02] p-5">
            <p className="text-xs font-medium text-gray-500 dark:text-white/50 uppercase tracking-wider mb-2">Всего персональных</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {users.reduce((sum, u) => sum + u.totalNotifications, 0)}
            </p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
        ) : filteredUsers.length === 0 && systemNotifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">Нет уведомлений</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Users with Personal Notifications */}
            {filteredUsers.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  Персональные уведомления ({filteredUsers.length})
                </h2>
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {filteredUsers.map((user) => (
                      <motion.div
                        key={user.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] overflow-hidden"
                      >
                        {/* User Header */}
                        <button
                          onClick={() => toggleUserExpand(user.id)}
                          className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                        >
                          {user.avatar ? (
                            <img src={user.avatar} alt="" className="h-12 w-12 rounded-xl object-cover ring-2 ring-purple-200 dark:ring-purple-900/30" />
                          ) : (
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                              {(user.firstName || user.email)[0].toUpperCase()}
                            </div>
                          )}
                          
                          <div className="flex-1 text-left">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {displayName(user)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.totalNotifications} уведомл.
                              </p>
                              {user.unreadCount > 0 && (
                                <p className="text-xs text-purple-600 dark:text-purple-400">
                                  {user.unreadCount} непрочитано
                                </p>
                              )}
                            </div>
                            {expandedUserId === user.id ? (
                              <ChevronDown className="h-5 w-5 text-gray-400" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                        </button>

                        {/* Expanded Notifications */}
                        <AnimatePresence>
                          {expandedUserId === user.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t border-gray-200 dark:border-white/10"
                            >
                              <div className="p-6 space-y-3">
                                {user.notifications.length === 0 ? (
                                  <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                                    Нет уведомлений
                                  </p>
                                ) : (
                                  user.notifications.map((notification) => {
                                    const TypeIcon = TYPE_CONFIG[notification.type].icon;
                                    const isRead = (notification as any).isRead || false;
                                    
                                    return (
                                      <div
                                        key={notification.id}
                                        className={`group rounded-xl border ${TYPE_CONFIG[notification.type].border} p-4 transition-all ${
                                          isRead
                                            ? 'bg-gray-50 dark:bg-gray-800/30 opacity-60'
                                            : TYPE_CONFIG[notification.type].bg
                                        }`}
                                      >
                                        <div className="flex items-start gap-3">
                                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${
                                            isRead
                                              ? 'bg-gray-400 dark:bg-gray-600'
                                              : `bg-gradient-to-br ${TYPE_CONFIG[notification.type].gradient}`
                                          }`}>
                                            <TypeIcon className="h-5 w-5" />
                                          </div>
                                          <div className="flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                              <h4 className={`font-semibold ${
                                                isRead
                                                  ? 'text-gray-500 dark:text-gray-400'
                                                  : 'text-gray-900 dark:text-white'
                                              }`}>
                                                {notification.title}
                                              </h4>
                                              <div className="flex items-center gap-2">
                                                {isRead && (
                                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                                                    <Eye className="h-3 w-3" />
                                                    Прочитано
                                                  </span>
                                                )}
                                                {/* Action buttons - show on hover */}
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                                  <button
                                                    onClick={() => openEditModal(notification, user.id)}
                                                    className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors"
                                                    title="Редактировать"
                                                  >
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                  </button>
                                                  <button
                                                    onClick={() => deleteNotification(notification.id, 'personal', user.id)}
                                                    className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                                                    title="Удалить"
                                                  >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                  </button>
                                                </div>
                                              </div>
                                            </div>
                                            <p className={`mt-1 text-sm ${
                                              isRead
                                                ? 'text-gray-400 dark:text-gray-500'
                                                : 'text-gray-600 dark:text-gray-300'
                                            }`}>
                                              {notification.message}
                                            </p>
                                            <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                              <span>{new Date(notification.createdAt).toLocaleDateString('ru-RU')}</span>
                                              {notification.readCount !== undefined && notification.readCount > 0 && (
                                                <>
                                                  <span>•</span>
                                                  <span className="flex items-center gap-1">
                                                    <Eye className="h-3 w-3" />
                                                    Прочитано: {notification.readCount}
                                                  </span>
                                                </>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* System Notifications */}
            {systemNotifications.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Системные уведомления ({systemNotifications.length})
                </h2>
                <div className="space-y-3">
                  {systemNotifications.map((notification) => {
                    const TypeIcon = TYPE_CONFIG[notification.type].icon;
                    return (
                      <div
                        key={notification.id}
                        className={`group rounded-2xl border ${TYPE_CONFIG[notification.type].border} ${TYPE_CONFIG[notification.type].bg} p-5`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${TYPE_CONFIG[notification.type].gradient} flex items-center justify-center text-white shadow-lg`}>
                            <TypeIcon className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                                  {notification.title}
                                </h3>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                                  {notification.message}
                                </p>
                                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                  <span>{new Date(notification.createdAt).toLocaleDateString('ru-RU')}</span>
                                  {notification.readCount !== undefined && notification.readCount > 0 && (
                                    <>
                                      <span>•</span>
                                      <span className="flex items-center gap-1">
                                        <Eye className="h-3.5 w-3.5" />
                                        Прочитано: {notification.readCount}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                              {/* Action buttons - show on hover */}
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                <button
                                  onClick={() => openEditModal(notification)}
                                  className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors"
                                  title="Редактировать"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => deleteNotification(notification.id, 'system')}
                                  className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                                  title="Удалить"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Notification Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl z-50"
            >
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 sticky top-0">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Создать уведомление
                  </h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Form */}
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Заголовок
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500"
                      placeholder="Введите заголовок..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Сообщение
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 resize-none"
                      placeholder="Введите текст уведомления..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Тип
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="info">Инфо</option>
                      <option value="success">Успех</option>
                      <option value="warning">Предупреждение</option>
                      <option value="error">Ошибка</option>
                    </select>
                  </div>

                  {/* Audience Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Тип аудитории
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setFormData({ ...formData, targetAudience: 'all', targetUserIds: [] })}
                        className={`px-4 py-3 rounded-xl border-2 font-medium transition-all flex items-center justify-center gap-2 ${
                          formData.targetAudience === 'all'
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                            : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                        }`}
                      >
                        <Bell className="h-4 w-4" />
                        Системное
                      </button>
                      <button
                        onClick={() => setFormData({ ...formData, targetAudience: 'specific', targetUserIds: [] })}
                        className={`px-4 py-3 rounded-xl border-2 font-medium transition-all flex items-center justify-center gap-2 ${
                          formData.targetAudience === 'specific'
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                            : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                        }`}
                      >
                        <Users className="h-4 w-4" />
                        Персональное
                      </button>
                    </div>
                  </div>

                  {/* User Search for Personal Notifications */}
                  {formData.targetAudience === 'specific' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Поиск пользователей
                      </label>
                      <input
                        type="text"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Введите имя или email..."
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500"
                      />
                      
                      {/* Search Results */}
                      {searchResults.length > 0 && (
                        <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                          {searchResults.map((user) => (
                            <button
                              key={user.id}
                              onClick={() => addUserToNotification(user.id)}
                              disabled={formData.targetUserIds.includes(user.id)}
                              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {user.avatar ? (
                                <img src={user.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-sm font-bold text-purple-600 dark:text-purple-400">
                                  {(user.firstName || user.email)[0].toUpperCase()}
                                </div>
                              )}
                              <div className="flex-1 text-left">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                              </div>
                              {formData.targetUserIds.includes(user.id) && (
                                <CheckCircle className="h-5 w-5 text-emerald-500" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {searchingUsers && (
                        <div className="mt-2 flex items-center justify-center py-4">
                          <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
                          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                            {userSearch ? 'Поиск...' : 'Загрузка пользователей...'}
                          </span>
                        </div>
                      )}
                      
                      {!searchingUsers && searchResults.length === 0 && formData.targetAudience === 'specific' && (
                        <div className="mt-2 text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                          Нет найденных пользователей
                        </div>
                      )}

                      {/* Selected Users */}
                      {formData.targetUserIds.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                            Выбранные пользователи ({formData.targetUserIds.length})
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {formData.targetUserIds.map((userId) => {
                              const user = searchResults.find(u => u.id === userId);
                              return (
                                <span
                                  key={userId}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-sm"
                                >
                                  {user?.firstName && user?.lastName
                                    ? `${user.firstName} ${user.lastName}`
                                    : user?.email || userId}
                                  <button
                                    onClick={() => removeUserFromNotification(userId)}
                                    className="ml-1 hover:text-purple-900 dark:hover:text-purple-200"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3 sticky bottom-0">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-6 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 disabled:opacity-50 transition-all"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="h-5 w-5 animate-spin" />
                        Создание...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        Создать
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowDeleteModal(false);
                setNotificationToDelete(null);
              }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
            >
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Удалить уведомление?</h2>
                </div>
                
                <div className="p-6">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Это действие нельзя отменить. Уведомление будет удалено навсегда.
                  </p>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setNotificationToDelete(null);
                    }}
                    className="px-6 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Удалить
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </AdminShell>
  );
}
