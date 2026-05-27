'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, ShoppingBag, Play, Pause, RotateCcw } from 'lucide-react';

export default function NotFoundPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  
  const gameState = useRef({
    basketX: 0,
    items: [] as Array<{ x: number; y: number; emoji: string; speed: number; rotation: number }>,
    lastSpawn: 0,
    animationId: 0,
    isDark: true,
  });

  // Load high score and detect theme
  useEffect(() => {
    const saved = localStorage.getItem('elevate-404-highscore');
    if (saved) setHighScore(parseInt(saved));

    // Detect initial theme
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
    gameState.current.isDark = isDark;

    // Observe theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isDark = document.documentElement.classList.contains('dark');
          setTheme(isDark ? 'dark' : 'light');
          gameState.current.isDark = isDark;
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const emojis = ['👕', '👗', '👟', '👜', '🧢', '👠', '🎒', '👔', '🩳', '🧥', '💎', '⌚'];
    const BASKET_WIDTH = 80;
    const BASKET_HEIGHT = 60;
    const ITEM_SIZE = 35;

    // Resize canvas
    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      gameState.current.basketX = rect.width / 2;
    };

    resize();
    window.addEventListener('resize', resize);

    // Pointer move handler
    const handlePointerMove = (e: PointerEvent) => {
      if (!isPlaying) return;
      const rect = canvas.getBoundingClientRect();
      gameState.current.basketX = e.clientX - rect.left;
    };

    canvas.addEventListener('pointermove', handlePointerMove);

    // Spawn item
    const spawnItem = () => {
      const x = Math.random() * (canvas.width - ITEM_SIZE);
      const speed = 2 + Math.random() * 2;
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];
      gameState.current.items.push({
        x,
        y: -ITEM_SIZE,
        emoji,
        speed,
        rotation: 0,
      });
    };

    // Check collision
    const checkCollision = (item: typeof gameState.current.items[0]) => {
      const basketY = canvas.height - BASKET_HEIGHT - 10;
      return (
        item.x < gameState.current.basketX + BASKET_WIDTH / 2 &&
        item.x + ITEM_SIZE > gameState.current.basketX - BASKET_WIDTH / 2 &&
        item.y + ITEM_SIZE > basketY &&
        item.y < basketY + BASKET_HEIGHT
      );
    };

    // Draw functions
    const drawBackground = () => {
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      if (gameState.current.isDark) {
        gradient.addColorStop(0, '#1a0b2e');
        gradient.addColorStop(0.5, '#2d1b4e');
        gradient.addColorStop(1, '#1a0b2e');
      } else {
        gradient.addColorStop(0, '#f0e6ff');
        gradient.addColorStop(0.5, '#e6d9ff');
        gradient.addColorStop(1, '#f0e6ff');
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Glow effect
      const glowGradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width / 2
      );
      if (gameState.current.isDark) {
        glowGradient.addColorStop(0, 'rgba(139, 92, 246, 0.1)');
        glowGradient.addColorStop(1, 'transparent');
      } else {
        glowGradient.addColorStop(0, 'rgba(139, 92, 246, 0.05)');
        glowGradient.addColorStop(1, 'transparent');
      }
      ctx.fillStyle = glowGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const drawBasket = () => {
      const x = gameState.current.basketX - BASKET_WIDTH / 2;
      const y = canvas.height - BASKET_HEIGHT - 10;

      // Basket glow
      ctx.shadowBlur = 20;
      ctx.shadowColor = gameState.current.isDark ? 'rgba(139, 92, 246, 0.5)' : 'rgba(139, 92, 246, 0.3)';

      // Basket body
      ctx.font = `${BASKET_HEIGHT}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🛒', gameState.current.basketX, y + BASKET_HEIGHT / 2);

      ctx.shadowBlur = 0;
    };

    const drawItems = () => {
      gameState.current.items.forEach((item) => {
        ctx.save();
        ctx.translate(item.x + ITEM_SIZE / 2, item.y + ITEM_SIZE / 2);
        ctx.rotate(item.rotation);
        ctx.font = `${ITEM_SIZE}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Item glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = gameState.current.isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)';
        
        ctx.fillText(item.emoji, 0, 0);
        ctx.restore();
      });
    };

    // Game loop
    const gameLoop = (timestamp: number) => {
      if (!isPlaying) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background
      drawBackground();

      // Spawn items
      if (timestamp - gameState.current.lastSpawn > 1000) {
        spawnItem();
        gameState.current.lastSpawn = timestamp;
      }

      // Update and draw items
      const basketY = canvas.height - BASKET_HEIGHT - 10;
      gameState.current.items = gameState.current.items.filter((item) => {
        item.y += item.speed;
        item.rotation += 0.02;

        // Check collision with basket
        if (checkCollision(item)) {
          setScore((prev) => {
            const newScore = prev + 10;
            if (newScore > highScore) {
              setHighScore(newScore);
              localStorage.setItem('elevate-404-highscore', newScore.toString());
            }
            return newScore;
          });
          return false;
        }

        // Remove if off screen
        if (item.y > canvas.height) {
          setIsGameOver(true);
          setIsPlaying(false);
          return false;
        }

        return true;
      });

      // Draw items and basket
      drawItems();
      drawBasket();

      gameState.current.animationId = requestAnimationFrame(gameLoop);
    };

    if (isPlaying && !isGameOver) {
      gameState.current.animationId = requestAnimationFrame(gameLoop);
    }

    return () => {
      cancelAnimationFrame(gameState.current.animationId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointermove', handlePointerMove);
    };
  }, [isPlaying, isGameOver, highScore]);

  const startGame = () => {
    setScore(0);
    setIsGameOver(false);
    setIsPlaying(true);
    gameState.current.items = [];
    gameState.current.lastSpawn = performance.now();
  };

  const stopGame = () => {
    setIsPlaying(false);
    cancelAnimationFrame(gameState.current.animationId);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-950 via-purple-900 to-indigo-950 dark:from-black dark:via-purple-950 dark:to-indigo-950 transition-colors duration-500" />
      
      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-2 h-2 rounded-full ${
              theme === 'dark' ? 'bg-violet-400/20' : 'bg-violet-600/10'
            }`}
            animate={{
              y: [0, -100, 0],
              x: [0, Math.random() * 50 - 25, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-4xl w-full">
        {/* 404 Text */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center mb-8"
        >
          <h1 className="text-9xl font-black mb-4 bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(139,92,246,0.5)]">
            404
          </h1>
          <p className={`text-xl font-medium ${
            theme === 'dark' ? 'text-white/70' : 'text-gray-700'
          }`}>
            Упс! Вы потерялись в мире моды...
          </p>
          <p className={`text-sm mt-2 ${
            theme === 'dark' ? 'text-white/40' : 'text-gray-500'
          }`}>
            Но не беда! Пока вы здесь, можете поиграть 👇
          </p>
        </motion.div>

        {/* Game Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          ref={containerRef}
          className="relative mx-auto max-w-2xl h-[500px] rounded-3xl overflow-hidden backdrop-blur-xl border border-white/10 shadow-2xl"
          style={{
            background: theme === 'dark' 
              ? 'rgba(26, 11, 46, 0.6)' 
              : 'rgba(240, 230, 255, 0.6)',
          }}
        >
          {/* Canvas */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full cursor-none"
          />

          {/* Score Display */}
          <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none">
            <div className={`px-4 py-2 rounded-xl backdrop-blur-md border ${
              theme === 'dark' 
                ? 'bg-white/5 border-white/10 text-white' 
                : 'bg-white/50 border-white/30 text-gray-900'
            }`}>
              <p className="text-xs font-medium opacity-60">Счёт</p>
              <p className="text-2xl font-bold">{score}</p>
            </div>
            <div className={`px-4 py-2 rounded-xl backdrop-blur-md border ${
              theme === 'dark' 
                ? 'bg-white/5 border-white/10 text-white' 
                : 'bg-white/50 border-white/30 text-gray-900'
            }`}>
              <p className="text-xs font-medium opacity-60">Рекорд</p>
              <p className="text-2xl font-bold">{highScore}</p>
            </div>
          </div>

          {/* Start/Game Over Overlay */}
          {(!isPlaying || isGameOver) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            >
              <div className="text-center">
                {isGameOver ? (
                  <>
                    <p className="text-4xl font-bold text-white mb-2">Игра окончена!</p>
                    <p className="text-xl text-white/70 mb-6">Ваш счёт: {score}</p>
                  </>
                ) : (
                  <>
                    <p className="text-3xl font-bold text-white mb-2">Лови моду!</p>
                    <p className="text-sm text-white/60 mb-6">Двигай мышкой или пальцем чтобы ловить предметы</p>
                  </>
                )}
                <button
                  onClick={startGame}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-2xl font-semibold shadow-lg shadow-violet-500/30 transition-all hover:scale-105 active:scale-95"
                >
                  {isGameOver ? <RotateCcw className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  {isGameOver ? 'Играть снова' : 'Начать игру'}
                </button>
              </div>
            </motion.div>
          )}

          {/* Controls */}
          {isPlaying && (
            <div className="absolute bottom-6 right-6">
              <button
                onClick={stopGame}
                className={`p-3 rounded-xl backdrop-blur-md border transition-all hover:scale-110 active:scale-95 ${
                  theme === 'dark'
                    ? 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                    : 'bg-white/50 border-white/30 text-gray-900 hover:bg-white/70'
                }`}
              >
                <Pause className="w-5 h-5" />
              </button>
            </div>
          )}
        </motion.div>

        {/* Navigation Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mt-8"
        >
          <Link href="/">
            <button className="group inline-flex items-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-2xl font-semibold transition-all hover:scale-105 active:scale-95">
              <Home className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              На главную
            </button>
          </Link>
          <Link href="/collections">
            <button className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-2xl font-semibold shadow-lg shadow-violet-500/30 transition-all hover:scale-105 active:scale-95">
              <ShoppingBag className="w-5 h-5 group-hover:bounce transition-transform" />
              К товарам
            </button>
          </Link>
        </motion.div>

        {/* Fun Fact */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className={`text-center text-sm mt-8 ${
            theme === 'dark' ? 'text-white/30' : 'text-gray-500'
          }`}
        >
          💡 Знаете ли вы? Первая онлайн-покупка была совершена в 1994 году — это был CD Стинга!
        </motion.p>
      </div>
    </div>
  );
}
