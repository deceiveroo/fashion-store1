'use client';

import { useState, useEffect } from 'react';
import {
  ShoppingCart, UserPlus, Package, CreditCard,
  Star, AlertCircle, CheckCircle2, TrendingUp, Clock, X,
} from 'lucide-react';
import { AdminCard } from './AdminCard';

interface Activity {
  id: string;
  type: 'order' | 'user' | 'product' | 'payment' | 'review' | 'alert' | 'success';
  title: string;
  description: string;
  timestamp: Date;
  metadata?: { amount?: number; status?: string };
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const mock: Activity[] = [
      {
        id: '1',
        type: 'order',
        title: 'Новый заказ',
        description: 'Клиент оформил заказ в каталоге',
        timestamp: new Date(Date.now() - 5 * 60_000),
        metadata: { amount: 12500, status: 'pending' },
      },
      {
        id: '2',
        type: 'user',
        title: 'Новый клиент',
        description: 'Регистрация на сайте',
        timestamp: new Date(Date.now() - 15 * 60_000),
      },
      {
        id: '3',
        type: 'payment',
        title: 'Оплата получена',
        description: 'Заказ успешно оплачен',
        timestamp: new Date(Date.now() - 30 * 60_000),
        metadata: { amount: 8900, status: 'completed' },
      },
      {
        id: '4',
        type: 'alert',
        title: 'Низкий остаток',
        description: 'Проверьте складские позиции',
        timestamp: new Date(Date.now() - 90 * 60_000),
      },
    ];
    setActivities(mock);
  }, []);

  const getIcon = (type: Activity['type']) => {
    const map = {
      order: ShoppingCart,
      user: UserPlus,
      product: Package,
      payment: CreditCard,
      review: Star,
      alert: AlertCircle,
      success: CheckCircle2,
    };
    return map[type] ?? Clock;
  };

  const colorClass = (type: Activity['type']) => {
    const map: Record<Activity['type'], string> = {
      order: 'text-violet-600 bg-violet-500/15 border-violet-500/25 dark:text-violet-400',
      user: 'text-blue-600 bg-blue-500/15 border-blue-500/25 dark:text-blue-400',
      payment: 'text-emerald-600 bg-emerald-500/15 border-emerald-500/25 dark:text-emerald-400',
      review: 'text-amber-600 bg-amber-500/15 border-amber-500/25 dark:text-amber-400',
      alert: 'text-red-600 bg-red-500/15 border-red-500/25 dark:text-red-400',
      success: 'text-green-600 bg-green-500/15 border-green-500/25 dark:text-green-400',
      product: 'text-slate-600 bg-slate-500/15 border-slate-500/25',
    };
    return map[type];
  };

  const formatTime = (date: Date) => {
    const m = Math.floor((Date.now() - date.getTime()) / 60_000);
    if (m < 1) return 'только что';
    if (m < 60) return `${m} мин назад`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} ч назад`;
    return date.toLocaleDateString('ru-RU');
  };

  return (
    <AdminCard padding="none" className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--admin-border)] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--admin-accent-soft)]">
            <TrendingUp className="h-4 w-4 text-[var(--admin-accent)]" />
            <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-violet-500" />
            </span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--admin-text)]">Лента активности</h3>
            <p className="text-[10px] text-[var(--admin-text-faint)]">Демо-данные · обновляется</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1.5 text-[var(--admin-text-muted)] hover:bg-[var(--admin-card-hover)] hover:text-[var(--admin-text)]"
          aria-label={collapsed ? 'Развернуть' : 'Свернуть'}
        >
          {collapsed ? <Clock className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </button>
      </div>

      {!collapsed && (
        <div className="custom-scrollbar max-h-[420px] space-y-2 overflow-y-auto p-3">
          {activities.map((activity) => {
            const Icon = getIcon(activity.type);
            return (
              <div
                key={activity.id}
                className="group flex gap-3 rounded-xl border border-[var(--admin-border-subtle)] bg-[var(--admin-bg-muted)]/40 p-3 transition-colors hover:bg-[var(--admin-card-hover)]"
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${colorClass(activity.type)}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium text-[var(--admin-text)]">{activity.title}</p>
                    <span className="shrink-0 text-[10px] text-[var(--admin-text-faint)]">
                      {formatTime(activity.timestamp)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-[var(--admin-text-muted)]">{activity.description}</p>
                  {activity.metadata?.amount != null && (
                    <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {activity.metadata.amount.toLocaleString('ru-RU')} ₽
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminCard>
  );
}
