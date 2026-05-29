'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useChartTheme } from '@/hooks/useChartTheme';

interface OrdersDonutChartProps {
  data: Array<{ name: string; value: number; color: string }>;
}

export function OrdersDonutChart({ data }: OrdersDonutChartProps) {
  const chart = useChartTheme();
  const total = data.reduce((s, d) => s + d.value, 0);

  if (!chart.mounted) {
    return <div className="h-[280px] w-full min-h-[280px] animate-pulse rounded-xl bg-[var(--admin-bg-muted)]" />;
  }

  return (
    <div className="relative h-[280px] w-full min-h-[280px] min-w-0">
      <ResponsiveContainer width="100%" height={280} minWidth={0}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={58}
            outerRadius={90}
            paddingAngle={3}
            cornerRadius={6}
            dataKey="value"
            stroke={chart.isDark ? 'rgba(18,18,31,0.6)' : 'rgba(255,255,255,0.7)'}
            strokeWidth={2}
            animationDuration={900}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={chart.tooltip} />
          <Legend
            verticalAlign="bottom"
            height={40}
            iconType="circle"
            formatter={(value) => <span style={{ color: chart.legend, fontSize: 12 }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 text-center">
        <p className="text-2xl font-bold tabular-nums text-[var(--admin-text)]">{total}</p>
        <p className="text-[10px] uppercase tracking-wider text-[var(--admin-text-faint)]">заказов</p>
      </div>
    </div>
  );
}
