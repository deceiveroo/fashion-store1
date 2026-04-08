'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Share2, Eye, EyeOff, DollarSign, Ruler, X, Plus, Link as LinkIcon, Check } from 'lucide-react';

interface WishlistItem {
  id: number;
  name: string;
  price: number;
  size?: string;
  image: string;
  isPublic: boolean;
  isPurchased: boolean;
}

export default function GiftWishlist() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([
    { id: 1, name: 'Кожаная сумка', price: 8500, size: 'One Size', image: '/placeholder.jpg', isPublic: true, isPurchased: false },
    { id: 2, name: 'Кроссовки Nike', price: 12000, size: '42', image: '/placeholder.jpg', isPublic: true, isPurchased: false },
    { id: 3, name: 'Часы Casio', price: 15000, image: '/placeholder.jpg', isPublic: false, isPurchased: false },
  ]);

  const [settings, setSettings] = useState({
    maxBudget: 20000,
    minBudget: 1000,
    excludeCategories: ['Нижнее белье', 'Косметика'],
    shareLink: 'https://fashion-store.com/wishlist/user123',
  });

  const [showSettings, setShowSettings] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const toggleItemVisibility = (id: number) => {
    setWishlistItems(items =>
      items.map(item =>
        item.id === id ? { ...item, isPublic: !item.isPublic } : item
      )
    );
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(settings.shareLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const publicItemsCount = wishlistItems.filter(item => item.isPublic).length;
  const totalValue = wishlistItems.filter(item => item.isPublic).reduce((sum, item) => sum + item.price, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-gradient-to-br from-pink-500/10 via-rose-500/10 to-red-500/10 dark:from-pink-900/20 dark:via-rose-900/20 dark:to-red-900/20 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-pink-200/50 dark:border-pink-700/50"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl">
            <Gift className="text-white" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Вишлист для подарков</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {publicItemsCount} публичных товаров • {totalValue.toLocaleString()}₽
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {showSettings ? 'Закрыть' : 'Настройки'}
        </button>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 space-y-4"
          >
            <h4 className="font-semibold text-gray-900 dark:text-white">Настройки вишлиста</h4>
            
            {/* Budget Range */}
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                <DollarSign className="inline mr-1" size={14} />
                Диапазон бюджета: {settings.minBudget.toLocaleString()}₽ - {settings.maxBudget.toLocaleString()}₽
              </label>
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="range"
                    min="500"
                    max="50000"
                    step="500"
                    value={settings.minBudget}
                    onChange={(e) => setSettings({ ...settings, minBudget: parseInt(e.target.value) })}
                    className="w-full accent-pink-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Минимум</p>
                </div>
                <div className="flex-1">
                  <input
                    type="range"
                    min="1000"
                    max="100000"
                    step="1000"
                    value={settings.maxBudget}
                    onChange={(e) => setSettings({ ...settings, maxBudget: parseInt(e.target.value) })}
                    className="w-full accent-pink-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Максимум</p>
                </div>
              </div>
            </div>

            {/* Excluded Categories */}
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                Исключенные категории
              </label>
              <div className="flex flex-wrap gap-2">
                {settings.excludeCategories.map((category) => (
                  <span
                    key={category}
                    className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs flex items-center gap-1"
                  >
                    {category}
                    <X size={12} className="cursor-pointer" />
                  </span>
                ))}
                <button className="px-3 py-1 border-2 border-dashed border-pink-300 dark:border-pink-700 text-pink-600 dark:text-pink-400 rounded-full text-xs hover:bg-pink-50 dark:hover:bg-pink-900/20">
                  + Добавить
                </button>
              </div>
            </div>

            {/* Share Link */}
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                <Share2 className="inline mr-1" size={14} />
                Ссылка для друзей
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.shareLink}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300"
                />
                <button
                  onClick={copyShareLink}
                  className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  {linkCopied ? <Check size={16} /> : <LinkIcon size={16} />}
                  {linkCopied ? 'Скопировано' : 'Копировать'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wishlist Items */}
      <div className="space-y-3 mb-4">
        {wishlistItems.map((item) => (
          <motion.div
            key={item.id}
            whileHover={{ scale: 1.02 }}
            className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
              item.isPurchased
                ? 'bg-green-100/50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700'
                : 'bg-white/70 dark:bg-gray-700/70 border-2 border-transparent'
            }`}
          >
            {/* Image */}
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-xs text-gray-500">IMG</span>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{item.price.toLocaleString()}₽</span>
                    {item.size && (
                      <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-gray-700 dark:text-gray-300">
                        <Ruler className="inline mr-1" size={10} />
                        {item.size}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => toggleItemVisibility(item.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    item.isPublic
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                  }`}
                  title={item.isPublic ? 'Публичный' : 'Приватный'}
                >
                  {item.isPublic ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
              {item.isPurchased && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 flex items-center gap-2 text-green-600 dark:text-green-400 text-sm"
                >
                  <Gift size={14} />
                  <span>Вам приготовили сюрприз!</span>
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Item Button */}
      <button className="w-full py-3 border-2 border-dashed border-pink-300 dark:border-pink-700 text-pink-600 dark:text-pink-400 rounded-xl font-medium hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors flex items-center justify-center gap-2">
        <Plus size={18} />
        Добавить товар в вишлист
      </button>

      {/* Info Box */}
      <div className="mt-4 p-4 bg-pink-50 dark:bg-pink-900/20 rounded-xl border border-pink-200 dark:border-pink-800">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <Gift className="inline mr-1" size={14} />
          Друзья могут анонимно купить подарок из вашего публичного вишлиста. После покупки товар автоматически скроется, а вы получите уведомление о сюрпризе!
        </p>
      </div>
    </motion.div>
  );
}
