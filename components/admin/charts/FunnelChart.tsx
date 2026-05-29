'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
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
        <BarChart data={data} layout="vertical" margin={{ top: 10, right: 44, left: 10, bottom: 5 }}>
          <defs>
            {FUNNEL_COLORS.map((c, i) => (
              <linearGradient key={i} id={`funnelFill${i}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={c} stopOpacity={0.65} />
                <stop offset="100%" stopColor={c} stopOpacity={1} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} horizontal={false} />
          <XAxis type="number" stroke={chart.axis} tick={{ fill: chart.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
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
            cursor={{ fill: chart.cursor }}
            formatter={((value: number, _name: unknown, props: { payload?: { rate?: number } }) => {
              const rate = props.payload?.rate;
              return [`${value.toLocaleString('ru-RU')} (${rate}%)`, 'Объем'];
            }) as never}
          />
          <Bar dataKey="count" radius={[0, 8, 8, 0]} maxBarSize={34} animationDuration={900} animationEasing="ease-out">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={`url(#funnelFill${index % FUNNEL_COLORS.length})`} />
            ))}
            <LabelList
              dataKey="rate"
              position="right"
              formatter={((v: number) => `${v}%`) as never}
              style={{ fill: chart.axis, fontSize: 11, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
