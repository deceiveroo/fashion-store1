'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Pie, Radar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Props {
  stats: {
    ordersByStatus: Record<string, number>;
    revenueByMonth?: Array<{ month: string; revenue: number }>;
    popularProducts?: Array<{ id: string; name: string; sales: number }>;
  };
}

export function DashboardCharts({ stats }: Props) {
  const labels = Object.keys(stats.ordersByStatus || {});
  const pieData = {
    labels,
    datasets: [
      {
        data: Object.values(stats.ordersByStatus || {}),
        backgroundColor: ['#8b5cf6', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#64748b'],
      },
    ],
  };

  const rev = stats.revenueByMonth ?? [];
  const lineData = {
    labels: rev.map((r) => r.month),
    datasets: [
      {
        label: 'Выручка',
        data: rev.map((r) => Number(r.revenue || 0)),
        borderColor: '#7c3aed',
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const popular = stats.popularProducts ?? [];
  const radarData = {
    labels: popular.slice(0, 5).map((p) => (p.name.length > 20 ? p.name.slice(0, 18) + '…' : p.name)),
    datasets: [
      {
        label: 'Продажи',
        data: popular.slice(0, 5).map((p) => p.sales),
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        borderColor: '#8b5cf6',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-white">Выручка по месяцам</h3>
        {rev.length > 0 ? (
          <Line data={lineData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        ) : (
          <p className="py-8 text-center text-sm text-zinc-500">Нет данных за период</p>
        )}
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-white">Заказы по статусам</h3>
        {labels.length > 0 ? (
          <Pie data={pieData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
        ) : (
          <p className="py-8 text-center text-sm text-zinc-500">Нет данных</p>
        )}
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-white">Топ товаров</h3>
        {popular.length > 0 ? (
          <Radar data={radarData} options={{ responsive: true, scales: { r: { beginAtZero: true } } }} />
        ) : (
          <p className="py-8 text-center text-sm text-zinc-500">Нет продаж</p>
        )}
      </div>
    </div>
  );
}
