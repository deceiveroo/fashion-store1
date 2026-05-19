'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Users, Package, ShoppingCart, DollarSign, TrendingUp, TrendingDown,
  RefreshCw, ArrowUpRight, Zap, Activity, Plus, Download,
  MessageCircle, LineChart, Clock, Sparkles, CreditCard, BarChart3, Bell,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import AdminShell from '@/components/admin/AdminShell';
import { AdminCard } from '@/components/admin/AdminCard';
import { RevenueChart } from '@/components/admin/charts/RevenueChart';
import { OrdersDonutChart } from '@/components/admin/charts/OrdersDonutChart';
import ActivityFeed from '@/components/admin/ActivityFeed';

interface Stats {
  overview: {
    totalUsers: number;
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    newUsersThisMonth: number;
    newOrdersThisMonth: number;
    revenueThisMonth: number;
    trends: { users: number; orders: number; revenue: number };
  };
}

interface Analytics {
  revenueByMonth: { month: string; revenue: number; orders: number }[];
  ordersByStatus: Record<string, number>;
  topProducts: { id: string; name: string; sales: number; revenue: number; image?: string }[];
  transactions: { id: string; description: string; amount: number; date: string; method: string }[];
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидает',
  processing: 'Обработка',
  shipped: 'Отправлен',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
  returned: 'Возврат',
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  processing: '#3b82f6',
  shipped: '#8b5cf6',
  delivered: '#10b981',
  cancelled: '#ef4444',
  returned: '#6b7280',
};

const QUICK_ACTIONS = [
  { label: 'Новый товар', href: '/admin/products/new', icon: Plus, accent: 'violet' },
  { label: 'Заказы', href: '/admin/orders', icon: ShoppingCart, accent: 'emerald' },
  { label: 'Чаты', href: '/admin/support-chats', icon: MessageCircle, accent: 'blue' },
  { label: 'Уведомления', href: '/admin/notifications', icon: Bell, accent: 'amber' },
  { label: 'Аналитика', href: '/admin/analytics', icon: LineChart, accent: 'amber' },
] as const;

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return 'Доброй ночи';
  if (h < 12) return 'Доброе утро';
  if (h < 18) return 'Добрый день';
  return 'Добрый вечер';
}

function AnimatedCounter({ value, duration = 900 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start: number;
    const run = (t: number) => {
      if (!start) start = t;
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      setCount(Math.floor(value * eased));
      if (p < 1) requestAnimationFrame(run);
    };
    requestAnimationFrame(run);
  }, [value, duration]);

  return <>{count.toLocaleString('ru-RU')}</>;
}

