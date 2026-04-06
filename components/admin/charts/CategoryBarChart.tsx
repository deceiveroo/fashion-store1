'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CategoryBarChartProps {
  data: Array<{ category: string; sales: number }>;
}

export function CategoryBarChart({ data }: CategoryBarChartProps) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-zinc-800" />
          <XAxis 
            dataKey="category" 
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
            className="dark:stroke-zinc-600"
          />
          <YAxis 
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
            className="dark:stroke-zinc-600"
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
            cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
          />
          <Bar 
            dataKey="sales" 
            fill="#8b5cf6" 
            radius={[8, 8, 0, 0]}
            maxBarSize={60}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
