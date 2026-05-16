'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function AdminThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-9 w-9 rounded-lg bg-[var(--admin-card)]" aria-hidden />;
  }

  const cycle = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const Icon =
    theme === 'system' ? Monitor : resolvedTheme === 'dark' ? Sun : Moon;

  const label =
    theme === 'system' ? 'Системная тема' : resolvedTheme === 'dark' ? 'Светлая тема' : 'Тёмная тема';

  return (
    <button
      type="button"
      onClick={cycle}
      title={label}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-card-hover)] hover:text-[var(--admin-text)]"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
