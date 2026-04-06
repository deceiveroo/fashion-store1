'use client';

import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color: 'violet' | 'blue' | 'green' | 'orange' | 'pink' | 'cyan';
}

const colorClasses = {
  violet: {
    bg: 'from-violet-500 to-purple-600',
    iconBg: 'bg-violet-100 dark:bg-violet-900/30',
    iconColor: 'text-violet-600 dark:text-violet-400',
    shadow: 'shadow-violet-500/20',
  },
  blue: {
    bg: 'from-blue-500 to-cyan-600',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    shadow: 'shadow-blue-500/20',
  },
  green: {
    bg: 'from-emerald-500 to-teal-600',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    shadow: 'shadow-emerald-500/20',
  },
  orange: {
    bg: 'from-orange-500 to-red-600',
    iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    iconColor: 'text-orange-600 dark:text-orange-400',
    shadow: 'shadow-orange-500/20',
  },
  pink: {
    bg: 'from-pink-500 to-rose-600',
    iconBg: 'bg-pink-100 dark:bg-pink-900/30',
    iconColor: 'text-pink-600 dark:text-pink-400',
    shadow: 'shadow-pink-500/20',
  },
  cyan: {
    bg: 'from-cyan-500 to-blue-600',
    iconBg: 'bg-cyan-100 dark:bg-cyan-900/30',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    shadow: 'shadow-cyan-500/20',
  },
};

export function StatCard({ title, value, icon: Icon, trend, color }: StatCardProps) {
  const colors = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group"
    >
      <div className={`relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-lg ${colors.shadow} hover:shadow-xl transition-all duration-300`}>
        {/* Decorative gradient background */}
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colors.bg} opacity-5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500`} />
        
        <div className="relative flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">{title}</p>
            <h3 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">{value}</h3>
            
            {trend && (
              <div className="flex items-center gap-1">
                <span className={`text-sm font-semibold ${trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {trend.isPositive ? '↑' : '↓'} {trend.value}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-500">за месяц</span>
              </div>
            )}
          </div>
          
          <div className={`${colors.iconBg} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`h-6 w-6 ${colors.iconColor}`} />
          </div>
        </div>

        {/* Bottom accent line */}
        <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${colors.bg} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
      </div>
    </motion.div>
  );
}
