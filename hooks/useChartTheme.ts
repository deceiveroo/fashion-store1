'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

/**
 * Единая тема для всех recharts-графиков админки. Завязана на --admin-* язык
 * сайта: фиолетовый акцент, стеклянный тултип, мягкая сетка. Палитра `palette`
 * и `accent` используются для градиентных заливок (см. <defs> в каждом графике).
 */
export function useChartTheme() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === 'dark';

  return {
    mounted,
    isDark,
    // Мягкая, почти невидимая сетка — премиальнее жёстких линий.
    grid: isDark ? 'rgba(148,163,184,0.14)' : 'rgba(100,116,139,0.16)',
    axis: isDark ? '#7c7c98' : '#94a3b8',
    // Акцент сайта (fc/admin purple) + расширенная палитра для мульти-серий.
    accent: '#8b5cf6',
    accent2: isDark ? '#818cf8' : '#6366f1',
    palette: ['#8b5cf6', '#6366f1', '#a78bfa', '#c084fc', '#e879f9', '#22d3ee'],
    cursor: isDark ? 'rgba(139,92,246,0.14)' : 'rgba(139,92,246,0.08)',
    tooltip: {
      backgroundColor: isDark ? 'rgba(18,18,31,0.92)' : 'rgba(255,255,255,0.92)',
      border: `1px solid ${isDark ? 'rgba(139,92,246,0.35)' : 'rgba(139,92,246,0.22)'}`,
      borderRadius: '14px',
      boxShadow: isDark ? '0 16px 44px rgb(0 0 0 / 0.5)' : '0 16px 36px rgb(15 23 42 / 0.12)',
      color: isDark ? '#f1f5f9' : '#334155',
      padding: '10px 14px',
      backdropFilter: 'blur(14px) saturate(1.4)',
      WebkitBackdropFilter: 'blur(14px) saturate(1.4)',
      fontSize: '12px',
    } as React.CSSProperties,
    legend: isDark ? '#a3a3c2' : '#475569',
  };
}
