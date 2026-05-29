'use client';

import { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

type Accent = 'violet' | 'blue' | 'emerald' | 'amber' | 'rose' | 'cyan';

const accents: Record<Accent, { tile: string; glow: string }> = {
  violet:  { tile: 'from-violet-500 to-indigo-600 shadow-violet-500/30',  glow: 'bg-violet-500/30' },
  blue:    { tile: 'from-blue-500 to-cyan-600 shadow-blue-500/30',        glow: 'bg-blue-500/30' },
  emerald: { tile: 'from-emerald-500 to-teal-600 shadow-emerald-500/30',  glow: 'bg-emerald-500/30' },
  amber:   { tile: 'from-amber-500 to-orange-600 shadow-amber-500/30',    glow: 'bg-amber-500/30' },
  rose:    { tile: 'from-rose-500 to-pink-600 shadow-rose-500/30',        glow: 'bg-rose-500/30' },
  cyan:    { tile: 'from-cyan-500 to-sky-600 shadow-cyan-500/30',         glow: 'bg-cyan-500/30' },
};

interface AdminStatCardProps {
  title: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  accent?: Accent;
  /** Опциональный тренд в %, знак задаёт цвет (рост — emerald, падение — rose). */
  trend?: number;
  className?: string;
}

export default function AdminStatCard({
  title,
  value,
  sub,
  icon: Icon,
  accent = 'violet',
  trend,
  className,
}: AdminStatCardProps) {
  const a = accents[accent];
  const up = (trend ?? 0) >= 0;

  return (
    <div className={clsx('admin-card admin-card-interactive admin-sheen group relative overflow-hidden p-5 h-full', className)}>
      {/* Цветной ореол акцента */}
      <div
        className={clsx(
          'pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-50 blur-3xl transition-opacity duration-500 group-hover:opacity-90',
          a.glow,
        )}
      />
      {/* Верхняя акцентная линия */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-70"
        style={{ backgroundImage: 'var(--admin-accent-gradient)' }}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-text-faint)]">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums text-[var(--admin-text)]">{value}</p>
          <div className="mt-1.5 flex items-center gap-2">
            {typeof trend === 'number' && (
              <span
                className={clsx(
                  'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold',
                  up ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500',
                )}
              >
                {up ? '↑' : '↓'} {Math.abs(trend)}%
              </span>
            )}
            <span className="truncate text-xs text-[var(--admin-text-muted)]">{sub ?? ' '}</span>
          </div>
        </div>
        <div
          className={clsx(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition-transform duration-300 group-hover:scale-105',
            a.tile,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
