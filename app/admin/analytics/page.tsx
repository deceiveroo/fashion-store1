'use client';

import { useState, useEffect } from 'react';
import { DollarSign, ShoppingCart, TrendingUp, RefreshCw, Users, Activity, BarChart3, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import AdminShell from '@/components/admin/AdminShell';
import { RevenueChart } from '@/components/admin/charts/RevenueChart';
import { OrdersDonutChart } from '@/components/admin/charts/OrdersDonutChart';
import { CategoryBarChart } from '@/components/admin/charts/CategoryBarChart';
import { CohortDonutChart } from '@/components/admin/charts/CohortDonutChart';
import { SalesDayOfWeekChart } from '@/components/admin/charts/SalesDayOfWeekChart';
import { FunnelChart } from '@/components/admin/charts/FunnelChart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useChartTheme } from '@/hooks/useChartTheme';

interface Analytics {
  revenueByMonth: { month: string; revenue: number; orders: number }[];
  ordersByStatus: Record<string, number>;
  topProducts: { id: string; name: string; sales: number; revenue: number }[];
  customerGrowth: { totalCustomers: number; newCustomers: number; growthRate: number; chartData: { month: string; customers: number }[] };
  cohortData?: Array<{ name: string; value: number; color: string }>;
  salesByDayOfWeek?: Array<{ day: string; revenue: number; orders: number }>;
  funnelData?: Array<{ name: string; count: number; rate: number }>;
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
  const chart = useChartTheme();
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
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--admin-text)] flex items-center gap-2">
              <BarChart3 className="h-7 w-7 text-[var(--admin-accent)]" />
              Аналитика
            </h1>
            <p className="text-sm text-[var(--admin-text-muted)] mt-1">Статистика и отчёты магазина</p>
          </div>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] px-4 py-2.5 text-sm text-[var(--admin-text-muted)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-card-hover)] transition-all disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Обновить данные
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Общая выручка', value: loading ? '—' : fmt(totalRevenue), icon: DollarSign, color: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400', trend: '+12%' },
            { label: 'Всего заказов', value: loading ? '—' : totalOrders.toLocaleString('ru-RU'), icon: ShoppingCart, color: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400', trend: '+8%' },
            { label: 'Средний чек', value: loading ? '—' : fmt(avgOrder), icon: TrendingUp, color: 'bg-[var(--admin-accent)]/15 text-[var(--admin-accent)]' },
            { label: 'Клиенты', value: loading ? '—' : (analytics?.customerGrowth.totalCustomers || 0).toLocaleString('ru-RU'), icon: Users, color: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400', trend: '+5%' },
          ].map(({ label, value, icon: Icon, color, trend }) => (
            <div key={label} className="group relative overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5 hover:bg-[var(--admin-card-hover)] transition-all shadow-sm hover:shadow-md">
              {trend && (
                <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-1 shadow-sm">
                  <TrendingUp className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{trend}</span>
                </div>
              )}
              <div className="relative z-10">
                <p className="text-xs font-medium text-[var(--admin-text-muted)] uppercase tracking-wider mb-3">{label}</p>
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-bold text-[var(--admin-text)]">{value}</p>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color} shadow-lg`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Revenue chart */}
        <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--admin-text)] flex items-center gap-2">
              <Activity className="h-4 w-4 text-[var(--admin-accent)]" />
              Динамика выручки
            </h3>
            <ArrowUpRight className="h-4 w-4 text-[var(--admin-text-faint)]" />
          </div>
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--admin-accent)] border-t-transparent" />
            </div>
          ) : analytics?.revenueByMonth ? (
            <RevenueChart data={analytics.revenueByMonth} />
          ) : (
            <div className="flex h-48 items-center justify-center text-[var(--admin-text-faint)] text-sm">Нет данных</div>
          )}
        </div>

        {/* Charts row */}
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[var(--admin-text)] flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Статусы заказов
              </h3>
              <ArrowUpRight className="h-4 w-4 text-[var(--admin-text-faint)]" />
            </div>
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--admin-accent)] border-t-transparent" />
              </div>
            ) : donutData.length > 0 ? (
              <OrdersDonutChart data={donutData} />
            ) : (
              <div className="flex h-48 items-center justify-center text-[var(--admin-text-faint)] text-sm">Нет данных</div>
            )}
          </div>

          <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[var(--admin-text)] flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Топ товары
              </h3>
              <ArrowUpRight className="h-4 w-4 text-[var(--admin-text-faint)]" />
            </div>
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--admin-accent)] border-t-transparent" />
              </div>
            ) : barData.length > 0 ? (
              <CategoryBarChart data={barData} />
            ) : (
              <div className="flex h-48 items-center justify-center text-[var(--admin-text-faint)] text-sm">Нет данных</div>
            )}
          </div>
        </div>

        {/* Funnel & Retention row */}
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[var(--admin-text)] flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-pink-500" />
                Воронка конверсии (Shopping Funnel)
              </h3>
              <ArrowUpRight className="h-4 w-4 text-[var(--admin-text-faint)]" />
            </div>
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--admin-accent)] border-t-transparent" />
              </div>
            ) : analytics?.funnelData ? (
              <FunnelChart data={analytics.funnelData} />
            ) : (
              <div className="flex h-48 items-center justify-center text-[var(--admin-text-faint)] text-sm">Нет данных</div>
            )}
          </div>

          <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[var(--admin-text)] flex items-center gap-2">
                <Users className="h-4 w-4 text-[var(--admin-accent)]" />
                Удержание клиентов (Returning Customers)
              </h3>
              <ArrowUpRight className="h-4 w-4 text-[var(--admin-text-faint)]" />
            </div>
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--admin-accent)] border-t-transparent" />
              </div>
            ) : analytics?.cohortData ? (
              <CohortDonutChart data={analytics.cohortData} />
            ) : (
              <div className="flex h-48 items-center justify-center text-[var(--admin-text-faint)] text-sm">Нет данных</div>
            )}
          </div>
        </div>

        {/* Weekday sales & Customer growth */}
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[var(--admin-text)] flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                Распределение выручки по дням недели
              </h3>
              <ArrowUpRight className="h-4 w-4 text-[var(--admin-text-faint)]" />
            </div>
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--admin-accent)] border-t-transparent" />
              </div>
            ) : analytics?.salesByDayOfWeek ? (
              <SalesDayOfWeekChart data={analytics.salesByDayOfWeek} />
            ) : (
              <div className="flex h-48 items-center justify-center text-[var(--admin-text-faint)] text-sm">Нет данных</div>
            )}
          </div>

          {/* Customer growth */}
          {analytics?.customerGrowth && (
            <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[var(--admin-text)] flex items-center gap-2">
                  <Users className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  Рост клиентской базы
                </h3>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-[var(--admin-text-muted)]">Всего: <span className="text-[var(--admin-text)] font-semibold">{analytics.customerGrowth.totalCustomers}</span></span>
                  <span className="text-[var(--admin-text-muted)]">Новых: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">+{analytics.customerGrowth.newCustomers}</span></span>
                  <span className={`font-semibold ${analytics.customerGrowth.growthRate >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {analytics.customerGrowth.growthRate >= 0 ? '+' : ''}{analytics.customerGrowth.growthRate}%
                  </span>
                </div>
              </div>
              <div className="h-[230px] w-full">
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={analytics.customerGrowth.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      stroke={chart.axis} 
                      tick={{ fill: chart.axis, fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke={chart.axis} 
                      tick={{ fill: chart.axis, fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={chart.tooltip}
                      labelStyle={{ color: chart.tooltip.color, fontWeight: 600 }}
                      formatter={(value) => [`${Number(value)} клиентов`, 'Новые']}
                    />
                    <Bar 
                      dataKey="customers" 
                      fill="#8b5cf6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}