function TrendBadge({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        up
          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
          : 'bg-red-500/15 text-red-600 dark:text-red-400'
      }`}
    >
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {up ? '+' : ''}
      {value}%
    </span>
  );
}

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  accent,
  href,
  trend,
  isMoney,
}: {
  title: string;
  value: number;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: 'violet' | 'blue' | 'emerald' | 'amber';
  href?: string;
  trend?: number;
  isMoney?: boolean;
}) {
  const accents = {
    violet: 'from-violet-500/20 to-violet-600/5 text-violet-600 dark:text-violet-400 ring-violet-500/20',
    blue: 'from-blue-500/20 to-blue-600/5 text-blue-600 dark:text-blue-400 ring-blue-500/20',
    emerald: 'from-emerald-500/20 to-emerald-600/5 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20',
    amber: 'from-amber-500/20 to-amber-600/5 text-amber-600 dark:text-amber-400 ring-amber-500/20',
  };

  const display = isMoney
    ? `${Math.round(value).toLocaleString('ru-RU')} ₽`
    : typeof value === 'number'
      ? <AnimatedCounter value={value} />
      : value;

  const inner = (
    <AdminCard interactive={!!href} className="group relative overflow-hidden">
      <div
        className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${accents[accent]} opacity-40 blur-2xl transition-opacity group-hover:opacity-70`}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-text-faint)]">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[var(--admin-text)]">{display}</p>
          {sub && <p className="mt-1.5 text-xs text-[var(--admin-text-muted)]">{sub}</p>}
          {trend !== undefined && (
            <div className="mt-2 flex items-center gap-2">
              <TrendBadge value={trend} />
              <span className="text-[10px] text-[var(--admin-text-faint)]">к прошлому месяцу</span>
            </div>
          )}
        </div>
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ring-1 ${accents[accent]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {href && (
        <ArrowUpRight className="absolute bottom-4 right-4 h-4 w-4 text-[var(--admin-text-faint)] opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </AdminCard>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const load = async () => {
    setLoading(true);
    try {
      const [sRes, aRes] = await Promise.all([
        fetch('/api/admin/stats', { credentials: 'include' }),
        fetch('/api/admin/analytics?type=dashboard', { credentials: 'include' }),
      ]);
      if (sRes.ok) setStats(await sRes.json());
      if (aRes.ok) setAnalytics(await aRes.json());
      setLastUpdate(new Date());
    } catch {
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const donutData = useMemo(
    () =>
      analytics
        ? Object.entries(analytics.ordersByStatus).map(([s, c]) => ({
            name: STATUS_LABELS[s] || s,
            value: c as number,
            color: STATUS_COLORS[s] || '#6b7280',
          }))
        : [],
    [analytics]
  );

  const monthRevenue = analytics?.revenueByMonth?.at(-1)?.revenue ?? 0;
  const avgOrder =
    stats?.overview.totalOrders && stats.overview.totalRevenue
      ? Math.round(stats.overview.totalRevenue / stats.overview.totalOrders)
      : 0;

  const exportCsv = () => {
    const rows = [
      ['Метрика', 'Значение'],
      ['Пользователи', stats?.overview.totalUsers ?? 0],
      ['Товары', stats?.overview.totalProducts ?? 0],
      ['Заказы', stats?.overview.totalOrders ?? 0],
      ['Выручка', stats?.overview.totalRevenue ?? 0],
    ];
    const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `dashboard-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast.success('Экспорт готов');
  };

  const firstName = session?.user?.name?.split(' ')[0] || 'Админ';

  return (
    <AdminShell>
      <div className="space-y-8">
        {/* Hero */}
        <AdminCard padding="lg" className="relative overflow-hidden border-[var(--admin-accent)]/20">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-indigo-600/5" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--admin-accent-soft)] px-3 py-1 text-[11px] font-medium text-[var(--admin-accent)]">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  Магазин онлайн
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--admin-text)] md:text-3xl">
                {greeting()}, {firstName}
              </h1>
              <p className="mt-2 max-w-lg text-sm text-[var(--admin-text-muted)]">
                Обзор продаж, заказов и клиентов. Обновлено в{' '}
                {lastUpdate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={exportCsv}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] px-4 py-2.5 text-sm font-medium text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-card-hover)] hover:text-[var(--admin-text)]"
              >
                <Download className="h-4 w-4" />
                Экспорт
              </button>
              <button
                type="button"
                onClick={load}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/25 transition hover:shadow-violet-500/40 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Обновить
              </button>
            </div>
          </div>
        </AdminCard>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_ACTIONS.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="admin-card admin-card-interactive flex items-center gap-3 p-4"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]">
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-[var(--admin-text)]">{label}</span>
            </Link>
          ))}
        </div>

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Пользователи"
            href="/admin/customers"
            value={stats?.overview.totalUsers ?? 0}
            sub={`+${stats?.overview.newUsersThisMonth ?? 0} за месяц`}
            trend={stats?.overview.trends.users}
            icon={Users}
            accent="blue"
          />
          <StatCard
            title="Товары"
            href="/admin/products"
            value={stats?.overview.totalProducts ?? 0}
            icon={Package}
            accent="violet"
          />
          <StatCard
            title="Заказы"
            href="/admin/orders"
            value={stats?.overview.totalOrders ?? 0}
            sub={`+${stats?.overview.newOrdersThisMonth ?? 0} за месяц`}
            trend={stats?.overview.trends.orders}
            icon={ShoppingCart}
            accent="emerald"
          />
          <StatCard
            title="Выручка"
            value={stats?.overview.totalRevenue ?? 0}
            sub={`${Math.round(stats?.overview.revenueThisMonth ?? 0).toLocaleString('ru-RU')} ₽ за месяц`}
            trend={stats?.overview.trends.revenue}
            icon={DollarSign}
            accent="amber"
            isMoney
          />
        </div>

        {/* Mini insights */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Выручка за месяц', value: `${Math.round(monthRevenue).toLocaleString('ru-RU')} ₽`, icon: BarChart3 },
            { label: 'Средний чек', value: `${avgOrder.toLocaleString('ru-RU')} ₽`, icon: CreditCard },
            {
              label: 'Конверсия заказов',
              value:
                stats?.overview.totalUsers && stats.overview.totalOrders
                  ? `${((stats.overview.totalOrders / stats.overview.totalUsers) * 100).toFixed(1)}%`
                  : '—',
              icon: Sparkles,
            },
          ].map(({ label, value, icon: Icon }) => (
            <AdminCard key={label} className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--admin-bg-muted)] text-[var(--admin-accent)]">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-[var(--admin-text-faint)]">{label}</p>
                <p className="text-lg font-semibold text-[var(--admin-text)]">{value}</p>
              </div>
            </AdminCard>
          ))}
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-3">
          <AdminCard className="lg:col-span-2" padding="md">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--admin-text)]">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  Динамика выручки
                </h2>
                <p className="mt-1 text-xs text-[var(--admin-text-faint)]">6 месяцев</p>
              </div>
            </div>
            {loading ? (
              <div className="flex h-[300px] items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-violet-500" />
              </div>
            ) : analytics?.revenueByMonth?.length ? (
              <RevenueChart data={analytics.revenueByMonth} />
            ) : (
              <p className="flex h-[300px] items-center justify-center text-sm text-[var(--admin-text-faint)]">
                Нет данных
              </p>
            )}
          </AdminCard>

          <AdminCard padding="md">
            <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-[var(--admin-text)]">
              <Activity className="h-5 w-5 text-violet-500" />
              Статусы заказов
            </h2>
            <p className="mb-4 text-xs text-[var(--admin-text-faint)]">Распределение</p>
            {loading ? (
              <div className="flex h-[280px] items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-violet-500" />
              </div>
            ) : donutData.length > 0 ? (
              <OrdersDonutChart data={donutData} />
            ) : (
              <p className="flex h-[280px] items-center justify-center text-sm text-[var(--admin-text-faint)]">
                Нет данных
              </p>
            )}
          </AdminCard>
        </div>

        {/* Transactions + top products */}
        <div className="grid gap-6 lg:grid-cols-2">
          <AdminCard padding="md">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--admin-text)]">
                <Clock className="h-5 w-5 text-[var(--admin-accent)]" />
                Последние транзакции
              </h2>
              <Link href="/admin/orders" className="text-xs font-medium text-[var(--admin-accent)] hover:underline">
                Все заказы
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-xl bg-[var(--admin-bg-muted)]" />
                ))}
              </div>
            ) : analytics?.transactions?.length ? (
              <ul className="space-y-2">
                {analytics.transactions.slice(0, 6).map((tx) => (
                  <li
                    key={tx.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[var(--admin-border-subtle)] bg-[var(--admin-bg-muted)]/50 px-4 py-3 transition-colors hover:bg-[var(--admin-card-hover)]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--admin-text)]">{tx.description}</p>
                      <p className="text-[10px] text-[var(--admin-text-faint)]">
                        {new Date(tx.date).toLocaleString('ru-RU')} · {tx.method}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      +{Math.round(tx.amount).toLocaleString('ru-RU')} ₽
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-12 text-center text-sm text-[var(--admin-text-faint)]">Транзакций пока нет</p>
            )}
          </AdminCard>

          <AdminCard padding="md">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--admin-text)]">
                <Package className="h-5 w-5 text-violet-500" />
                Топ товары
              </h2>
              <Link href="/admin/products" className="text-xs font-medium text-[var(--admin-accent)] hover:underline">
                Каталог
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-xl bg-[var(--admin-bg-muted)]" />
                ))}
              </div>
            ) : analytics?.topProducts?.length ? (
              <ul className="space-y-2">
                {analytics.topProducts.map((p, i) => (
                  <li
                    key={`${p.id}-${i}`}
                    className="group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-[var(--admin-card-hover)]"
                  >
                    <span className="w-6 text-center text-xs font-bold text-[var(--admin-text-faint)]">
                      {i + 1}
                    </span>
                    {p.image ? (
                      <img src={p.image} alt="" className="h-11 w-11 rounded-lg object-cover ring-1 ring-[var(--admin-border)]" />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--admin-bg-muted)]">
                        <Package className="h-5 w-5 text-[var(--admin-text-faint)]" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--admin-text)] group-hover:text-[var(--admin-accent)]">
                        {p.name}
                      </p>
                      <p className="text-[11px] text-[var(--admin-text-faint)]">{p.sales} продаж</p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      {Math.round(p.revenue).toLocaleString('ru-RU')} ₽
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-12 text-center text-sm text-[var(--admin-text-faint)]">Нет данных</p>
            )}
          </AdminCard>
        </div>

        <ActivityFeed />
      </div>
    </AdminShell>
  );
}
