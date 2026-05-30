// components/Toaster.tsx
'use client';

import { Toaster as SonnerToaster } from 'sonner';
import { useTheme } from 'next-themes';
import { CheckCircle2, XCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';

const icons = {
  success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
  error: <XCircle className="h-5 w-5 text-rose-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
  info: <Info className="h-5 w-5 text-[#8b7cf6]" />,
  loading: <Loader2 className="h-5 w-5 animate-spin text-[#8b7cf6]" />,
};

/**
 * Стеклянные тосты в стиле сайта (fc-glass), адаптивные к теме. Раньше были захардкожены
 * под светлую тему (text-gray-900 / bg-white) — в тёмной теме нечитаемо.
 */
export function Toaster() {
  const { resolvedTheme } = useTheme();

  return (
    <SonnerToaster
      position="bottom-right"
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      closeButton
      duration={4000}
      offset={20}
      visibleToasts={4}
      gap={10}
      icons={icons}
      toastOptions={{
        classNames: {
          toast:
            'group !rounded-2xl !border !border-[var(--fc-glass-border)] !bg-[var(--fc-surface-elevated)] !text-[var(--foreground)] !shadow-[var(--fc-shadow-lifted)] !backdrop-blur-2xl !p-4 !min-w-[320px] !gap-3',
          title: '!text-[var(--foreground)] !font-semibold !text-sm',
          description: '!text-[var(--text-secondary)] !text-sm !mt-1',
          icon: '!m-0 flex items-center',
          closeButton:
            '!bg-[var(--fc-surface)] !border !border-[var(--fc-glass-border)] !text-[var(--text-secondary)] hover:!text-[var(--foreground)] hover:!bg-[var(--surface-hover)]',
          actionButton: '!rounded-lg !bg-[#8b7cf6] !text-white !text-xs !font-semibold',
          cancelButton: '!rounded-lg !bg-transparent !text-[var(--text-secondary)] !text-xs',
          success: '!border-emerald-500/35',
          error: '!border-rose-500/35',
          warning: '!border-amber-500/35',
          info: '!border-[rgba(139,124,246,0.35)]',
        },
      }}
    />
  );
}
