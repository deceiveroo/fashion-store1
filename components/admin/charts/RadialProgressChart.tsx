'use client';

import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';

interface RadialProgressChartProps {
  value: number;
  color?: string;
  label?: string;
}

export function RadialProgressChart({ value, color = '#8b5cf6', label }: RadialProgressChartProps) {
  const data = [{ value, fill: color }];

  return (
    <div className="relative">
      <ResponsiveContainer width={120} height={120}>
        <RadialBarChart 
          cx="50%" 
          cy="50%" 
          innerRadius="70%" 
          outerRadius="100%" 
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <RadialBar
            background
            dataKey="value"
            cornerRadius={10}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{value}%</span>
        {label && <span className="text-xs text-zinc-500 dark:text-zinc-400">{label}</span>}
      </div>
    </div>
  );
}
