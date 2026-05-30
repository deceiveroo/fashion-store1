'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, ShoppingBag, Play, RotateCcw, Pause, Heart } from 'lucide-react';

/**
 * 404 с мини-игрой «Лови моду». Стиль сайта (glassy/purple). Геймплей улучшен:
 * 3 жизни (а не game-over с первого промаха), уровни, рост сложности, бомбы 💣
 * (их ловить нельзя). Всё игровое состояние — в ref'ах (без stale-closure).
 */
export default function NotFoundPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  const g = useRef({
    basketX: 0,
    items: [] as Array<{ x: number; y: number; emoji: string; speed: number; rotation: number; bad: boolean }>,
    lastSpawn: 0,
    startedAt: 0,
    diff: 0, // 0..1 — плавно растёт по времени и счёту, управляет всей сложностью
    animationId: 0,
    isDark: true,
    running: false,
    score: 0,
    lives: 3,
  });

  // Рекорд + тема
  useEffect(() => {
    const saved = localStorage.getItem('elevate-404-highscore');
    if (saved) setHighScore(parseInt(saved) || 0);
    const detect = () => { g.current.isDark = document.documentElement.classList.contains('dark'); };
    detect();
    const obs = new MutationObserver(detect);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const endGame = useCallback(() => {
    g.current.running = false;
    setIsPlaying(false);
    setIsGameOver(true);
  }, []);

  // Игровой цикл
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const GOOD = ['👕', '👗', '👟', '👜', '🧢', '👠', '🎒', '👔', '🩳', '🧥', '💎', '⌚'];
    const BAD = ['💣', '🧨'];
    const BASKET_W = 86, BASKET_H = 60, ITEM = 36;

    const resize = () => {
      const r = container.getBoundingClientRect();
      canvas.width = r.width;
      canvas.height = r.height;
      if (!g.current.basketX) g.current.basketX = r.width / 2;
    };
    resize();
    window.addEventListener('resize', resize);

    const onPointer = (e: PointerEvent) => {
      if (!g.current.running) return;
      const r = canvas.getBoundingClientRect();
      g.current.basketX = Math.max(BASKET_W / 2, Math.min(r.width - BASKET_W / 2, e.clientX - r.left));
    };
    canvas.addEventListener('pointermove', onPointer);

    const spawn = () => {
      const d = g.current.diff; // 0..1
      // Бомбы появляются не сразу: 0% первые ~6с, затем плавно до 18%
      const badChance = Math.max(0, Math.min(0.18, (d - 0.08) * 0.26));
      const bad = Math.random() < badChance;
      // Скорость: спокойный старт (~1.5), плавный разгон до ~6
      const base = 1.5 + d * 4.2;
      const speed = base + Math.random() * (0.4 + d * 1.4);
      const emoji = bad ? BAD[Math.floor(Math.random() * BAD.length)] : GOOD[Math.floor(Math.random() * GOOD.length)];
      g.current.items.push({ x: Math.random() * (canvas.width - ITEM), y: -ITEM, emoji, speed, rotation: 0, bad });
    };

    const loseLife = () => {
      g.current.lives -= 1;
      setLives(g.current.lives);
      if (g.current.lives <= 0) endGame();
    };

    const draw = (ts: number) => {
      if (!g.current.running) return;
      const W = canvas.width, H = canvas.height, dark = g.current.isDark;
      ctx.clearRect(0, 0, W, H);

      const bg = ctx.createLinearGradient(0, 0, 0, H);
      if (dark) { bg.addColorStop(0, '#0f0b1e'); bg.addColorStop(1, '#141029'); }
      else { bg.addColorStop(0, '#f4efff'); bg.addColorStop(1, '#ece4ff'); }
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Плавный рост сложности: по времени (полный разгон ~75с) и по счёту,
      // берём максимум из двух — но всегда стартуем со спокойного темпа.
      const elapsed = (ts - g.current.startedAt) / 1000;
      const byTime = Math.min(1, elapsed / 75);
      const byScore = Math.min(1, g.current.score / 600);
      g.current.diff = Math.max(byTime, byScore);

      // Интервал спавна: редко в начале (~1300мс), плавно до ~480мс
      const interval = 1300 - g.current.diff * 820;
      if (ts - g.current.lastSpawn > interval) { spawn(); g.current.lastSpawn = ts; }

      const basketY = H - BASKET_H - 10;
      g.current.items = g.current.items.filter((it) => {
        it.y += it.speed;
        it.rotation += 0.02;
        const hit =
          it.x < g.current.basketX + BASKET_W / 2 &&
          it.x + ITEM > g.current.basketX - BASKET_W / 2 &&
          it.y + ITEM > basketY &&
          it.y < basketY + BASKET_H;
        if (hit) {
          if (it.bad) {
            loseLife();
          } else {
            g.current.score += 10;
            setScore(g.current.score);
            setLevel(Math.floor(g.current.score / 100) + 1);
            const hs = parseInt(localStorage.getItem('elevate-404-highscore') || '0') || 0;
            if (g.current.score > hs) {
              localStorage.setItem('elevate-404-highscore', String(g.current.score));
              setHighScore(g.current.score);
            }
          }
          return false;
        }
        if (it.y > H) {
          if (!it.bad) loseLife(); // промах по хорошему предмету — минус жизнь
          return false;
        }
        return true;
      });

      g.current.items.forEach((it) => {
        ctx.save();
        ctx.translate(it.x + ITEM / 2, it.y + ITEM / 2);
        ctx.rotate(it.rotation);
        ctx.font = `${ITEM}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 14;
        ctx.shadowColor = it.bad ? 'rgba(244,63,94,0.6)' : 'rgba(139,124,246,0.5)';
        ctx.fillText(it.emoji, 0, 0);
        ctx.restore();
      });
      ctx.shadowBlur = 0;

      ctx.font = `${BASKET_H}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 22;
      ctx.shadowColor = 'rgba(139,124,246,0.6)';
      ctx.fillText('🛒', g.current.basketX, basketY + BASKET_H / 2);
      ctx.shadowBlur = 0;

      g.current.animationId = requestAnimationFrame(draw);
    };

    if (isPlaying) {
      g.current.running = true;
      g.current.animationId = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(g.current.animationId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointermove', onPointer);
    };
  }, [isPlaying, endGame]);

  const start = () => {
    g.current.items = [];
    g.current.score = 0;
    g.current.lives = 3;
    g.current.diff = 0;
    g.current.startedAt = performance.now();
    g.current.lastSpawn = performance.now();
    setScore(0);
    setLives(3);
    setLevel(1);
    setIsGameOver(false);
    setIsPlaying(true);
  };
  const pause = () => {
    g.current.running = false;
    setIsPlaying(false);
  };

  return (
    <div className="fc-ambient-bg relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      {/* Акцентные орбы */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[12%] top-[14%] h-72 w-72 rounded-full bg-[#8b7cf6]/15 blur-3xl" />
        <div className="absolute bottom-[10%] right-[8%] h-80 w-80 rounded-full bg-[#c4b5fd]/15 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 text-center"
        >
          <h1 className="bg-gradient-to-r from-[#8b7cf6] via-[#a78bfa] to-[#c4b5fd] bg-clip-text text-[7rem] font-black leading-none tracking-tighter text-transparent drop-shadow-[0_0_40px_rgba(139,124,246,0.4)] md:text-[9rem]">
            404
          </h1>
          <p className="text-xl font-medium text-[var(--foreground)]">Упс! Вы потерялись в мире моды…</p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Пока вы здесь — поймайте моду в корзину 👇 (но не бомбы 💣)</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          ref={containerRef}
          className="fc-glass-card relative mx-auto h-[460px] overflow-hidden !rounded-3xl"
        >
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full cursor-none touch-none" />

          {/* HUD */}
          <div className="pointer-events-none absolute inset-x-4 top-4 flex items-start justify-between">
            <div className="rounded-xl border border-[var(--fc-glass-border)] bg-[var(--fc-surface)] px-3.5 py-2 backdrop-blur-md">
              <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-secondary)]">Счёт</p>
              <p className="text-xl font-bold tabular-nums text-[var(--foreground)]">{score}</p>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <Heart key={i} size={18} className={i < lives ? 'fill-rose-500 text-rose-500' : 'text-[var(--fc-glass-border)]'} />
                ))}
              </div>
              <span className="rounded-full border border-[var(--fc-glass-border)] bg-[var(--fc-surface)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#8b7cf6] backdrop-blur-md">
                Уровень {level}
              </span>
            </div>
            <div className="rounded-xl border border-[var(--fc-glass-border)] bg-[var(--fc-surface)] px-3.5 py-2 text-right backdrop-blur-md">
              <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-secondary)]">Рекорд</p>
              <p className="text-xl font-bold tabular-nums text-[var(--foreground)]">{highScore}</p>
            </div>
          </div>

          {/* Старт / Game Over */}
          {(!isPlaying || isGameOver) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-black/45 backdrop-blur-sm"
            >
              <div className="text-center">
                {isGameOver ? (
                  <>
                    <p className="mb-1 text-3xl font-bold text-white">Игра окончена!</p>
                    <p className="mb-6 text-lg text-white/70">Ваш счёт: {score}</p>
                  </>
                ) : (
                  <>
                    <p className="mb-1 text-3xl font-bold text-white">Лови моду!</p>
                    <p className="mb-6 max-w-xs text-sm text-white/70">Двигайте мышкой/пальцем. Ловите вещи, избегайте 💣. У вас 3 жизни.</p>
                  </>
                )}
                <button
                  onClick={start}
                  className="inline-flex items-center gap-2 rounded-2xl px-8 py-4 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                  style={{ backgroundImage: 'linear-gradient(135deg,#8b7cf6,#c4b5fd)', boxShadow: '0 16px 36px -10px rgba(139,124,246,0.7)' }}
                >
                  {isGameOver ? <RotateCcw className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  {isGameOver ? 'Играть снова' : 'Начать игру'}
                </button>
              </div>
            </motion.div>
          )}

          {/* Пауза */}
          {isPlaying && (
            <button
              onClick={pause}
              className="absolute bottom-4 right-4 grid h-11 w-11 place-items-center rounded-xl border border-[var(--fc-glass-border)] bg-[var(--fc-surface)] text-[var(--foreground)] backdrop-blur-md transition-transform hover:scale-110 active:scale-95"
              aria-label="Пауза"
            >
              <Pause className="h-5 w-5" />
            </button>
          )}
        </motion.div>

        {/* Навигация */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"
        >
          <Link href="/" className="group inline-flex items-center justify-center gap-2.5 rounded-2xl border border-[var(--fc-glass-border)] bg-[var(--fc-surface-elevated)] px-7 py-3.5 text-sm font-semibold text-[var(--foreground)] backdrop-blur-md transition-all hover:shadow-md">
            <Home className="h-5 w-5 transition-transform group-hover:-translate-y-0.5" />
            На главную
          </Link>
          <Link
            href="/collections"
            className="group inline-flex items-center justify-center gap-2.5 rounded-2xl px-7 py-3.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-95"
            style={{ backgroundImage: 'linear-gradient(135deg,#8b7cf6,#c4b5fd)', boxShadow: '0 14px 32px -10px rgba(139,124,246,0.7)' }}
          >
            <ShoppingBag className="h-5 w-5 transition-transform group-hover:-translate-y-0.5" />
            К товарам
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-8 text-center text-sm text-[var(--text-secondary)]"
        >
          💡 А знаете ли вы? Первая онлайн-покупка (1994) — это был CD Стинга.
        </motion.p>
      </div>
    </div>
  );
}
