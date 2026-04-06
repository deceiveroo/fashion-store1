'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, ShoppingBag, Sparkles, Rocket, Gift } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Cart({ isOpen, onClose }: CartProps) {
  const { state, removeItem, updateQuantity, clearCart } = useCart();
  const [isAnimating, setIsAnimating] = useState(false);
  const router = useRouter();
  
  const items = state?.items || [];
  const total = state?.total || 0;
  const itemCount = state?.itemCount || 0;

  // Анимация при изменении количества товаров
  // useEffect(() => {
  //   if (items.length > 0) {
  //     setIsAnimating(true);
  //     const timer = setTimeout(() => setIsAnimating(false), 300);
  //     return () => clearTimeout(timer);
  //   }
  // }, [items]);

  const handleUpdateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(id);
      return;
    }
    updateQuantity(id, quantity);
  };

  const handleRemoveItem = (id: string) => {
    removeItem(id);
    toast.success('Товар удален из корзины ✨');
  };

  const handleCheckout = () => {
    onClose();
    // Редирект на страницу оформления заказа
    router.push('/checkout');
  };

  const getDiscount = () => {
    if (total > 5000) return 500;
    if (total > 3000) return 300;
    if (total > 1000) return 100;
    return 0;
  };

  const finalTotal = Math.max(0, total - getDiscount());

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Glass Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          {/* Cart Panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ 
              type: 'spring', 
              damping: 25,
              stiffness: 200
            }}
            className="fixed right-0 top-0 h-full w-80 bg-gradient-to-b from-white to-gray-50/80 dark:from-gray-900 dark:to-gray-950/80 z-50 shadow-2xl border-l border-white/20 dark:border-gray-800 flex flex-col"
          >
            {/* Header with Gradient */}
            <div className="relative p-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <ShoppingBag size={24} />
                  </motion.div>
                  <div>
                    <h2 className="text-xl font-bold">Ваша корзина</h2>
                    <p className="text-purple-200 text-sm">{itemCount} товара</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-xl transition-all"
                >
                  <X size={20} />
                </motion.button>
              </div>
              
              {/* Floating Elements */}
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute top-2 right-16"
              >
                <Sparkles size={16} className="text-yellow-300" />
              </motion.div>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-16 px-6"
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
                  </motion.div>
                  <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Корзина пуста
                  </h3>
                  <p className="text-gray-500 dark:text-gray-500 text-sm mb-6">
                    Наполните её стильными вещами!
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    Начать шоппинг
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div 
                  layout
                  className="p-4 space-y-4"
                >
                  {items.map((item, index) => (
                    <motion.div
                      key={`${item.id}-${item.size}-${item.color}`}
                      layout
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ delay: index * 0.1 }}
                      className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/50 dark:border-gray-700 hover:shadow-xl transition-all"
                    >
                      {/* Background Glow Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="relative flex items-start gap-4">
                        {/* Product Image with Border Animation */}
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className="relative flex-shrink-0"
                        >
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-0.5 overflow-hidden">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover rounded-lg"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <ShoppingBag size={24} />
                              </div>
                            )}
                          </div>
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center"
                          >
                            <span className="text-white text-xs font-bold">
                              {item.quantity}
                            </span>
                          </motion.div>
                        </motion.div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight line-clamp-2 mb-1">
                            {item.name}
                          </h3>
                          
                          {/* Attributes */}
                          {(item.size || item.color) && (
                            <div className="flex gap-1 mb-2">
                              {item.size && (
                                <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                                  {item.size}
                                </span>
                              )}
                              {item.color && (
                                <span className="text-xs text-pink-600 bg-pink-100 px-2 py-1 rounded-full">
                                  {item.color}
                                </span>
                              )}
                            </div>
                          )}
                          
                          <p className="text-lg font-bold text-transparent bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text">
                            {Math.round(item.price)} ₽
                          </p>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-3 mt-3">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                              className="w-7 h-7 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                            >
                              <Minus size={14} />
                            </motion.button>
                            
                            <motion.span
                              key={item.quantity}
                              animate={{ scale: [1, 1.2, 1] }}
                              className="text-sm font-bold text-gray-900 dark:text-gray-100 min-w-6 text-center"
                            >
                              {item.quantity}
                            </motion.span>
                            
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                              className="w-7 h-7 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-pink-100 dark:hover:bg-pink-900 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                            >
                              <Plus size={14} />
                            </motion.button>
                          </div>
                        </div>

                        {/* Remove Button */}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                        >
                          <X size={16} />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Footer with Enhanced Design */}
            {items.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-t border-white/20 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm p-6 space-y-4"
              >
                {/* Discount Badge */}
                {getDiscount() > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white p-3 rounded-xl"
                  >
                    <Gift size={16} />
                    <span className="text-sm font-semibold">
                      Ваша скидка: {getDiscount()} ₽
                    </span>
                  </motion.div>
                )}

                {/* Pricing */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Товары ({itemCount} шт.)</span>
                    <span className="font-medium dark:text-gray-200">{Math.round(total)} ₽</span>
                  </div>
                  
                  {getDiscount() > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-green-600">Скидка</span>
                      <span className="text-green-600 font-semibold">-{getDiscount()} ₽</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Доставка</span>
                    <span className="text-green-600 font-semibold flex items-center gap-1">
                      <Rocket size={14} />
                      Бесплатно
                    </span>
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between items-center">
                    <span className="font-bold text-gray-900 dark:text-gray-100">Итого:</span>
                    <motion.span
                      key={finalTotal}
                      animate={{ scale: [1, 1.1, 1] }}
                      className="font-bold text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
                    >
                      {Math.round(finalTotal)} ₽
                    </motion.span>
                  </div>
                </div>

                {/* Checkout Button */}
                <motion.button
                  whileHover={{ 
                    scale: 1.02,
                    boxShadow: "0 10px 30px -10px rgba(168, 85, 247, 0.5)"
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-2xl font-bold text-lg relative overflow-hidden group"
                >
                  {/* Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  
                  <span className="relative flex items-center justify-center gap-2">
                    Оформить заказ
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Rocket size={20} />
                    </motion.div>
                  </span>
                </motion.button>

                {/* Security Badge */}
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    🔒 Безопасная оплата • 🚚 Быстрая доставка
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}