'use client';

import { motion } from 'framer-motion';
import { User, Users, Sparkles } from 'lucide-react';

interface CategoryHeaderProps {
  title: string;
  description: string;
  icon?: 'male' | 'female' | 'new';
}

export default function CategoryHeader({ title, description, icon = 'new' }: CategoryHeaderProps) {
  const iconMap = {
    male: User,
    female: Users,
    new: Sparkles,
  };

  const Icon = iconMap[icon];

  const gradientMap = {
    male: 'from-blue-600 via-cyan-600 to-purple-600',
    female: 'from-purple-600 via-pink-600 to-rose-600',
    new: 'from-yellow-500 via-orange-500 to-red-500',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="inline-flex items-center justify-center mb-6"
        >
          <div className={`relative p-4 rounded-2xl bg-gradient-to-r ${gradientMap[icon]}`}>
            <Icon className="w-8 h-8 text-white" />
            <motion.div
              className="absolute inset-0 rounded-2xl bg-white"
              animate={{
                opacity: [0, 0.3, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>
        </motion.div>

        <motion.h2
          className={`text-3xl md:text-4xl font-black mb-4 bg-gradient-to-r ${gradientMap[icon]} bg-clip-text text-transparent`}
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            backgroundSize: "200% 100%",
          }}
        >
          {title}
        </motion.h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          {description}
        </p>
      </motion.div>
    </div>
  );
}
