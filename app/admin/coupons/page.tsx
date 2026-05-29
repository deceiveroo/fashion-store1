'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Ticket,
  Search,
  ChevronDown,
  Trash2,
  Copy,
  Users,
  X,
  TrendingUp,
  CheckCircle2,
  ShoppingBag,
  Clock,
  RefreshCw,
  Gift,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import AdminShell from '@/components/admin/AdminShell';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminStatCard from '@/components/admin/AdminStatCard';

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
  source?: 'order' | 'shop' | 'gift';
  isValid: boolean;
  isExpired: boolean;
  discountAmount?: string;
  expiresAt?: string;
  usedAt?: string;
  orderId?: string;
  coinsSpent?: number;
  createdAt: string;
}

export default function AdminCouponsPage() {
  const { showConfirm } = useConfirm();
  const [users, setUsers] = useState<UserWithCoupons[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  const [grantOpen, setGrantOpen] = useState(false);
  const [grantTargetUser, setGrantTargetUser] = useState<UserWithCoupons | null>(null);
  const [grantForm, setGrantForm] = useState({
    discount: 10,
    type: 'percent' as 'percent' | 'fixed',
    expiresDays: 30,
    minOrder: '',
    code: '',
  });
  const [granting, setGranting] = useState(false);

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

  const revokeCoupon = async (purchasedId: string, couponCode: string) => {
    const confirmed = await showConfirm({
      title: 'Отозвать промокод',
      message: `Отозвать активный промокод ${couponCode} у пользователя? Код перестанет действовать.`,
      confirmText: 'Отозвать',
      cancelText: 'Отмена',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/coupons/grant/${encodeURIComponent(purchasedId)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        toast.success('Промокод отозван');
        loadData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Ошибка отзыва');
      }
    } catch (error) {
      console.error('Error revoking coupon:', error);
      toast.error('Ошибка сети');
    }
  };

  const openGrantModal = (user: UserWithCoupons) => {
    setGrantTargetUser(user);
    setGrantForm({ discount: 10, type: 'percent', expiresDays: 30, minOrder: '', code: '' });
    setGrantOpen(true);
  };

  const submitGrant = async () => {
    if (!grantTargetUser) return;
    if (!grantForm.discount || grantForm.discount <= 0) {
      toast.error('Укажите размер скидки больше 0');
      return;
    }
    if (grantForm.type === 'percent' && grantForm.discount > 100) {
      toast.error('Процентная скидка не может быть больше 100');
      return;
    }
    setGranting(true);
    try {
      const res = await fetch('/api/admin/coupons/grant', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: grantTargetUser.id,
          discount: Number(grantForm.discount),
          type: grantForm.type,
          expiresDays: Number(grantForm.expiresDays) || 30,
          minOrder: grantForm.minOrder ? Number(grantForm.minOrder) : null,
          code: grantForm.code.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Не удалось выдать промокод');
        return;
      }
      toast.success(`Выдан промокод ${data.coupon?.code}`, { icon: '🎁' });
      setGrantOpen(false);
      setGrantTargetUser(null);
      loadData();
    } catch (error) {
      console.error('Error granting coupon:', error);
      toast.error('Ошибка сети');
    } finally {
      setGranting(false);
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
        <AdminPageHeader
          title="Промокоды пользователей"
          description="Управление персональными промокодами пользователей"
          actions={
            <motion.button
              onClick={loadData}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] text-sm font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-card-hover)] hover:text-[var(--admin-text)] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Обновить
            </motion.button>
          }
        />

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AdminStatCard
            title="Пользователей"
            value={totalUsers}
            icon={Users}
            accent="violet"
          />
          <AdminStatCard
            title="Всего промокодов"
            value={totalCoupons}
            icon={Ticket}
            accent="blue"
          />
          <AdminStatCard
            title="Активных"
            value={totalActive}
            icon={CheckCircle2}
            accent="emerald"
          />
          <AdminStatCard
            title="Сэкономлено"
            value={`${totalSavings.toLocaleString('ru-RU')} ₽`}
            icon={TrendingUp}
            accent="amber"
          />
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--admin-text-faint)]" />
          <input
            type="text"
            placeholder="Поиск по email, имени или коду промокода..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg-muted)] text-[var(--admin-text)] outline-none focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/40"
          />
        </div>

        {/* Users List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-[var(--admin-accent)]" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20">
            <Ticket className="w-16 h-16 mx-auto text-[var(--admin-text-faint)] mb-4" />
            <h3 className="text-lg font-semibold text-[var(--admin-text)] mb-2">
              Нет пользователей с промокодами
            </h3>
            <p className="text-[var(--admin-text-muted)]">
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
                className="bg-[var(--admin-card)] rounded-2xl border border-[var(--admin-border)] overflow-hidden"
              >
                {/* User Header */}
                <button
                  onClick={() => setExpandedUserId(expandedUserId === user.id ? null : user.id)}
                  className="w-full px-6 py-4 flex items-center gap-4 hover:bg-[var(--admin-card-hover)] transition-colors"
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
                    <h3 className="font-semibold text-[var(--admin-text)]">
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.email}
                    </h3>
                    <p className="text-sm text-[var(--admin-text-muted)]">{user.email}</p>
                  </div>

                  {/* Stats */}
                  <div className="hidden md:flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="text-[var(--admin-text-muted)]">Всего</p>
                      <p className="font-bold text-[var(--admin-text)]">{user.totalCoupons}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[var(--admin-text-muted)]">Активных</p>
                      <p className="font-bold text-green-600 dark:text-green-400">{user.activeCount}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[var(--admin-text-muted)]">Сэкономлено</p>
                      <p className="font-bold text-emerald-600 dark:text-emerald-400">
                        {user.totalSavings.toLocaleString('ru-RU')} ₽
                      </p>
                    </div>
                  </div>

                  {/* Grant button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openGrantModal(user);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-[var(--admin-accent)] text-white hover:opacity-90 shadow-sm hover:shadow-md transition-all"
                  >
                    <Gift size={14} />
                    <span className="hidden sm:inline">Выдать</span>
                  </button>

                  {/* Expand Icon */}
                  <motion.div
                    animate={{ rotate: expandedUserId === user.id ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-5 h-5 text-[var(--admin-text-faint)]" />
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
                      className="border-t border-[var(--admin-border)]"
                    >
                      <div className="p-6 space-y-3">
                        {user.coupons.map((coupon) => {
                          const isActive = coupon.isValid && !coupon.isExpired;
                          const isUsed = !coupon.isValid;
                          const isExpired = coupon.isExpired;

                          return (
                            <div
                              key={coupon.id}
                              className={`group rounded-xl border p-4 hover:shadow-md transition-all ${
                                isActive && coupon.source === 'gift'
                                  ? 'border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/60 to-pink-50/40 dark:from-purple-950/30 dark:to-pink-950/20'
                                  : isActive && coupon.source === 'shop'
                                  ? 'border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50/60 to-orange-50/40 dark:from-amber-950/30 dark:to-orange-950/20'
                                  : 'border-[var(--admin-border)] bg-[var(--admin-bg-muted)]'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-4">
                                {/* Left side - Coupon Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className={`p-2 rounded-lg ${
                                      isActive && coupon.source === 'gift'
                                        ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/30'
                                        : isActive && coupon.source === 'shop'
                                        ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-amber-500/30'
                                        : isActive
                                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                                        : isUsed
                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                        : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                    }`}>
                                      <Ticket size={18} />
                                    </div>

                                    <div>
                                      <h4 className="font-mono font-bold text-[var(--admin-text)]">
                                        {coupon.code}
                                      </h4>
                                      <p className="text-sm text-[var(--admin-text-muted)]">
                                        Скидка:{' '}
                                        <span className="font-semibold text-[var(--admin-text)]">
                                          {coupon.type === 'percent' ? `${coupon.discount}%` : `${coupon.discount} ₽`}
                                        </span>
                                      </p>
                                    </div>
                                  </div>

                                  {/* Status & Details */}
                                  <div className="flex items-center gap-2 flex-wrap text-sm">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      isActive && coupon.source === 'gift'
                                        ? 'bg-purple-500 text-white'
                                        : isActive && coupon.source === 'shop'
                                        ? 'bg-amber-500 text-white'
                                        : isActive
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        : isUsed
                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                    }`}>
                                      {isActive && coupon.source === 'gift'
                                        ? 'Выдан админом'
                                        : isActive && coupon.source === 'shop'
                                        ? 'Куплен за монеты'
                                        : isActive
                                        ? 'Активен'
                                        : isUsed
                                        ? 'Использован'
                                        : 'Истёк'}
                                    </span>

                                    {coupon.discountAmount && (
                                      <span className="text-[var(--admin-text-muted)]">
                                        Сэкономлено:{' '}
                                        <span className="font-semibold text-green-600 dark:text-green-400">
                                          {parseFloat(coupon.discountAmount).toLocaleString('ru-RU')} ₽
                                        </span>
                                      </span>
                                    )}

                                    {typeof coupon.coinsSpent === 'number' && coupon.coinsSpent > 0 && (
                                      <span className="text-amber-600 dark:text-amber-400">
                                        {coupon.coinsSpent} монет
                                      </span>
                                    )}

                                    <span className="text-[var(--admin-text-muted)] flex items-center gap-1">
                                      <Clock size={12} />
                                      {isUsed
                                        ? new Date(coupon.usedAt || '').toLocaleDateString('ru-RU')
                                        : new Date(coupon.expiresAt || '').toLocaleDateString('ru-RU')}
                                    </span>
                                  </div>
                                </div>

                                {/* Right side - Actions */}
                                <div className="flex items-center gap-1 md:gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                  <motion.button
                                    onClick={() => copyToClipboard(coupon.code)}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="p-2 rounded-lg hover:bg-[var(--admin-card-hover)] transition-colors"
                                    title="Копировать код"
                                  >
                                    <Copy className="w-4 h-4 text-[var(--admin-text-muted)]" />
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

                                  {isActive ? (
                                    <motion.button
                                      onClick={() => revokeCoupon(coupon.id, coupon.code)}
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                      title="Отозвать промокод"
                                    >
                                      <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                                    </motion.button>
                                  ) : (
                                    <motion.button
                                      onClick={() => deleteCoupon(coupon.id, coupon.code)}
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                      title="Удалить запись"
                                    >
                                      <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                                    </motion.button>
                                  )}
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

      {/* Grant modal */}
      <AnimatePresence>
        {grantOpen && grantTargetUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => !granting && setGrantOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[var(--admin-bg-elevated)] rounded-2xl shadow-2xl border border-[var(--admin-border)] overflow-hidden"
            >
              <div className="relative px-6 py-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <button
                  type="button"
                  onClick={() => !granting && setGrantOpen(false)}
                  className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/15 transition-colors"
                >
                  <X size={18} />
                </button>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/15 backdrop-blur-sm">
                    <Gift size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold leading-tight">Выдать промокод</h3>
                    <p className="text-sm text-white/85">
                      {grantTargetUser.firstName || grantTargetUser.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[var(--admin-text-muted)] mb-1.5">
                      Тип
                    </label>
                    <div className="flex rounded-lg border border-[var(--admin-border)] overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setGrantForm({ ...grantForm, type: 'percent' })}
                        className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                          grantForm.type === 'percent'
                            ? 'bg-[var(--admin-accent)] text-white'
                            : 'bg-[var(--admin-bg-muted)] text-[var(--admin-text-muted)] hover:bg-[var(--admin-card-hover)]'
                        }`}
                      >
                        %
                      </button>
                      <button
                        type="button"
                        onClick={() => setGrantForm({ ...grantForm, type: 'fixed' })}
                        className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                          grantForm.type === 'fixed'
                            ? 'bg-[var(--admin-accent)] text-white'
                            : 'bg-[var(--admin-bg-muted)] text-[var(--admin-text-muted)] hover:bg-[var(--admin-card-hover)]'
                        }`}
                      >
                        ₽
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--admin-text-muted)] mb-1.5">
                      Скидка
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={grantForm.type === 'percent' ? 100 : undefined}
                      value={grantForm.discount}
                      onChange={(e) =>
                        setGrantForm({ ...grantForm, discount: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg-muted)] text-[var(--admin-text)] outline-none focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/40"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[var(--admin-text-muted)] mb-1.5">
                      Срок (дней)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={grantForm.expiresDays}
                      onChange={(e) =>
                        setGrantForm({ ...grantForm, expiresDays: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg-muted)] text-[var(--admin-text)] outline-none focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--admin-text-muted)] mb-1.5">
                      Мин. сумма заказа
                    </label>
                    <input
                      type="number"
                      min={0}
                      placeholder="—"
                      value={grantForm.minOrder}
                      onChange={(e) =>
                        setGrantForm({ ...grantForm, minOrder: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg-muted)] text-[var(--admin-text)] outline-none focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--admin-text-muted)] mb-1.5">
                    Код (необязательно)
                  </label>
                  <input
                    type="text"
                    placeholder="GIFT-ABCD1234 (если не указан — будет сгенерирован)"
                    value={grantForm.code}
                    onChange={(e) =>
                      setGrantForm({ ...grantForm, code: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-2 font-mono rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg-muted)] text-[var(--admin-text)] outline-none focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/40"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setGrantOpen(false)}
                    disabled={granting}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text)] font-medium hover:bg-[var(--admin-card-hover)] disabled:opacity-50"
                  >
                    Отмена
                  </button>
                  <button
                    type="button"
                    onClick={submitGrant}
                    disabled={granting}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--admin-accent)] text-white font-medium hover:opacity-90 disabled:opacity-50 inline-flex items-center justify-center gap-2"
                  >
                    {granting ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                    Выдать
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminShell>
  );
}
