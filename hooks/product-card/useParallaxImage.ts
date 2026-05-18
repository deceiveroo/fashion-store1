'use client';

import { useCallback, useEffect, useRef } from 'react';

const MAX_TILT = 8;
const MAX_GYRO = 6;

export function useParallaxImage(enabled = true) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const rafId = useRef<number | null>(null);

  const animate = useCallback(() => {
    const img = imageRef.current;
    if (!img) return;

    current.current.x += (target.current.x - current.current.x) * 0.12;
    current.current.y += (target.current.y - current.current.y) * 0.12;

    img.style.transform = `translate3d(${current.current.x}px, ${current.current.y}px, 0) scale(1.06)`;

    if (
      Math.abs(target.current.x - current.current.x) > 0.05 ||
      Math.abs(target.current.y - current.current.y) > 0.05
    ) {
      rafId.current = requestAnimationFrame(animate);
    } else {
      rafId.current = null;
    }
  }, []);

  const scheduleAnimate = useCallback(() => {
    if (rafId.current === null) {
      rafId.current = requestAnimationFrame(animate);
    }
  }, [animate]);

  const setTarget = useCallback(
    (x: number, y: number) => {
      target.current = { x, y };
      scheduleAnimate();
    },
    [scheduleAnimate]
  );

  useEffect(() => {
    if (!enabled) return;
    const container = containerRef.current;
    if (!container) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      setTarget(nx * MAX_TILT * 2, ny * MAX_TILT * 2);
    };

    const onPointerLeave = () => setTarget(0, 0);

    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      setTarget(
        Math.max(-MAX_GYRO, Math.min(MAX_GYRO, e.gamma / 8)),
        Math.max(-MAX_GYRO, Math.min(MAX_GYRO, (e.beta - 45) / 12))
      );
    };

    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerleave', onPointerLeave);

    const isTouch = 'ontouchstart' in window;
    if (isTouch && typeof DeviceOrientationEvent !== 'undefined') {
      window.addEventListener('deviceorientation', onOrientation);
    }

    return () => {
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('deviceorientation', onOrientation);
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, [enabled, setTarget]);

  return { containerRef, imageRef };
}
