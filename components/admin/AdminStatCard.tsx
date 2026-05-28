'use client';

import { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

type Accent = 'violet' | 'blue' | 'emerald' | 'amber' | 'rose' | 'cyan';

const accents: Record<Accent, string> = {
  violet: 'from-violet-500/25 to-violet-600/5 text-violet-600 dark:text-violet-400 ring-violet-500/20',
  blue: 'from-blue-500/25 to-blue-600/5 text-blue-600 dark:text-blue-400 ring-blue-500/20',
  emerald: 'from-emerald-500/25 to-emerald-600/5 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20',
  amber: 'from-amber-500/25 to-amber-600/5 text-amber-600 dark:text-amber-400 ring-amber-500/20',
  rose: 'from-rose-500/25 to-rose-600/5 text-rose-600 dark:text-rose-400 ring-rose-500/20',
  cyan: 'from-cyan-500/25 to-cyan-600/5 text-cyan-600 dark:text-cyan-400 ring-cyan-500/20',
};

interface AdminStatCardProps {
  title: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  accent?: Accent;
  className?: string;
}

export default function AdminStatCard({
  title,
  value,
  sub,
  icon: Icon,
  accent = 'violet',
  className,
}: AdminStatCardProps) {
  return (
    <div className={clsx('admin-card group relative overflow-hidden p-6 h-full', className)}>
      <div
        className={clsx(
          'absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-40 blur-2xl transition-opacity group-hover:opacity-70',
          accents[accent],
        )}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-text-faint)]">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[var(--admin-text)]">{value}</p>
          <p className="mt-1.5 text-xs text-[var(--admin-text-muted)]">{sub ?? ' '}</p>
        </div>
        <div
          className={clsx(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ring-1',
            accents[accent],
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
