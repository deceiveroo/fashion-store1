'use client';

import { Package, TrendingUp } from 'lucide-react';
import { OrdersDonutChart } from './charts/OrdersDonutChart';

interface OrderStatisticsWidgetProps {
  totalOrders: number;
  ordersByStatus: Record<string, number>;
}

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

export function OrderStatisticsWidget({ totalOrders, ordersByStatus }: OrderStatisticsWidgetProps) {
  const chartData = Object.entries(ordersByStatus).map(([status, count]) => ({
    name: statusLabels[status] || status,
    value: count,
    color: statusColors[status] || '#6b7280',
  }));

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Статистика заказов</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Распределение по статусам</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
          <Package className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">{totalOrders}</span>
        </div>
      </div>

      <OrdersDonutChart data={chartData} />

      <div className="mt-6 grid grid-cols-2 gap-4">
        {Object.entries(ordersByStatus).slice(0, 4).map(([status, count]) => (
          <div key={status} className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: statusColors[status] || '#6b7280' }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{statusLabels[status] || status}</p>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{count}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
