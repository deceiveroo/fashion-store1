'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Store, Calendar, TrendingUp, Bell } from 'lucide-react';

interface Purchase {
  id: number;
  store: string;
  location: string;
  category: string;
  date: string;
  rating?: number;
}

export default function PurchaseMap() {
  const [purchases] = useState<Purchase[]>([
    { id: 1, store: 'Fashion Store', location: 'Москва, ТЦ Европейский', category: 'Одежда', date: '2024-03-15', rating: 5 },
    { id: 2, store: 'Online', location: 'Доставка на дом', category: 'Обувь', date: '2024-03-10', rating: 4 },
    { id: 3, store: 'Outlet', location: 'Москва, Рублевка', category: 'Аксессуары', date: '2024-03-05', rating: 5 },
  ]);

  const [categoryStats] = useState([
    { category: 'Одежда', online: 65, offline: 35, color: 'bg-blue-500' },
    { category: 'Обувь', online: 80, offline: 20, color: 'bg-purple-500' },
    { category: 'Аксессуары', online: 45, offline: 55, color: 'bg-pink-500' },
  ]);

  const [reminders] = useState([
    { id: 1, item: 'Корм для кошек', frequency: 'Каждые 30 дней', nextDate: '2024-04-15' },
    { id: 2, item: 'Витамины', frequency: 'Каждые 60 дней', nextDate: '2024-05-01' },
  ]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-blue-200/50 dark:border-blue-700/50"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl">
          <MapPin className="text-white" size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Карта покупок</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">География ваших заказов</p>
        </div>
      </div>

      {/* Map Placeholder */}
      <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 mb-6 h-48 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 opacity-50" />
        <div className="relative z-10 text-center">
          <MapPin className="mx-auto mb-2 text-blue-500" size={32} />
          <p className="text-sm text-gray-600 dark:text-gray-400">Интерактивная карта</p>
          <p className="text-xs text-gray-500 dark:text-gray-500">Здесь будет отображаться карта с геометками</p>
        </div>
        
        {/* Animated pins */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 bg-red-500 rounded-full"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 2) * 20}%`,
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </div>

      {/* Recent Purchases */}
      <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Store className="text-blue-500" size={18} />
          <h4 className="font-semibold text-gray-900 dark:text-white">Последние покупки</h4>
        </div>
        <div className="space-y-2">
          {purchases.map((purchase) => (
            <motion.div
              key={purchase.id}
              whileHover={{ scale: 1.02 }}
              className="flex items-center justify-between p-3 bg-white/70 dark:bg-gray-700/70 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <MapPin className="text-blue-500" size={16} />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{purchase.store}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{purchase.location}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">{purchase.category}</p>
                <div className="flex gap-0.5 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`text-xs ${i < (purchase.rating || 0) ? 'text-yellow-500' : 'text-gray-300'}`}>
                      ★
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Category Heatmap */}
      <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="text-indigo-500" size={18} />
          <h4 className="font-semibold text-gray-900 dark:text-white">Тепловая карта категорий</h4>
        </div>
        <div className="space-y-3">
          {categoryStats.map((stat) => (
            <div key={stat.category}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700 dark:text-gray-300">{stat.category}</span>
                <span className="text-gray-500 dark:text-gray-400">
                  Online {stat.online}% / Offline {stat.offline}%
                </span>
              </div>
              <div className="flex h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stat.online}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className={`${stat.color}`}
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stat.offline}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className={`${stat.color} opacity-50`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Smart Reminders */}
      <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="text-purple-500" size={18} />
          <h4 className="font-semibold text-gray-900 dark:text-white">Умные напоминания</h4>
        </div>
        <div className="space-y-2">
          {reminders.map((reminder) => (
            <motion.div
              key={reminder.id}
              whileHover={{ scale: 1.02 }}
              className="flex items-center justify-between p-3 bg-white/70 dark:bg-gray-700/70 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Calendar className="text-purple-500" size={16} />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{reminder.item}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{reminder.frequency}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">Следующий заказ</p>
                <p className="text-xs font-medium text-purple-600 dark:text-purple-400">{reminder.nextDate}</p>
              </div>
            </motion.div>
          ))}
        </div>
        <button className="w-full mt-3 py-2 border-2 border-dashed border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
          + Добавить напоминание
        </button>
      </div>
    </motion.div>
  );
}
