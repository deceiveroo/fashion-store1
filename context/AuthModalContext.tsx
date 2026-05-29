'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type AuthMode = 'signin' | 'signup' | 'forgot';

type AuthModalContextValue = {
  isOpen: boolean;
  mode: AuthMode;
  open: (mode?: AuthMode) => void;
  setMode: (mode: AuthMode) => void;
  close: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | undefined>(undefined);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>('signin');

  const open = useCallback((next: AuthMode = 'signin') => {
    setMode(next);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo<AuthModalContextValue>(
    () => ({ isOpen, mode, open, setMode, close }),
    [isOpen, mode, open, close]
  );

  return <AuthModalContext.Provider value={value}>{children}</AuthModalContext.Provider>;
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error('useAuthModal must be used within an AuthModalProvider');
  return ctx;
}
