'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

/** Polling новых заказов (мок real-time): каждые 30 с сравниваем count */
export function AdminOrderPoller() {
  const last = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const r = await fetch('/api/admin/stats?range=month', { cache: 'no-store' });
        if (!r.ok || cancelled) return;
        const data = await r.json();
        const n = data?.overview?.totalOrders ?? 0;
        if (last.current !== null && n > last.current) {
          toast.info(`Новых заказов: +${n - last.current}`, { duration: 6000 });
        }
        last.current = n;
      } catch {
        /* ignore */
      }
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return null;
}
