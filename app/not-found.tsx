'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, ShoppingBag, ArrowLeft, Sparkles, Star } from 'lucide-react';

interface FallingItem {
  id: number;
  x: number;
  y: number;
  emoji: string;
  speed: number;
  size: number;
}

export default function NotFoundPage() {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [items, setItems] = useState<FallingItem[]>([]);
  const [basketX, setBasketX] = useState(50);
  const [gameActive, setGameActive] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  const emojis = ['👕', '👗', '👟', '👜', '🧢', '👠', '🎒', '👔', '🩳', '🧥'];

  // Load high score from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('404-highscore');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  // Game loop
  useEffect(() => {
    if (!gameActive) return;

    const interval = setInterval(() => {
      setItems(prev => {
        // Move items down
        const moved = prev.map(item => ({
          ...item,
          y: item.y + item.speed,
        }));

        // Remove items that fell off screen or were caught
        const remaining = moved.filter(item => {
          // Check if caught by basket
          if (item.y > 85 && item.y < 95 && Math.abs(item.x - basketX) < 8) {
            setScore(s => s + 10);
            return false;
          }
          // Remove if fell off screen
          return item.y < 100;
        });

        return remaining;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [gameActive, basketX]);

  // Spawn new items
  useEffect(() => {
    if (!gameActive) return;

    const spawnInterval = setInterval(() => {
      const newItem: FallingItem = {
        id: Date.now(),
        x: Math.random() * 90 + 5, // 5% to 95%
        y: -10,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        speed: Math.random() * 2 + 1,
        size: Math.random() * 20 + 30,
      };
      setItems(prev => [...prev, newItem]);
    }, 1000);

    return () => clearInterval(spawnInterval);
  }, [gameActive]);

  // Handle mouse/touch movement
  const handleMouseMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const percentage = (clientX / window.innerWidth) * 100;
    setBasketX(Math.min(Math.max(percentage, 5), 95));
  }, []);

  const startGame = () => {
    setGameActive(true);
    setShowInstructions(false);
    setScore(0);
    setItems([]);
  };

  const stopGame = () => {
    setGameActive(false);
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('404-highscore', score.toString());
    }
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col items-center justify-center p-4 overflow-hidden relative"
      onMouseMove={handleMouseMove}
      onTouchMove={handleMouseMove}
    >
      {/* Animated background stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-white/20"
            initial={{ x: Math.random() * 100 + '%', y: Math.random() * 100 + '%' }}
            animate={{ 
              y: [null, Math.random() * -100],
              opacity: [0.2, 0.8, 0.2]
            }}
            transition={{ 
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <Star size={Math.random() * 20 + 10} />
          </motion.div>
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center max-w-4xl w-full">
        {/* 404 Text */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 15 }}
          className="mb-8"
        >
          <h1 className="text-[150px] md:text-[200px] font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 leading-none select-none">
            404
          </h1>
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Упс! Вы потерялись в космосе 🚀
          </h2>
          <p className="text-xl text-purple-200">
            Этой страницы не существует, но вы можете поиграть пока ищете путь домой!
          </p>
        </motion.div>

        {/* Game Area */}
        <div className="relative h-[400px] bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden mb-8">
          {!gameActive && !showInstructions && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-6xl mb-4">🏆</p>
                <p className="text-2xl font-bold text-white mb-2">Игра окончена!</p>
                <p className="text-xl text-purple-200 mb-4">Счет: {score}</p>
                {score === highScore && score > 0 && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="text-yellow-400 text-lg font-bold mb-4"
                  >
                    <Sparkles className="inline-block mr-2" />
                    Новый рекорд!
                  </motion.div>
                )}
                <button
                  onClick={startGame}
                  className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full font-bold text-lg hover:shadow-lg hover:scale-105 transition-all"
                >
                  Играть снова
                </button>
              </div>
            </div>
          )}

          {showInstructions && (
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div className="text-center">
                <ShoppingBag className="w-20 h-20 text-white mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-4">Лови падающие товары!</h3>
                <p className="text-purple-200 mb-6">
                  Двигай мышкой или пальцем чтобы ловить одежду и аксессуары.
                  <br />
                  Каждый пойманный товар = 10 очков!
                </p>
                <button
                  onClick={startGame}
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-cyan-500 text-white rounded-full font-bold text-lg hover:shadow-lg hover:scale-105 transition-all"
                >
                  Начать игру
                </button>
              </div>
            </div>
          )}

          {/* Score */}
          {gameActive && (
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
              <div className="bg-white/20 backdrop-blur px-4 py-2 rounded-full">
                <span className="text-white font-bold">Счет: {score}</span>
              </div>
              <div className="bg-white/20 backdrop-blur px-4 py-2 rounded-full">
                <span className="text-purple-200">Рекорд: {highScore}</span>
              </div>
              <button
                onClick={stopGame}
                className="bg-red-500/80 hover:bg-red-500 text-white px-4 py-2 rounded-full font-bold transition-colors"
              >
                Стоп
              </button>
            </div>
          )}

          {/* Falling items */}
          <AnimatePresence>
            {items.map(item => (
              <motion.div
                key={item.id}
                className="absolute pointer-events-none"
                style={{ 
                  left: `${item.x}%`, 
                  top: `${item.y}%`,
                  fontSize: `${item.size}px`
                }}
                initial={{ scale: 0, rotate: 0 }}
                animate={{ scale: 1, rotate: 360 }}
                exit={{ scale: 0 }}
              >
                {item.emoji}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Basket */}
          {(gameActive || !showInstructions) && (
            <motion.div
              className="absolute bottom-4 text-6xl"
              style={{ left: `${basketX}%` }}
              animate={{ x: '-50%' }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              🛒
            </motion.div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-6 py-3 bg-white text-purple-900 rounded-full font-bold hover:shadow-lg transition-all"
            >
              <Home size={20} />
              На главную
            </motion.button>
          </Link>
          
          <Link href="/products">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full font-bold hover:shadow-lg transition-all"
            >
              <ArrowLeft size={20} />
              К товарам
            </motion.button>
          </Link>
        </div>

        {/* Fun fact */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-purple-300 text-sm"
        >
          💡 Знаете ли вы? Эта страница 404 может стать вашим новым любимым местом для перерыва!
        </motion.p>
      </div>
    </div>
  );
}
