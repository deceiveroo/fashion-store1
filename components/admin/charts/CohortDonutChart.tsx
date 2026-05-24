'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useChartTheme } from '@/hooks/useChartTheme';

interface CohortDonutChartProps {
  data: Array<{ name: string; value: number; color: string }>;
}

export function CohortDonutChart({ data }: CohortDonutChartProps) {
  const chart = useChartTheme();
  const total = data.reduce((s, d) => s + d.value, 0);
  const returning = data.find(d => d.name === 'Повторные')?.value || 0;
  const rate = total > 0 ? Math.round((returning / total) * 100) : 0;

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
            outerRadius={88}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={chart.tooltip}
            formatter={(value) => [`${value} клиентов`, 'Количество']}
          />
          <Legend
            verticalAlign="bottom"
            height={40}
            iconType="circle"
            formatter={(value) => (
              <span style={{ color: chart.legend, fontSize: 12 }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 text-center">
        <p className="text-3xl font-extrabold text-[var(--admin-text)]">{rate}%</p>
        <p className="text-[10px] uppercase tracking-wider text-[var(--admin-text-faint)]">Retention</p>
      </div>
    </div>
  );
}
