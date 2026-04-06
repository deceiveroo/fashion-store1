'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  Activity,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/AdminLayout';
import { StatCard } from '@/components/admin/StatCard';
import { OrderStatisticsWidget } from '@/components/admin/OrderStatisticsWidget';
import { CustomerGrowthWidget } from '@/components/admin/CustomerGrowthWidget';
import { TopProductsWidget } from '@/components/admin/TopProductsWidget';
import { RecentTransactionsWidget } from '@/components/admin/RecentTransactionsWidget';
import { RevenueChart } from '@/components/admin/charts/RevenueChart';
import { CategoryBarChart } from '@/components/admin/charts/CategoryBarChart';

interface StatsData {
  overview: {
    totalUsers: number;
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
  };
}

interface AnalyticsData {
  revenueByMonth: Array<{ month: string; revenue: number; orders: number }>;
  ordersByStatus: Record<string, number>;
  topProducts: Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
    image?: string;
    trend: number;
  }>;
  customerGrowth: {
    totalCustomers: number;
    newCustomers: number;
    growthRate: number;
    chartData: Array<{ month: string; customers: number }>;
  };
  transactions: Array<{
    id: string;
    type: 'income' | 'expense';
    description: string;
    amount: number;
    date: string;
    method: string;
  }>;
}



export default function AdminDashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
    loadStats();
    loadAnalytics();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stats', { 
        credentials: 'include',
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        toast.error('Не удалось загрузить статистику');
      }
    } catch (error) {
      console.error('Load stats error:', error);
      toast.error('Ошибка загрузки статистики');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      // Загружаем последовательно, чтобы не исчерпать connection pool
      const revenue = await fetch('/api/admin/analytics?type=revenue-by-month', { credentials: 'include' })
        .then(r => r.ok ? r.json() : [])
        .catch(() => []);
      
      await new Promise(resolve => setTimeout(resolve, 100)); // Небольшая задержка
      
      const orders = await fetch('/api/admin/analytics?type=orders-by-status', { credentials: 'include' })
        .then(r => r.ok ? r.json() : {})
        .catch(() => ({}));
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const products = await fetch('/api/admin/analytics?type=top-products', { credentials: 'include' })
        .then(r => r.ok ? r.json() : [])
        .catch(() => []);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const customers = await fetch('/api/admin/analytics?type=customer-growth', { credentials: 'include' })
        .then(r => r.ok ? r.json() : { totalCustomers: 0, newCustomers: 0, growthRate: 0, chartData: [] })
        .catch(() => ({ totalCustomers: 0, newCustomers: 0, growthRate: 0, chartData: [] }));
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const transactions = await fetch('/api/admin/analytics?type=transactions', { credentials: 'include' })
        .then(r => r.ok ? r.json() : [])
        .catch(() => []);

      setAnalytics({
        revenueByMonth: Array.isArray(revenue) ? revenue : [],
        ordersByStatus: orders || {},
        topProducts: Array.isArray(products) ? products : [],
        customerGrowth: customers || { totalCustomers: 0, newCustomers: 0, growthRate: 0, chartData: [] },
        transactions: Array.isArray(transactions) ? transactions : [],
      });
    } catch (error) {
      console.error('Load analytics error:', error);
      // Устанавливаем пустые данные при ошибке
      setAnalytics({
        revenueByMonth: [],
        ordersByStatus: {},
        topProducts: [],
        customerGrowth: { totalCustomers: 0, newCustomers: 0, growthRate: 0, chartData: [] },
        transactions: [],
      });
    } finally {
      setAnalyticsLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout currentPage="dashboard">
        <div className="flex min-h-[600px] items-center justify-center">
          <div className="text-center">
            <div className="relative mx-auto h-20 w-20">
              <div className="absolute inset-0 animate-ping rounded-full bg-violet-400 opacity-75" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-purple-600">
                <Sparkles className="h-10 w-10 animate-pulse text-white" />
              </div>
            </div>
            <p className="mt-6 text-lg font-medium text-zinc-700 dark:text-zinc-300">Загрузка дашборда...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPage="dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-700 via-purple-700 to-pink-700 bg-clip-text text-transparent dark:from-violet-400 dark:via-purple-400 dark:to-pink-400">
              Дашборд
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Добро пожаловать в панель управления Fashion Store
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { loadStats(); loadAnalytics(); }}
              className="flex items-center gap-2 rounded-xl bg-white dark:bg-zinc-800 px-5 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 shadow-lg ring-1 ring-zinc-200 dark:ring-zinc-700 transition-all hover:shadow-xl"
            >
              <Activity className="h-4 w-4" />
              Обновить
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Всего пользователей"
            value={stats?.overview.totalUsers.toLocaleString('ru-RU') || 0}
            icon={Users}
            trend={{ value: '+12.5%', isPositive: true }}
            color="blue"
          />
          <StatCard
            title="Товары в каталоге"
            value={stats?.overview.totalProducts.toLocaleString('ru-RU') || 0}
            icon={Package}
            trend={{ value: '+5.2%', isPositive: true }}
            color="violet"
          />
          <StatCard
            title="Всего заказов"
            value={stats?.overview.totalOrders.toLocaleString('ru-RU') || 0}
            icon={ShoppingCart}
            trend={{ value: '+8.1%', isPositive: true }}
            color="green"
          />
          <StatCard
            title="Выручка"
            value={`${Math.round(stats?.overview.totalRevenue || 0).toLocaleString('ru-RU')} ₽`}
            icon={DollarSign}
            trend={{ value: '+15.3%', isPositive: true }}
            color="orange"
          />
        </div>

        {/* Charts Section */}
        {analyticsLoading ? (
          <div className="flex items-center justify-center h-64 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">Загрузка аналитики...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Revenue Chart */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Динамика выручки</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Последние 6 месяцев</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    ↑ 15.3%
                  </span>
                </div>
              </div>
              {analytics?.revenueByMonth && (
                <RevenueChart data={analytics.revenueByMonth} />
              )}
            </div>

            {/* Widgets Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Order Statistics */}
              {analytics?.ordersByStatus && (
                <OrderStatisticsWidget
                  totalOrders={stats?.overview.totalOrders || 0}
                  ordersByStatus={analytics.ordersByStatus}
                />
              )}

              {/* Customer Growth */}
              {analytics?.customerGrowth && (
                <CustomerGrowthWidget
                  totalCustomers={analytics.customerGrowth.totalCustomers}
                  newCustomers={analytics.customerGrowth.newCustomers}
                  growthRate={analytics.customerGrowth.growthRate}
                  chartData={analytics.customerGrowth.chartData}
                />
              )}

              {/* Top Products */}
              {analytics?.topProducts && (
                <TopProductsWidget products={analytics.topProducts} />
              )}
            </div>

            {/* Recent Transactions */}
            {analytics?.transactions && (
              <RecentTransactionsWidget transactions={analytics.transactions} />
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
