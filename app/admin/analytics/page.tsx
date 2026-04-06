'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Users,
  Calendar,
  Download,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/AdminLayout';
import { RevenueChart } from '@/components/admin/charts/RevenueChart';
import { CategoryBarChart } from '@/components/admin/charts/CategoryBarChart';
import { OrdersDonutChart } from '@/components/admin/charts/OrdersDonutChart';
import { RadialProgressChart } from '@/components/admin/charts/RadialProgressChart';

interface AnalyticsData {
  revenueByMonth: Array<{ month: string; revenue: number; orders: number }>;
  ordersByStatus: Record<string, number>;
  topProducts: Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
  }>;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [revenue, orders, products] = await Promise.all([
        fetch('/api/admin/analytics?type=revenue-by-month', { credentials: 'include' }).then(r => r.json()),
        fetch('/api/admin/analytics?type=orders-by-status', { credentials: 'include' }).then(r => r.json()),
        fetch('/api/admin/analytics?type=top-products', { credentials: 'include' }).then(r => r.json()),
      ]);

      setAnalytics({
        revenueByMonth: revenue,
        ordersByStatus: orders,
        topProducts: products,
      });
    } catch (error) {
      console.error('Load analytics error:', error);
      toast.error('Ошибка загрузки аналитики');
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    pending: '#f59e0b',
    processing: '#3b82f6',
    shipped: '#8b5cf6',
    delivered: '#10b981',
    cancelled: '#ef4444',
    returned: '#6b7280',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Ожидание',
    processing: 'В обработке',
    shipped: 'Отправлено',
    delivered: 'Доставлено',
    cancelled: 'Отменено',
    returned: 'Возврат',
  };

  const chartData = analytics ? Object.entries(analytics.ordersByStatus).map(([status, count]) => ({
    name: statusLabels[status] || status,
    value: count,
    color: statusColors[status] || '#6b7280',
  })) : [];

  const categoryData = analytics?.topProducts.map(p => ({
    category: p.name.slice(0, 15) + '...',
    sales: p.sales,
  })) || [];

  // Calculate metrics
  const totalRevenue = analytics?.revenueByMonth.reduce((sum, m) => sum + m.revenue, 0) || 0;
  const totalOrders = analytics?.revenueByMonth.reduce((sum, m) => sum + m.orders, 0) || 0;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const conversionRate = 68; // Mock data

  if (loading) {
    return (
      <AdminLayout currentPage="analytics">
        <div className="flex min-h-[600px] items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">Загрузка аналитики...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPage="analytics">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-700 via-purple-700 to-pink-700 bg-clip-text text-transparent dark:from-violet-400 dark:via-purple-400 dark:to-pink-400">
              Аналитика
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Подробная статистика и отчеты
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 rounded-xl p-1 shadow-lg border border-zinc-200 dark:border-zinc-700">
              {(['week', 'month', 'quarter', 'year'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    period === p
                      ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                  }`}
                >
                  {p === 'week' ? 'Неделя' : p === 'month' ? 'Месяц' : p === 'quarter' ? 'Квартал' : 'Год'}
                </button>
              ))}
            </div>
            
            <button className="flex items-center gap-2 rounded-xl bg-white dark:bg-zinc-800 px-5 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 shadow-lg ring-1 ring-zinc-200 dark:ring-zinc-700 transition-all hover:shadow-xl">
              <Download className="h-4 w-4" />
              Экспорт
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                +15.3%
              </span>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Общая выручка</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {Math.round(totalRevenue).toLocaleString('ru-RU')} ₽
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                +8.1%
              </span>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Всего заказов</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {totalOrders.toLocaleString('ru-RU')}
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
                <TrendingUp className="h-6 w-6 text-violet-600 dark:text-violet-400" />
              </div>
              <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30 px-2 py-1 rounded-full">
                +12.5%
              </span>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Средний чек</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {Math.round(avgOrderValue).toLocaleString('ru-RU')} ₽
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-full">
                {conversionRate}%
              </span>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Конверсия</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {conversionRate}%
            </p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Revenue Chart */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-lg lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Динамика выручки</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">По месяцам</p>
              </div>
            </div>
            {analytics?.revenueByMonth && (
              <RevenueChart data={analytics.revenueByMonth} />
            )}
          </div>

          {/* Orders by Status */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Статусы заказов</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Распределение</p>
              </div>
            </div>
            <OrdersDonutChart data={chartData} />
          </div>

          {/* Top Products */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Топ товары</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">По продажам</p>
              </div>
            </div>
            <CategoryBarChart data={categoryData} />
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-lg">
            <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-4">Выполнение плана</h3>
            <div className="flex items-center justify-center">
              <RadialProgressChart value={85} color="#8b5cf6" label="План" />
            </div>
            <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mt-4">
              85% от месячного плана
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-lg">
            <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-4">Удержание клиентов</h3>
            <div className="flex items-center justify-center">
              <RadialProgressChart value={72} color="#10b981" label="Retention" />
            </div>
            <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mt-4">
              72% повторных покупок
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-lg">
            <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-4">Удовлетворенность</h3>
            <div className="flex items-center justify-center">
              <RadialProgressChart value={92} color="#3b82f6" label="CSAT" />
            </div>
            <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mt-4">
              92% довольных клиентов
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
