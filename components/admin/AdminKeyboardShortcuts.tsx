'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Ctrl+Shift+P → товары, Ctrl+Shift+O → заказы */
export function AdminKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (!e.ctrlKey || !e.shiftKey) return;
      if (e.key === 'P' || e.key === 'p') {
        e.preventDefault();
        router.push('/admin/products');
      }
      if (e.key === 'O' || e.key === 'o') {
        e.preventDefault();
        router.push('/admin/orders');
      }
      if (e.key === 'D' || e.key === 'd') {
        e.preventDefault();
        router.push('/admin/dashboard');
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [router]);

  return null;
}
