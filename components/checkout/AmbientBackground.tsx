// components/checkout/AmbientBackground.tsx
'use client';

import { motion } from 'framer-motion';

interface AmbientBackgroundProps {
  currentStep: number;
}

export default function AmbientBackground({ currentStep }: AmbientBackgroundProps) {
  // Цвета меняются в зависимости от шага
  const colors = [
    { from: 'rgba(139, 92, 246, 0.15)', to: 'rgba(167, 139, 250, 0.15)' }, // Step 1: violet
    { from: 'rgba(168, 85, 247, 0.15)', to: 'rgba(192, 132, 252, 0.15)' }, // Step 2: purple
    { from: 'rgba(99, 102, 241, 0.15)', to: 'rgba(129, 140, 248, 0.15)' },  // Step 3: indigo
  ];

  const currentColor = colors[currentStep - 1] || colors[0];

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Animated gradient orbs */}
      <motion.div
        key={`orb1-${currentStep}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: 1,
          scale: 1,
          x: [0, 100, -50, 0],
          y: [0, -100, 50, 0],
        }}
        transition={{
          opacity: { duration: 0.5 },
          scale: { duration: 0.5 },
          x: { duration: 20, repeat: Infinity, ease: 'easeInOut' },
          y: { duration: 20, repeat: Infinity, ease: 'easeInOut' },
        }}
        className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle, ${currentColor.from}, transparent)`,
        }}
      />

      <motion.div
        key={`orb2-${currentStep}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: 1,
          scale: 1,
          x: [0, -100, 50, 0],
          y: [0, 100, -50, 0],
        }}
        transition={{
          opacity: { duration: 0.5 },
          scale: { duration: 0.5 },
          x: { duration: 25, repeat: Infinity, ease: 'easeInOut' },
          y: { duration: 25, repeat: Infinity, ease: 'easeInOut' },
        }}
        className="absolute -bottom-1/4 -right-1/4 w-[700px] h-[700px] rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle, ${currentColor.to}, transparent)`,
        }}
      />

      <motion.div
        key={`orb3-${currentStep}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: 1,
          scale: 1,
          x: [0, 50, -100, 0],
          y: [0, -50, 100, 0],
        }}
        transition={{
          opacity: { duration: 0.5 },
          scale: { duration: 0.5 },
          x: { duration: 30, repeat: Infinity, ease: 'easeInOut' },
          y: { duration: 30, repeat: Infinity, ease: 'easeInOut' },
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle, ${currentColor.from}, transparent)`,
        }}
      />

      {/* Subtle grid overlay */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
        <div
          className="h-full w-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(139, 92, 246, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139, 92, 246, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Radial gradient vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.1) 100%)',
        }}
      />
    </div>
  );
}
