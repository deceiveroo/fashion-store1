'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useChartTheme } from '@/hooks/useChartTheme';

interface CategoryBarChartProps {
  data: Array<{ category: string; sales: number }>;
}

export function CategoryBarChart({ data }: CategoryBarChartProps) {
  const chart = useChartTheme();

  if (!chart.mounted) {
    return <div className="h-[300px] w-full min-h-[300px] animate-pulse rounded-xl bg-[var(--admin-bg-muted)]" />;
  }

  return (
    <div className="h-[300px] w-full min-h-[300px] min-w-0">
      <ResponsiveContainer width="100%" height={300} minWidth={0}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="categoryFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
          <XAxis dataKey="category" stroke={chart.axis} tick={{ fill: chart.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis stroke={chart.axis} tick={{ fill: chart.axis, fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
          <Tooltip
            contentStyle={chart.tooltip}
            labelStyle={{ color: chart.tooltip.color, fontWeight: 600 }}
            cursor={{ fill: chart.cursor }}
          />
          <Bar dataKey="sales" fill="url(#categoryFill)" radius={[8, 8, 0, 0]} maxBarSize={56} animationDuration={900} animationEasing="ease-out" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
