'use client';

import { Users, TrendingUp } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

interface CustomerGrowthWidgetProps {
  totalCustomers: number;
  newCustomers: number;
  growthRate: number;
  chartData: Array<{ month: string; customers: number }>;
}

export function CustomerGrowthWidget({ 
  totalCustomers, 
  newCustomers, 
  growthRate,
  chartData 
}: CustomerGrowthWidgetProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-lg">
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Рост клиентов</h3>
          </div>
          
          <div className="mt-4">
            <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              {totalCustomers.toLocaleString('ru-RU')}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                +{newCustomers} новых
              </span>
              <div className="flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 rounded-full">
                <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
                <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                  {growthRate}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-[100px] -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="customers" 
              stroke="#3b82f6" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorCustomers)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
