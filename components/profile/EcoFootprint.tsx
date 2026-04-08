'use client';

import { motion } from 'framer-motion';
import { Leaf, Award, TrendingDown, TreePine, Droplets, Wind, Gift } from 'lucide-react';

interface Badge {
  id: string;
  name: string;
  icon: any;
  earned: boolean;
  description: string;
}

export default function EcoFootprint() {
  // Mock data
  const carbonFootprint = 45.2; // kg CO2
  const treesEquivalent = 2.3;
  const waterSaved = 150; // liters
  const ecoScore = 72; // из 100

  const badges: Badge[] = [
    {
      id: '1',
      name: 'Эко-новичок',
      icon: Leaf,
      earned: true,
      description: 'Первая экологичная покупка',
    },
    {
      id: '2',
      name: 'Зелёный герой',
      icon: TreePine,
      earned: true,
      description: '10 экологичных заказов',
    },
    {
      id: '3',
      name: 'Хранитель воды',
      icon: Droplets,
      earned: false,
      description: 'Сэкономьте 500л воды',
    },
    {
      id: '4',
      name: 'Чистый воздух',
      icon: Wind,
      earned: false,
      description: 'Компенсируйте 100кг CO2',
    },
  ];

  const getScoreColor = () => {
    if (ecoScore >= 70) return { bg: 'from-green-500 to-emerald-500', text: 'text-green-600' };
    if (ecoScore >= 40) return { bg: 'from-yellow-500 to-orange-500', text: 'text-yellow-600' };
    return { bg: 'from-red-500 to-rose-500', text: 'text-red-600' };
  };

  const colors = getScoreColor();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/50 dark:border-gray-700/50"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Leaf className="text-green-600 dark:text-green-400" size={24} />
          Экологический след
        </h2>
        <div className={`px-3 py-1.5 rounded-full bg-gradient-to-r ${colors.bg} text-white font-bold text-sm`}>
          {ecoScore}/100
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="p-4 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl border border-red-200 dark:border-red-800"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="text-red-600 dark:text-red-400" size={20} />
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">CO2 след</span>
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">{carbonFootprint}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">кг углерода</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800"
        >
          <div className="flex items-center gap-2 mb-2">
            <TreePine className="text-green-600 dark:text-green-400" size={20} />
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Деревья</span>
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">{treesEquivalent}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">для компенсации</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
        >
          <div className="flex items-center gap-2 mb-2">
            <Droplets className="text-blue-600 dark:text-blue-400" size={20} />
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Вода</span>
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">{waterSaved}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">литров сэкономлено</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
          className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800"
        >
          <div className="flex items-center gap-2 mb-2">
            <Award className="text-purple-600 dark:text-purple-400" size={20} />
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Награды</span>
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">
            {badges.filter(b => b.earned).length}/{badges.length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">получено</div>
        </motion.div>
      </div>

      {/* Badges */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Ваши достижения</h3>
        <div className="grid grid-cols-2 gap-3">
          {badges.map((badge, index) => (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              className={`p-3 rounded-xl border transition-all ${
                badge.earned
                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-green-200 dark:border-green-700'
                  : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600 opacity-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <badge.icon
                  className={badge.earned ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}
                  size={16}
                />
                <span className={`text-xs font-semibold ${
                  badge.earned ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {badge.name}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">{badge.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all shadow-lg flex items-center justify-center gap-2"
        >
          <TreePine size={18} />
          Посадить дерево (500 ₽)
        </motion.button>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800"
        >
          <div className="flex items-start gap-3">
            <Gift className="text-green-600 dark:text-green-400 flex-shrink-0" size={20} />
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                Награда за устойчивость
              </h4>
              <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">
                Выберите медленную доставку в следующем заказе и получите скидку 10%
              </p>
              <div className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                🎁 Доступно
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
