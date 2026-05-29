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
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={chart.isDark ? 0.55 : 0.4} />
              <stop offset="55%" stopColor="#8b5cf6" stopOpacity={chart.isDark ? 0.18 : 0.12} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="revenueStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
          <XAxis dataKey="month" stroke={chart.axis} tick={{ fill: chart.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis
            stroke={chart.axis}
            tick={{ fill: chart.axis, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={48}
            tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`)}
          />
          <Tooltip
            contentStyle={chart.tooltip}
            labelStyle={{ color: chart.tooltip.color, fontWeight: 600 }}
            cursor={{ stroke: chart.accent, strokeWidth: 1, strokeDasharray: '4 4' }}
            formatter={((value: number) => [`${Math.round(value).toLocaleString('ru-RU')} ₽`, 'Выручка']) as never}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="url(#revenueStroke)"
            strokeWidth={2.5}
            fill="url(#revenueFill)"
            fillOpacity={1}
            dot={false}
            activeDot={{ r: 5, fill: '#8b5cf6', stroke: chart.isDark ? '#12121f' : '#fff', strokeWidth: 2 }}
            animationDuration={1100}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
