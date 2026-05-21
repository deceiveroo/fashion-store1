'use client';

import { useState, createContext, useContext, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
};

type ConfirmContextType = {
  showConfirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmProvider');
  }
  return context;
}

type ConfirmState = ConfirmOptions & {
  isOpen: boolean;
  resolve: ((value: boolean) => void) | null;
};

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [confirm, setConfirm] = useState<ConfirmState>({
    isOpen: false,
    message: '',
    resolve: null,
  });

  const showConfirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirm({
        isOpen: true,
        title: options.title || 'Подтверждение',
        message: options.message,
        confirmText: options.confirmText || 'Подтвердить',
        cancelText: options.cancelText || 'Отмена',
        variant: options.variant || 'warning',
        resolve,
      });
    });
  };

  const handleConfirm = () => {
    setConfirm((prev) => {
      prev.resolve?.(true);
      return { ...prev, isOpen: false, resolve: null };
    });
  };

  const handleCancel = () => {
    setConfirm((prev) => {
      prev.resolve?.(false);
      return { ...prev, isOpen: false, resolve: null };
    });
  };

  const getVariantStyles = () => {
    switch (confirm.variant) {
      case 'danger':
        return {
          icon: 'text-red-500',
          button: 'bg-red-600 hover:bg-red-700',
          border: 'border-red-500/30',
        };
      case 'info':
        return {
          icon: 'text-blue-500',
          button: 'bg-blue-600 hover:bg-blue-700',
          border: 'border-blue-500/30',
        };
      default:
        return {
          icon: 'text-yellow-500',
          button: 'bg-violet-600 hover:bg-violet-700',
          border: 'border-violet-500/30',
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <ConfirmContext.Provider value={{ showConfirm }}>
      {children}
      
      <AnimatePresence>
        {confirm.isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancel}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999]"
            />

            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center z-[10000] pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', duration: 0.3 }}
                onClick={(e) => e.stopPropagation()}
                className="pointer-events-auto w-full max-w-md mx-4"
              >
                <div className={`relative bg-gradient-to-br from-gray-900 via-slate-900 to-black rounded-2xl border ${variantStyles.border} shadow-2xl overflow-hidden`}>
                  {/* Decorative gradient */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl bg-white/5`}>
                          <AlertTriangle className={`w-5 h-5 ${variantStyles.icon}`} />
                        </div>
                        <h3 className="text-lg font-bold text-white">
                          {confirm.title}
                        </h3>
                      </div>
                      <button
                        onClick={handleCancel}
                        className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Message */}
                    <p className="text-white/70 text-sm leading-relaxed mb-6">
                      {confirm.message}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={handleCancel}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-all text-sm font-medium"
                      >
                        {confirm.cancelText}
                      </button>
                      <button
                        onClick={handleConfirm}
                        className={`flex-1 px-4 py-2.5 rounded-xl text-white transition-all text-sm font-medium ${variantStyles.button}`}
                      >
                        {confirm.confirmText}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}
