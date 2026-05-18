'use client';

import { Volume2, VolumeX } from 'lucide-react';
import { motion } from 'framer-motion';
import { useProductExperience } from '@/context/ProductExperienceContext';

export default function ExperienceSoundToggle() {
  const { soundEnabled, toggleSound } = useProductExperience();

  return (
    <motion.button
      type="button"
      onClick={toggleSound}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      aria-pressed={soundEnabled}
      aria-label={soundEnabled ? 'Выключить звук интерфейса' : 'Включить звук интерфейса'}
      className="fixed bottom-24 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full fc-glass-card border border-white/30 text-gray-800 shadow-lg dark:text-white md:bottom-8"
    >
      {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
    </motion.button>
  );
}
