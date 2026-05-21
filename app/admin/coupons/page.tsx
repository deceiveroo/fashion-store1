'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Ticket,
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  Edit2,
  Trash2,
  Copy,
  Users,
  X,
  TrendingUp,
  CheckCircle2,
  ShoppingBag,
  XCircle,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import AdminShell from '@/components/admin/AdminShell';

interface UserWithCoupons {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role: string;
  createdAt: string;
  coupons: Coupon[];
  totalCoupons: number;
  activeCount: number;
  usedCount: number;
  expiredCount: number;
  totalSavings: number;
}

interface Coupon {
  id: string;
  code: string;
  discount: number;
  type: 'percent' | 'fixed';
  status: string;
  isValid: boolean;
  isExpired: boolean;
  discountAmount?: string;
  expiresAt?: string;
  usedAt?: string;
  orderId?: string;
  createdAt: string;
}

export default function AdminCouponsPage() {
  const { showConfirm } = useConfirm();
  const [users, setUsers] = useState<UserWithCoupons[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  // Load users with their coupons
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/coupons/users', {
        credentials: 'include',
      });
      
      if (!res.ok) {
        toast.error('Не удалось загрузить данные');
        return;
      }

      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Код скопирован!', { icon: '📋' });
  };

  const deleteCoupon = async (couponId: string, couponCode: string) => {
    const confirmed = await showConfirm({
      title: 'Удаление записи о промокоде',
      message: `Удалить запись о использовании промокода ${couponCode}? Это действие нельзя отменить.`,
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      variant: 'danger',
    });
    
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/profile/coupons/${couponId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        toast.success('Запись удалена', { icon: '🗑️' });
        loadData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Ошибка удаления');
      }
    } catch (error) {
      console.error('Error deleting coupon usage:', error);
      toast.error('Ошибка сети');
    }
  };

  // Filter users based on search
  const filteredUsers = users.filter(user => {
    const searchTerm = search.toLowerCase();
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
    return (
      user.email.toLowerCase().includes(searchTerm) ||
      fullName.includes(searchTerm) ||
      user.coupons.some(c => c.code.toLowerCase().includes(searchTerm))
    );
  });

  // Stats
  const totalUsers = users.length;
  const totalCoupons = users.reduce((sum, u) => sum + u.totalCoupons, 0);
  const totalActive = users.reduce((sum, u) => sum + u.activeCount, 0);
  const totalSavings = users.reduce((sum, u) => sum + u.totalSavings, 0);

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Промокоды пользователей
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Управление персональными промокодами пользователей
            </p>
          </div>
          
          <motion.button
            onClick={loadData}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 rounded-lg font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="inline-block w-4 h-4 mr-2" />
            Обновить
          </motion.button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Users size={18} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Пользователей</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Ticket size={18} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Всего промокодов</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{totalCoupons}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 size={18} className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Активных</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{totalActive}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <TrendingUp size={18} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Сэкономлено</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {totalSavings.toLocaleString('ru-RU')} ₽
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск по email, имени или коду промокода..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Users List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20">
            <Ticket className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Нет пользователей с промокодами
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {search ? 'Попробуйте изменить поисковый запрос' : 'Промокоды появятся здесь после использования'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <motion.div
                key={user.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* User Header */}
                <button
                  onClick={() => setExpandedUserId(expandedUserId === user.id ? null : user.id)}
                  className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      (user.firstName?.[0] || user.email[0]).toUpperCase()
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.email}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>

                  {/* Stats */}
                  <div className="hidden md:flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="text-gray-500 dark:text-gray-400">Всего</p>
                      <p className="font-bold text-gray-900 dark:text-white">{user.totalCoupons}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500 dark:text-gray-400">Активных</p>
                      <p className="font-bold text-green-600 dark:text-green-400">{user.activeCount}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500 dark:text-gray-400">Сэкономлено</p>
                      <p className="font-bold text-emerald-600 dark:text-emerald-400">
                        {user.totalSavings.toLocaleString('ru-RU')} ₽
                      </p>
                    </div>
                  </div>

                  {/* Expand Icon */}
                  <motion.div
                    animate={{ rotate: expandedUserId === user.id ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </motion.div>
                </button>

                {/* Expanded Coupons List */}
                <AnimatePresence>
                  {expandedUserId === user.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-gray-200 dark:border-gray-700"
                    >
                      <div className="p-6 space-y-3">
                        {user.coupons.map((coupon) => {
                          const isActive = coupon.isValid && !coupon.isExpired;
                          const isUsed = !coupon.isValid;
                          const isExpired = coupon.isExpired;

                          return (
                            <div
                              key={coupon.id}
                              className="group rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all"
                            >
                              <div className="flex items-start justify-between gap-4">
                                {/* Left side - Coupon Info */}
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className={`p-2 rounded-lg ${
                                      isActive
                                        ? 'bg-purple-100 dark:bg-purple-900/30'
                                        : isUsed
                                        ? 'bg-blue-100 dark:bg-blue-900/30'
                                        : 'bg-red-100 dark:bg-red-900/30'
                                    }`}>
                                      <Ticket size={18} className={
                                        isActive
                                          ? 'text-purple-600 dark:text-purple-400'
                                          : isUsed
                                          ? 'text-blue-600 dark:text-blue-400'
                                          : 'text-red-600 dark:text-red-400'
                                      } />
                                    </div>
                                    
                                    <div>
                                      <h4 className="font-mono font-bold text-gray-900 dark:text-white">
                                        {coupon.code}
                                      </h4>
                                      <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Скидка:{' '}
                                        <span className="font-semibold text-gray-900 dark:text-white">
                                          {coupon.type === 'percent' ? `${coupon.discount}%` : `${coupon.discount} ₽`}
                                        </span>
                                      </p>
                                    </div>
                                  </div>

                                  {/* Status & Details */}
                                  <div className="flex items-center gap-4 text-sm">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      isActive
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        : isUsed
                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                    }`}>
                                      {isActive ? 'Активен' : isUsed ? 'Использован' : 'Истёк'}
                                    </span>
                                    
                                    {coupon.discountAmount && (
                                      <span className="text-gray-500 dark:text-gray-400">
                                        Сэкономлено:{' '}
                                        <span className="font-semibold text-green-600 dark:text-green-400">
                                          {parseFloat(coupon.discountAmount).toLocaleString('ru-RU')} ₽
                                        </span>
                                      </span>
                                    )}
                                    
                                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                      <Clock size={12} />
                                      {isUsed
                                        ? new Date(coupon.usedAt || '').toLocaleDateString('ru-RU')
                                        : new Date(coupon.expiresAt || '').toLocaleDateString('ru-RU')}
                                    </span>
                                  </div>
                                </div>

                                {/* Right side - Actions */}
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <motion.button
                                    onClick={() => copyToClipboard(coupon.code)}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    title="Копировать код"
                                  >
                                    <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                  </motion.button>
                                  
                                  {coupon.orderId && (
                                    <a
                                      href={`/orders/${coupon.orderId}`}
                                      className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                                      title="Перейти к заказу"
                                    >
                                      <ShoppingBag className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    </a>
                                  )}
                                  
                                  <motion.button
                                    onClick={() => deleteCoupon(coupon.id, coupon.code)}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                    title="Удалить"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                                  </motion.button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
