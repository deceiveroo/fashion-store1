'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { CatalogProduct } from '@/lib/catalog-products';

export type ScrollGestureMode = 'browse' | 'gallery';

type ProductExperienceContextValue = {
  soundEnabled: boolean;
  toggleSound: () => void;
  scrollMode: ScrollGestureMode;
  catalogPeers: CatalogProduct[];
  setCatalogPeers: (products: CatalogProduct[]) => void;
};

const ProductExperienceContext = createContext<ProductExperienceContextValue | null>(null);

function getTimeOfDay(): 'morning' | 'day' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 17) return 'day';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export function ProductExperienceProvider({ children }: { children: ReactNode }) {
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [scrollMode, setScrollMode] = useState<ScrollGestureMode>('browse');
  const [catalogPeers, setCatalogPeers] = useState<CatalogProduct[]>([]);
  const lastScrollY = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const velocitySamples = useRef<number[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('fc-sound-enabled');
      if (stored === 'true') setSoundEnabled(true);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-time', getTimeOfDay());
    const interval = setInterval(() => {
      document.documentElement.setAttribute('data-time', getTimeOfDay());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const now = Date.now();
      const dy = Math.abs(window.scrollY - lastScrollY.current);
      const dt = Math.max(now - lastScrollTime.current, 16);
      const velocity = dy / dt;
      velocitySamples.current.push(velocity);
      if (velocitySamples.current.length > 8) velocitySamples.current.shift();

      const avg =
        velocitySamples.current.reduce((a, b) => a + b, 0) /
        velocitySamples.current.length;

      setScrollMode(avg > 1.8 ? 'gallery' : 'browse');
      lastScrollY.current = window.scrollY;
      lastScrollTime.current = now;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-scroll-mode', scrollMode);
  }, [scrollMode]);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('fc-sound-enabled', String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      soundEnabled,
      toggleSound,
      scrollMode,
      catalogPeers,
      setCatalogPeers,
    }),
    [soundEnabled, toggleSound, scrollMode, catalogPeers]
  );

  return (
    <ProductExperienceContext.Provider value={value}>
      {children}
    </ProductExperienceContext.Provider>
  );
}

export function useProductExperience() {
  const ctx = useContext(ProductExperienceContext);
  if (!ctx) {
    return {
      soundEnabled: false,
      toggleSound: () => {},
      scrollMode: 'browse' as ScrollGestureMode,
      catalogPeers: [] as CatalogProduct[],
      setCatalogPeers: () => {},
    };
  }
  return ctx;
}
