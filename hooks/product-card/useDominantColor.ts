'use client';

import { useEffect, useState } from 'react';
import { applyDominantColorVars, extractDominantColor, type DominantColor } from '@/lib/product-card/color-extract';

export function useDominantColor(
  imageUrl: string,
  cardRef: React.RefObject<HTMLElement | null>,
  enabled = true
) {
  const [color, setColor] = useState<DominantColor | null>(null);

  useEffect(() => {
    if (!enabled || !imageUrl) return;
    let cancelled = false;

    void extractDominantColor(imageUrl).then((result) => {
      if (cancelled || !result) return;
      setColor(result);
      if (cardRef.current) applyDominantColorVars(cardRef.current, result);
    });

    return () => {
      cancelled = true;
    };
  }, [imageUrl, enabled, cardRef]);

  return color;
}
