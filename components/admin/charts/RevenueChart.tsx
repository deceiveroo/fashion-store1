'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useChartTheme } from '@/hooks/useChartTheme';

interface RevenueChartProps {
  data: Array<{ month: string; revenue: number; orders: number }>;
}

export function RevenueChart({ data }: RevenueChartProps) {
  const chart = useChartTheme();

  if (!chart.mounted) {
    return <div className="h-[300px] w-full min-h-[300px] animate-pulse rounded-xl bg-[var(--admin-bg-muted)]" />;
  }

  return (
    <div className="h-[300px] w-full min-h-[300px] min-w-0">
      <ResponsiveContainer width="100%" height={300} minWidth={0}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={chart.isDark ? 0.35 : 0.25} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
          <XAxis dataKey="month" stroke={chart.axis} tick={{ fill: chart.axis, fontSize: 12 }} />
          <YAxis stroke={chart.axis} tick={{ fill: chart.axis, fontSize: 12 }} />
          <Tooltip
            contentStyle={chart.tooltip}
            labelStyle={{ color: chart.tooltip.color, fontWeight: 600 }}
            formatter={(value: number) => [`${Math.round(value).toLocaleString('ru-RU')} ₽`, 'Выручка']}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#8b5cf6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorRevenue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
