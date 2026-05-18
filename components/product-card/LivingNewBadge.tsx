'use client';

import { useEffect, useRef, useState } from 'react';

export default function LivingNewBadge() {
  const ref = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [played, setPlayed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || played) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !played) {
          setVisible(true);
          setPlayed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4, rootMargin: '0px 0px -10% 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [played]);

  return (
    <span
      ref={ref}
      role="status"
      aria-label="Новинка"
      className={`pointer-events-none absolute top-3 left-3 z-20 overflow-hidden px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.25em] text-white mix-blend-difference ${
        visible ? 'fc-new-badge-animate' : 'opacity-0'
      }`}
      style={{
        backgroundImage: visible
          ? 'repeating-linear-gradient(90deg, currentColor 0 2px, transparent 2px 4px)'
          : undefined,
      }}
    >
      <span className="relative z-10 bg-black/80 px-1.5 py-0.5 backdrop-blur-sm dark:bg-white/90 dark:text-black">
        New
      </span>
    </span>
  );
}
