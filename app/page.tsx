'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Home() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Фоновое изображение */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
          style={{ 
            backgroundImage: "url('/images/hero-bg.jpg')" 
          }}
        />
        
        {/* Затемняющий оверлей */}
        <div className="absolute inset-0 bg-black/30 dark:bg-black/50 z-0"></div>
        
        {/* Контент поверх фона */}
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-white/20 dark:border-gray-700/50 shadow-lg"
              whileHover={{ scale: 1.05 }}
            >
              <Sparkles size={16} className="text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Будущее моды здесь
              </span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white">
              <span className="bg-gradient-to-r from-purple-200 to-pink-200 dark:from-purple-300 dark:to-pink-300 bg-clip-text text-transparent">
                ELEVATE
              </span>
              <br />
              <span>Ваш стиль</span>
            </h1>

            <p className="text-xl text-white/90 dark:text-white/80 mb-8 max-w-2xl mx-auto leading-relaxed">
              Откройте для себя нашу инновационную коллекцию, где передовой дизайн соответствует устойчивой роскоши.
            </p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Link
                href="/collections"
                className="group inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-500 dark:to-pink-500 text-white px-8 py-4 rounded-full font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                Исследуйте коллекцию
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link
                href="/about"
                className="inline-flex items-center gap-2 bg-white/20 dark:bg-gray-800/40 backdrop-blur-sm text-white px-8 py-4 rounded-full font-semibold border border-white/30 dark:border-gray-600/50 hover:bg-white/30 dark:hover:bg-gray-800/60 transition-all duration-200"
              >
                Узнать больше
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Анимированные элементы */}
        {isClient && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-purple-300/50 dark:bg-purple-400/30 rounded-full"
                initial={{ 
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight
                }}
                animate={{ 
                  y: [0, -100, 0],
                  opacity: [0, 1, 0]
                }}
                transition={{ 
                  duration: Math.random() * 3 + 2,
                  repeat: Infinity,
                  delay: Math.random() * 2
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}