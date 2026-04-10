'use client';

import { useState, useEffect } from 'react';
import { Users, Package, ShoppingCart, DollarSign, TrendingUp, TrendingDown, RefreshCw, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import AdminShell from '@/components/admin/AdminShell';
import { RevenueChart } from '@/components/admin/charts/RevenueChart';
import { OrdersDonutChart } from '@/components/admin/charts/OrdersDonutChart';
import Link from 'next/link';

interface Stats {
  overview: {
    totalUsers: number; totalProducts: number; totalOrders: number; totalRevenue: number;
    newUsersThisMonth: number; newOrdersThisMonth: number; revenueThisMonth: number;
  };
}

interface Analytics {
  revenueByMonth: { month: string; revenue: number; orders: number }[];
  ordersByStatus: Record<string, number>;
  topProducts: { id: string; name: string; sales: number; revenue: number; image?: string }[];
  transactions: { id: string; description: string; amount: number; date: string; method: string }[];
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидает', processing: 'Обработка', shipped: 'Отправлен',
  delivered: 'Доставлен', cancelled: 'Отменён', returned: 'Возврат',
};
const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b', processing: '#3b82f6', shipped: '#8b5cf6',
  delivered: '#10b981', cancelled: '#ef4444', returned: '#6b7280',
};

function StatCard({ title, value, sub, icon: Icon, color, href }: {
  title: string; value: string | number; sub?: string;
  icon: any; color: string; href?: string;
}) {
  const content = (
    <div className={`relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] p-5 hover:bg-white/[0.05] transition-all group`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-white/40 uppercase tracking-wider">{title}</p>
          <p className="mt-2 text-2xl font-bold text-white">{value}</p>
          {sub && <p className="mt-1 text-xs text-white/30">{sub}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {href && <ArrowUpRight className="absolute bottom-4 right-4 h-4 w-4 text-white/10 group-hover:text-white/30 transition-colors" />}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [sRes, aRes] = await Promise.all([
        fetch('/api/admin/stats', { credentials: 'include' }),
        fetch('/api/admin/analytics?type=dashboard', { credentials: 'include' }),
      ]);
      if (sRes.ok) setStats(await sRes.json());
      if (aRes.ok) setAnalytics(await aRes.json());
    } catch {
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const donutData = analytics
    ? Object.entries(analytics.ordersByStatus).map(([s, c]) => ({
        name: STATUS_LABELS[s] || s, value: c as number, color: STATUS_COLORS[s] || '#6b7280',
      }))
    : [];

  const fmt = (n: number) => n.toLocaleString('ru-RU');
  const fmtRub = (n: number) => `${fmt(Math.round(n))} ₽`;

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Дашборд</h1>
            <p className="text-sm text-white/40">Обзор магазина</p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Обновить
          </button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Пользователи" href="/admin/customers"
            value={loading ? '—' : fmt(stats?.overview.totalUsers || 0)}
            sub={loading ? '' : `+${stats?.overview.newUsersThisMonth || 0} за месяц`}
            icon={Users} color="bg-blue-500/10 text-blue-400"
          />
          <StatCard
            title="Товары" href="/admin/products"
            value={loading ? '—' : fmt(stats?.overview.totalProducts || 0)}
            icon={Package} color="bg-violet-500/10 text-violet-400"
          />
          <StatCard
            title="Заказы" href="/admin/orders"
            value={loading ? '—' : fmt(stats?.overview.totalOrders || 0)}
            sub={loading ? '' : `+${stats?.overview.newOrdersThisMonth || 0} за месяц`}
            icon={ShoppingCart} color="bg-emerald-500/10 text-emerald-400"
          />
          <StatCard
            title="Выручка"
            value={loading ? '—' : fmtRub(stats?.overview.totalRevenue || 0)}
            sub={loading ? '' : `${fmtRub(stats?.overview.revenueThisMonth || 0)} за месяц`}
            icon={DollarSign} color="bg-amber-500/10 text-amber-400"
          />
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Revenue */}
          <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-white/[0.03] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Выручка</h3>
                <p className="text-xs text-white/30">Последние 6 месяцев</p>
              </div>
            </div>
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
              </div>
            ) : analytics?.revenueByMonth ? (
              <RevenueChart data={analytics.revenueByMonth} />
            ) : (
              <div className="flex h-48 items-center justify-center text-white/20 text-sm">Нет данных</div>
            )}
          </div>

          {/* Orders donut */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-white">Статусы заказов</h3>
              <p className="text-xs text-white/30">Распределение</p>
            </div>
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
              </div>
            ) : donutData.length > 0 ? (
              <OrdersDonutChart data={donutData} />
            ) : (
              <div className="flex h-48 items-center justify-center text-white/20 text-sm">Нет данных</div>
            )}
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top products */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
            <h3 className="mb-4 text-sm font-semibold text-white">Топ товары</h3>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 rounded-lg bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : analytics?.topProducts?.length ? (
              <div className="space-y-2">
                {analytics.topProducts.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-white/5 transition-colors">
                    <span className="text-xs font-bold text-white/20 w-4">{i + 1}</span>
                    {p.image && <img src={p.image} alt="" className="h-8 w-8 rounded-lg object-cover bg-white/5" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{p.name}</p>
                      <p className="text-[10px] text-white/30">{p.sales} продаж</p>
                    </div>
                    <span className="text-xs font-semibold text-emerald-400">{fmtRub(p.revenue)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/20 text-center py-8">Нет данных</p>
            )}
          </div>

          {/* Recent transactions */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
            <h3 className="mb-4 text-sm font-semibold text-white">Последние заказы</h3>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 rounded-lg bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : analytics?.transactions?.length ? (
              <div className="space-y-2">
                {analytics.transactions.map(t => (
                  <div key={t.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-white/5 transition-colors">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                      <TrendingUp className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{t.description}</p>
                      <p className="text-[10px] text-white/30">{new Date(t.date).toLocaleDateString('ru-RU')}</p>
                    </div>
                    <span className="text-xs font-semibold text-emerald-400">+{fmtRub(t.amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/20 text-center py-8">Нет данных</p>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
