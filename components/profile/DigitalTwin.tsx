'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, User, TrendingDown, Bell, Camera, Check, X } from 'lucide-react';

interface DigitalTwinProps {
  userPreferences?: {
    height?: number;
    weight?: number;
    bodyType?: string;
    favoriteColors?: string[];
    favoriteBrands?: string[];
  };
}

export default function DigitalTwin({ userPreferences }: DigitalTwinProps) {
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [preferences, setPreferences] = useState({
    height: userPreferences?.height || 170,
    weight: userPreferences?.weight || 70,
    bodyType: userPreferences?.bodyType || 'average',
    favoriteColors: userPreferences?.favoriteColors || [],
    favoriteBrands: userPreferences?.favoriteBrands || [],
  });

  const [watchedItems, setWatchedItems] = useState([
    { id: 1, name: 'Кожаная куртка', price: 15000, targetPrice: 12000, image: '/placeholder.jpg' },
    { id: 2, name: 'Джинсы Slim Fit', price: 5000, targetPrice: 4000, image: '/placeholder.jpg' },
  ]);

  const bodyTypes = [
    { value: 'slim', label: 'Стройное', icon: '🏃' },
    { value: 'average', label: 'Среднее', icon: '🚶' },
    { value: 'athletic', label: 'Спортивное', icon: '💪' },
    { value: 'plus', label: 'Полное', icon: '🧘' },
  ];

  const colors = [
    { name: 'Черный', hex: '#000000' },
    { name: 'Белый', hex: '#FFFFFF' },
    { name: 'Синий', hex: '#3B82F6' },
    { name: 'Красный', hex: '#EF4444' },
    { name: 'Зеленый', hex: '#10B981' },
    { name: 'Серый', hex: '#6B7280' },
  ];

  const toggleColor = (colorName: string) => {
    setPreferences(prev => ({
      ...prev,
      favoriteColors: prev.favoriteColors.includes(colorName)
        ? prev.favoriteColors.filter(c => c !== colorName)
        : [...prev.favoriteColors, colorName]
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-indigo-500/10 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-indigo-900/20 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-purple-200/50 dark:border-purple-700/50"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
            <Sparkles className="text-white" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Цифровой двойник</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Ваш виртуальный помощник</p>
          </div>
        </div>
        <button
          onClick={() => setIsSetupOpen(!isSetupOpen)}
          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {isSetupOpen ? 'Закрыть' : 'Настроить'}
        </button>
      </div>

      <AnimatePresence>
        {isSetupOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 space-y-4"
          >
            {/* Body Parameters */}
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <User size={18} className="text-purple-500" />
                Параметры тела
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                    Рост (см): {preferences.height}
                  </label>
                  <input
                    type="range"
                    min="140"
                    max="210"
                    value={preferences.height}
                    onChange={(e) => setPreferences({ ...preferences, height: parseInt(e.target.value) })}
                    className="w-full accent-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                    Вес (кг): {preferences.weight}
                  </label>
                  <input
                    type="range"
                    min="40"
                    max="150"
                    value={preferences.weight}
                    onChange={(e) => setPreferences({ ...preferences, weight: parseInt(e.target.value) })}
                    className="w-full accent-purple-500"
                  />
                </div>
              </div>

              {/* Body Type */}
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Тип фигуры</label>
                <div className="grid grid-cols-4 gap-2">
                  {bodyTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setPreferences({ ...preferences, bodyType: type.value })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        preferences.bodyType === type.value
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                          : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{type.icon}</div>
                      <div className="text-xs text-gray-700 dark:text-gray-300">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Favorite Colors */}
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Любимые цвета</label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => toggleColor(color.name)}
                      className={`relative w-12 h-12 rounded-lg border-2 transition-all ${
                        preferences.favoriteColors.includes(color.name)
                          ? 'border-purple-500 scale-110'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      style={{ backgroundColor: color.hex }}
                    >
                      {preferences.favoriteColors.includes(color.name) && (
                        <Check className="absolute inset-0 m-auto text-white drop-shadow-lg" size={20} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AR Try-On Feature */}
      <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <Camera className="text-purple-500" size={20} />
          <h4 className="font-semibold text-gray-900 dark:text-white">AR Примерка</h4>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Виртуальная примерка товаров на основе ваших параметров
        </p>
        <button className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all">
          Попробовать AR примерку
        </button>
      </div>

      {/* Price Watch */}
      <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-4">
          <TrendingDown className="text-green-500" size={20} />
          <h4 className="font-semibold text-gray-900 dark:text-white">Отслеживание цен</h4>
        </div>
        
        <div className="space-y-3">
          {watchedItems.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-3 p-3 bg-white/70 dark:bg-gray-700/70 rounded-lg"
            >
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                <span className="text-xs text-gray-500">IMG</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Сейчас: {item.price}₽</span>
                  <span className="text-green-600 dark:text-green-400">→ Цель: {item.targetPrice}₽</span>
                </div>
              </div>
              <Bell className="text-purple-500" size={18} />
            </motion.div>
          ))}
        </div>

        <button className="w-full mt-3 py-2 border-2 border-dashed border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
          + Добавить товар для отслеживания
        </button>
      </div>
    </motion.div>
  );
}
