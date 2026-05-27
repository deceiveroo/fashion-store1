'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useChartTheme } from '@/hooks/useChartTheme';

interface FunnelChartProps {
  data: Array<{ name: string; count: number; rate: number }>;
}

const FUNNEL_COLORS = ['#8b5cf6', '#a78bfa', '#c084fc', '#e879f9'];

export function FunnelChart({ data }: FunnelChartProps) {
  const chart = useChartTheme();

  if (!chart.mounted) {
    return <div className="h-[280px] w-full min-h-[280px] animate-pulse rounded-xl bg-[var(--admin-bg-muted)]" />;
  }

  return (
    <div className="h-[280px] w-full min-h-[280px] min-w-0">
      <ResponsiveContainer width="100%" height={280} minWidth={0}>
        <BarChart 
          data={data} 
          layout="vertical"
          margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} horizontal={false} />
          <XAxis 
            type="number" 
            stroke={chart.axis} 
            tick={{ fill: chart.axis, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            stroke={chart.axis} 
            tick={{ fill: chart.axis, fontSize: 12, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
            width={85}
          />
          <Tooltip
            contentStyle={chart.tooltip}
            labelStyle={{ color: chart.tooltip.color, fontWeight: 600 }}
            formatter={((value: number, _name: unknown, props: { payload?: { rate?: number } }) => {
              const rate = props.payload?.rate;
              return [`${value.toLocaleString('ru-RU')} (${rate}%)`, 'Объем'];
            }) as never}
          />
          <Bar 
            dataKey="count" 
            radius={[0, 4, 4, 0]}
            maxBarSize={30}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
