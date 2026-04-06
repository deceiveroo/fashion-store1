// components/Toaster.tsx
'use client';

import { Toaster as SonnerToaster } from 'sonner';
import { Check, X, AlertTriangle, Info, Loader } from 'lucide-react';

const GlassIcons = {
  success: <Check className="w-5 h-5 text-emerald-600" />,
  error: <X className="w-5 h-5 text-rose-600" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-600" />,
  info: <Info className="w-5 h-5 text-blue-600" />,
  loading: <Loader className="w-5 h-5 text-purple-600 animate-spin" />,
};

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      expand={false}
      closeButton
      theme="light"
      duration={4000}
      offset={20}
      visibleToasts={3}
      gap={8}
      toastOptions={{
        classNames: {
          // Чистый стеклянный эффект
          toast: `
            group
            rounded-xl
            shadow-lg
            border
            border-white/30
            p-4
            min-w-[320px]
            backdrop-blur-md
            bg-white/90
            transition-all
            duration-300
          `,
          title: "font-semibold text-gray-900 flex items-center gap-3 text-sm",
          description: "text-gray-600 text-sm mt-1 ml-8",
          actionButton: `
            bg-black/5
            text-gray-900
            px-3
            py-2
            rounded-lg
            font-medium
            text-xs
            mt-2
            hover:bg-black/10
            transition-colors
            duration-200
          `,
          cancelButton: `
            bg-transparent
            text-gray-500
            px-3
            py-2
            rounded-lg
            font-medium
            text-xs
            mt-2
            hover:bg-black/5
            transition-colors
            duration-200
          `,
        },
      }}
      icons={GlassIcons}
    />
  );
}