'use client';

import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, ShoppingBag, Heart, Zap, ArrowRight } from 'lucide-react';
import { useState } from 'react';

interface Purchase {
  category: string;
  amount: number;
  color: string;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  image: string;
  price: number;
  match: number;
}

export default function AIStyleAssistant() {
  const [activeTab, setActiveTab] = useState<'trends' | 'recommendations'>('trends');

  // Mock data - в реальном приложении будет из API
  const purchases: Purchase[] = [
    { category: 'Верхняя одежда', amount: 45000, color: 'from-blue-500 to-cyan-500' },
    { category: 'Обувь', amount: 32000, color: 'from-purple-500 to-pink-500' },
    { category: 'Аксессуары', amount: 18000, color: 'from-orange-500 to-red-500' },
    { category: 'Спортивная одежда', amount: 25000, color: 'from-green-500 to-emerald-500' },
  ];

  const totalSpent = purchases.reduce((sum, p) => sum + p.amount, 0);

  const recommendations: Recommendation[] = [
    {
      id: '1',
      title: 'Кожаная куртка Premium',
      description: 'Идеально дополнит ваш гардероб',
      image: '/placeholder-product.jpg',
      price: 15990,
      match: 95,
    },
    {
      id: '2',
      title: 'Кроссовки Nike Air Max',
      description: 'Подходит к вашему стилю',
      image: '/placeholder-product.jpg',
      price: 12490,
      match: 88,
    },
    {
      id: '3',
      title: 'Умные часы Apple Watch',
      description: 'Дополнит ваши аксессуары',
      image: '/placeholder-product.jpg',
      price: 32990,
      match: 82,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/50 dark:border-gray-700/50"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Sparkles className="text-purple-600 dark:text-purple-400" size={24} />
          AI-Стилист
        </h2>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm font-medium">
          <Zap size={14} />
          Персональный
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-gray-100 dark:bg-gray-700/50 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('trends')}
          className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
            activeTab === 'trends'
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-md'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <TrendingUp size={16} />
            Мои тренды
          </div>
        </button>
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
            activeTab === 'recommendations'
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-md'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Heart size={16} />
            Рекомендации
          </div>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'trends' ? (
        <div className="space-y-6">
          {/* Total Spent */}
          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Всего потрачено</span>
              <ShoppingBag className="text-purple-600 dark:text-purple-400" size={20} />
            </div>
            <div className="text-3xl font-black text-gray-900 dark:text-white">
              {totalSpent.toLocaleString('ru-RU')} ₽
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">За последние 6 месяцев</div>
          </div>

          {/* Category Breakdown */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Расходы по категориям
            </h3>
            {purchases.map((purchase, index) => {
              const percentage = (purchase.amount / totalSpent) * 100;
              return (
                <motion.div
                  key={purchase.category}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-900 dark:text-white">{purchase.category}</span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {purchase.amount.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                  <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1, delay: 0.3 + index * 0.1 }}
                      className={`h-full bg-gradient-to-r ${purchase.color} rounded-full`}
                    />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{percentage.toFixed(1)}%</div>
                </motion.div>
              );
            })}
          </div>

          {/* AI Insight */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg">
                <Sparkles className="text-white" size={16} />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">AI-Анализ</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Вы предпочитаете качественную верхнюю одежду и обувь. Рекомендуем обратить внимание на 
                  новую коллекцию премиум-аксессуаров, которая идеально дополнит ваш стиль.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Что пропустили?
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">На основе ваших покупок</span>
          </div>

          {recommendations.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="flex gap-4 p-4 bg-white/50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="text-gray-400 dark:text-gray-500" size={24} />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{item.title}</h4>
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                    <Zap size={12} />
                    {item.match}%
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{item.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {item.price.toLocaleString('ru-RU')} ₽
                  </span>
                  <button className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 text-sm font-medium group-hover:gap-2 transition-all">
                    Смотреть
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all shadow-lg"
          >
            Показать больше рекомендаций
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
