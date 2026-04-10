'use client';

import { useState, useEffect } from 'react';
import { DollarSign, ShoppingCart, TrendingUp, Users, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import AdminShell from '@/components/admin/AdminShell';
import { RevenueChart } from '@/components/admin/charts/RevenueChart';
import { OrdersDonutChart } from '@/components/admin/charts/OrdersDonutChart';
import { CategoryBarChart } from '@/components/admin/charts/CategoryBarChart';

interface Analytics {
  revenueByMonth: { month: string; revenue: number; orders: number }[];
  ordersByStatus: Record<string, number>;
  topProducts: { id: string; name: string; sales: number; revenue: number }[];
  customerGrowth: { totalCustomers: number; newCustomers: number; growthRate: number; chartData: { month: string; customers: number }[] };
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидает', processing: 'Обработка', shipped: 'Отправлен',
  delivered: 'Доставлен', cancelled: 'Отменён', returned: 'Возврат',
};
const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b', processing: '#3b82f6', shipped: '#8b5cf6',
  delivered: '#10b981', cancelled: '#ef4444', returned: '#6b7280',
};

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/analytics?type=dashboard', { credentials: 'include' });
      if (res.ok) setAnalytics(await res.json());
      else toast.error('Ошибка загрузки аналитики');
    } catch { toast.error('Ошибка'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const totalRevenue = analytics?.revenueByMonth.reduce((s, m) => s + m.revenue, 0) || 0;
  const totalOrders = analytics?.revenueByMonth.reduce((s, m) => s + m.orders, 0) || 0;
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const donutData = analytics
    ? Object.entries(analytics.ordersByStatus).map(([s, c]) => ({
        name: STATUS_LABELS[s] || s, value: c as number, color: STATUS_COLORS[s] || '#6b7280',
      }))
    : [];

  const barData = analytics?.topProducts.map(p => ({ category: p.name.slice(0, 12), sales: p.sales })) || [];

  const fmt = (n: number) => `${Math.round(n).toLocaleString('ru-RU')} ₽`;

  return (
    <AdminShell>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Аналитика</h1>
            <p className="text-sm text-white/40">Статистика и отчёты</p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: 'Общая выручка', value: loading ? '—' : fmt(totalRevenue), icon: DollarSign, color: 'text-emerald-400 bg-emerald-500/10' },
            { title: 'Всего заказов', value: loading ? '—' : totalOrders.toLocaleString('ru-RU'), icon: ShoppingCart, color: 'text-blue-400 bg-blue-500/10' },
            { title: 'Средний чек', value: loading ? '—' : fmt(avgOrder), icon: TrendingUp, color: 'text-violet-400 bg-violet-500/10' },
          ].map(({ title, value, icon: Icon, color }) => (
            <div key={title} className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="text-xs text-white/30 uppercase tracking-wider">{title}</p>
              <p className="mt-1 text-2xl font-bold text-white">{value}</p>
            </div>
          ))}
        </div>

        {/* Revenue chart */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Динамика выручки</h3>
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

        {/* Charts row */}
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
            <h3 className="mb-4 text-sm font-semibold text-white">Статусы заказов</h3>
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

          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
            <h3 className="mb-4 text-sm font-semibold text-white">Топ товары</h3>
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
              </div>
            ) : barData.length > 0 ? (
              <CategoryBarChart data={barData} />
            ) : (
              <div className="flex h-48 items-center justify-center text-white/20 text-sm">Нет данных</div>
            )}
          </div>
        </div>

        {/* Customer growth */}
        {analytics?.customerGrowth && (
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Рост клиентской базы</h3>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-white/40">Всего: <span className="text-white font-semibold">{analytics.customerGrowth.totalCustomers}</span></span>
                <span className="text-white/40">Новых: <span className="text-emerald-400 font-semibold">+{analytics.customerGrowth.newCustomers}</span></span>
                <span className={`font-semibold ${analytics.customerGrowth.growthRate >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {analytics.customerGrowth.growthRate >= 0 ? '+' : ''}{analytics.customerGrowth.growthRate}%
                </span>
              </div>
            </div>
            <div className="flex items-end gap-1 h-24">
              {analytics.customerGrowth.chartData.map((d, i) => {
                const max = Math.max(...analytics.customerGrowth.chartData.map(x => x.customers));
                const h = max > 0 ? (d.customers / max) * 100 : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t-sm bg-violet-500/30 hover:bg-violet-500/50 transition-colors" style={{ height: `${h}%` }} title={`${d.customers}`} />
                    <span className="text-[9px] text-white/20">{d.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
