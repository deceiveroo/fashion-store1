'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

export default function AnimatedGradient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== 'light';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      time += 0.005;

      ctx.fillStyle = isDark ? '#07070f' : '#f1f5f9';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const orbs = isDark
        ? [
            { x: 0.2, y: 0.3, radius: 0.4, color: [139, 92, 246], speed: 0.3 },
            { x: 0.8, y: 0.7, radius: 0.35, color: [99, 102, 241], speed: 0.4 },
            { x: 0.5, y: 0.5, radius: 0.3, color: [168, 85, 247], speed: 0.35 },
          ]
        : [
            { x: 0.15, y: 0.2, radius: 0.45, color: [167, 139, 250], speed: 0.25 },
            { x: 0.85, y: 0.75, radius: 0.4, color: [129, 140, 248], speed: 0.3 },
            { x: 0.55, y: 0.45, radius: 0.35, color: [196, 181, 253], speed: 0.28 },
          ];

      orbs.forEach((orb, index) => {
        const x = (orb.x + Math.sin(time * orb.speed + index) * 0.1) * canvas.width;
        const y = (orb.y + Math.cos(time * orb.speed * 0.8 + index) * 0.1) * canvas.height;
        const radius = orb.radius * Math.min(canvas.width, canvas.height);
        const alpha = isDark ? 0.08 : 0.18;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, `rgba(${orb.color.join(',')}, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(${orb.color.join(',')}, ${alpha * 0.5})`);
        gradient.addColorStop(1, `rgba(${orb.color.join(',')}, 0)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none opacity-60 dark:opacity-50"
      style={{ zIndex: 0 }}
      aria-hidden
    />
  );
}
