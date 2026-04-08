'use client';

import { motion } from 'framer-motion';

interface AnimatedBackgroundProps {
  particleCount?: number;
  color?: string;
}

export default function AnimatedBackground({ 
  particleCount = 25, 
  color = 'purple' 
}: AnimatedBackgroundProps) {
  const colorMap: Record<string, string> = {
    purple: 'bg-purple-400/20 dark:bg-purple-500/30',
    pink: 'bg-pink-400/20 dark:bg-pink-500/30',
    blue: 'bg-blue-400/20 dark:bg-blue-500/30',
    green: 'bg-green-400/20 dark:bg-green-500/30',
    indigo: 'bg-indigo-400/20 dark:bg-indigo-500/30',
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(particleCount)].map((_, i) => (
        <motion.div
          key={i}
          className={`absolute w-2 h-2 rounded-full ${colorMap[color] || colorMap.purple}`}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0, 0.5, 0],
            scale: [0, 1.5, 0]
          }}
          transition={{
            duration: Math.random() * 5 + 3,
            repeat: Infinity,
            delay: Math.random() * 3
          }}
        />
      ))}
    </div>
  );
}
