// components/PageHero.tsx
'use client';

import { motion } from 'framer-motion';

interface PageHeroProps {
  title: string;
  description: string;
  backgroundImage?: string; // ← опционально
}

export default function PageHero({
  title,
  description,
  backgroundImage = '/images/default-hero.jpg', // fallback
}: PageHeroProps) {
  return (
    <section className="relative h-96 flex items-center justify-center overflow-hidden">
      {/* Фон */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      {/* Оверлей */}
      <div className="absolute inset-0 bg-black/30 z-10"></div>
      {/* Текст */}
      <div className="relative z-20 text-center text-white max-w-4xl mx-auto px-4">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-6xl font-bold mb-6"
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl md:text-2xl opacity-90"
        >
          {description}
        </motion.p>
      </div>
    </section>
  );
}