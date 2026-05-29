'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useChartTheme } from '@/hooks/useChartTheme';

interface SalesDayOfWeekChartProps {
  data: Array<{ day: string; revenue: number; orders: number }>;
}

export function SalesDayOfWeekChart({ data }: SalesDayOfWeekChartProps) {
  const chart = useChartTheme();

  if (!chart.mounted) {
    return <div className="h-[280px] w-full min-h-[280px] animate-pulse rounded-xl bg-[var(--admin-bg-muted)]" />;
  }

  return (
    <div className="h-[280px] w-full min-h-[280px] min-w-0">
      <ResponsiveContainer width="100%" height={280} minWidth={0}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="salesDayFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#0d9488" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
          <XAxis dataKey="day" stroke={chart.axis} tick={{ fill: chart.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            stroke={chart.axis}
            tick={{ fill: chart.axis, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${Math.round(v / 1000)}k`}
          />
          <Tooltip
            contentStyle={chart.tooltip}
            labelStyle={{ color: chart.tooltip.color, fontWeight: 600 }}
            cursor={{ fill: 'rgba(16,185,129,0.08)' }}
            formatter={((value: number) => [`${Math.round(value).toLocaleString('ru-RU')} ₽`, 'Выручка']) as never}
          />
          <Bar dataKey="revenue" fill="url(#salesDayFill)" radius={[6, 6, 0, 0]} maxBarSize={42} animationDuration={900} animationEasing="ease-out" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
