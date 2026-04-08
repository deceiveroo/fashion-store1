'use client';

import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Zap, Star } from 'lucide-react';

export default function CollectionsHeader() {
  const features = [
    {
      icon: Sparkles,
      title: 'Премиум качество',
      description: 'Только лучшие товары',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: TrendingUp,
      title: 'Трендовые модели',
      description: 'Актуальные коллекции',
      color: 'from-pink-500 to-red-500',
    },
    {
      icon: Zap,
      title: 'Быстрая доставка',
      description: 'От 1 дня по России',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Star,
      title: 'Эксклюзив',
      description: 'Уникальные предложения',
      color: 'from-yellow-500 to-orange-500',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <motion.h2
          className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent"
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
          Избранные коллекции
        </motion.h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Откройте для себя тщательно отобранные коллекции, которые определяют современный стиль
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl blur-xl"
              style={{
                background: `linear-gradient(to right, ${feature.color.split(' ')[1]}, ${feature.color.split(' ')[3]})`,
              }}
            />
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700">
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.color} mb-4`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {feature.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
