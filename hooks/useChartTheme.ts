'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function useChartTheme() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === 'dark';

  return {
    mounted,
    isDark,
    grid: isDark ? '#2a2a3d' : '#e2e8f0',
    axis: isDark ? '#64748b' : '#94a3b8',
    tooltip: {
      backgroundColor: isDark ? '#12121f' : '#ffffff',
      border: `1px solid ${isDark ? '#2d2d3d' : '#e2e8f0'}`,
      borderRadius: '10px',
      boxShadow: isDark ? '0 8px 32px rgb(0 0 0 / 0.4)' : '0 4px 16px rgb(15 23 42 / 0.08)',
      color: isDark ? '#f1f5f9' : '#334155',
    },
    legend: isDark ? '#94a3b8' : '#475569',
  };
}
