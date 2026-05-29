'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, ShoppingBag, Sparkles, Rocket, Gift, ShieldCheck, ArrowRight, Trash2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProxyImage from '@/components/ProxyImage';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Cart({ isOpen, onClose }: CartProps) {
  const { state, removeItem, updateQuantity, clearCart } = useCart();
  const router = useRouter();
  
  const items = state?.items || [];
  const total = state?.total || 0;
  const itemCount = state?.itemCount || 0;

  // Блокируем скролл основной страницы при открытой корзине
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Группируем товары по ID (одинаковые товары с разными размерами)
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.id]) {
      acc[item.id] = {
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        variants: []
      };
    }
    acc[item.id].variants.push({
      size: item.size,
      color: item.color,
      quantity: item.quantity
    });
    return acc;
  }, {} as Record<string, {
    id: string;
    name: string;
    price: number;
    image: string;
    variants: Array<{ size?: string; color?: string; quantity: number }>;
  }>);

  const groupedItemsList = Object.values(groupedItems);

  const handleUpdateQuantity = (
    id: string,
    size: string | undefined,
    color: string | undefined,
    quantity: number
  ) => {
    if (quantity < 1) {
      removeItem(id, size, color);
      toast.success('Товар удален из корзины ✨');
      return;
    }
    updateQuantity(id, quantity, size, color);
  };

  const handleRemoveItem = (
    id: string,
    size: string | undefined,
    color: string | undefined
  ) => {
    removeItem(id, size, color);
    toast.success('Товар удален из корзины ✨');
  };

  const handleCheckout = () => {
    onClose();
    router.push('/checkout');
  };

  const getDiscount = () => {
    if (total > 5000) return 500;
    if (total > 3000) return 300;
    if (total > 1000) return 100;
    return 0;
  };

  const finalTotal = Math.max(0, total - getDiscount());

  // Free shipping threshold
  const FREE_SHIPPING_THRESHOLD = 3000;
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - total);
  const freeShippingProgress = Math.min(100, (total / FREE_SHIPPING_THRESHOLD) * 100);

  // Next discount tier
  const getNextDiscountTier = () => {
    if (total < 1000) return { threshold: 1000, discount: 100, label: 'Скидка 100 ₽' };
    if (total < 3000) return { threshold: 3000, discount: 300, label: 'Скидка 300 ₽' };
    if (total < 5000) return { threshold: 5000, discount: 500, label: 'Скидка 500 ₽' };
    return null;
  };

  const nextTier = getNextDiscountTier();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay с мягким размытием */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-[6px] z-50 cursor-pointer"
          />

          {/* Панель корзины с эффектом Glassmorphism */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            data-cart-panel
            className="fixed right-0 top-0 h-full w-full sm:max-w-md bg-[var(--fc-surface)] backdrop-blur-2xl z-50 shadow-[0_0_50px_rgba(0,0,0,0.15)] dark:shadow-[0_0_60px_rgba(0,0,0,0.6)] border-l border-[var(--fc-glass-border)] flex flex-col"
          >
            {/* Header */}
            <div className="relative p-6 border-b border-[var(--fc-glass-border)] bg-[var(--fc-surface-elevated)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl text-white shadow-md shadow-purple-500/20" style={{ background: 'linear-gradient(135deg, #8b7cf6, #c4b5fd)' }}>
                    <ShoppingBag size={20} className="animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[var(--foreground)]">Корзина</h2>
                    <p className="text-[var(--text-secondary)] text-xs font-medium mt-0.5">
                      {itemCount} {itemCount === 1 ? 'товар' : itemCount > 1 && itemCount < 5 ? 'товара' : 'товаров'}
                    </p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.08, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="p-2 text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--fc-surface)] rounded-xl transition-all"
                >
                  <X size={20} />
                </motion.button>
              </div>

              {/* Sparkle micro-animation */}
              <div className="absolute top-4 right-16 pointer-events-none opacity-60">
                <motion.div
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Sparkles size={14} className="text-[#8b7cf6]" />
                </motion.div>
              </div>
            </div>

            {/* List Container */}
            <div className="flex-1 overflow-y-auto py-4 px-6 space-y-4">
              {items.length === 0 ? (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-20 px-4 flex flex-col items-center justify-center h-full"
                >
                  <div className="w-24 h-24 rounded-full bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center mb-6 border border-gray-100 dark:border-gray-800/40">
                    <ShoppingBag size={42} className="text-gray-300 dark:text-gray-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    Ваша корзина пуста
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm max-w-[280px] mb-8 leading-relaxed">
                    Добавьте в неё стильную одежду из нашего каталога, чтобы сделать заказ.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-purple-500/20 hover:shadow-xl transition-all"
                  >
                    Перейти в каталог
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div layout className="space-y-4">
                  {groupedItemsList.map((group, index) => (
                    <motion.div
                      key={group.id}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.25, delay: index * 0.05 }}
                      className="group relative bg-[var(--fc-surface-elevated)] backdrop-blur-md rounded-2xl p-4 shadow-sm border border-[var(--fc-glass-border)] hover:border-[#8b7cf6]/40 transition-all duration-300 overflow-hidden"
                    >
                      {/* Subtly colored decorative corner */}
                      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-bl-full pointer-events-none" />

                      <div className="flex gap-4">
                        {/* Image */}
                        <div className="relative w-20 h-20 bg-gray-50 dark:bg-gray-950 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-900/60 flex-shrink-0">
                          {group.image ? (
                            <ProxyImage
                              src={group.image}
                              alt={group.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              proxyWidth={128}
                              fallbackSrc="/placeholder-image.jpg"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800 text-gray-300">
                              <ShoppingBag size={24} />
                            </div>
                          )}
                        </div>

                        {/* Info & Variants */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-gray-900 dark:text-white text-sm leading-snug line-clamp-2 pr-4 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                              {group.name}
                            </h4>
                          </div>

                          <div className="space-y-2 mt-2">
                            {group.variants.map((v, vIdx) => (
                              <div key={vIdx} className="flex items-center justify-between bg-gray-50/70 dark:bg-gray-900/60 px-3 py-1.5 rounded-xl border border-gray-100/50 dark:border-gray-800/40">
                                <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                                  {v.size && (
                                    <span className="text-[10px] text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-full font-bold border border-purple-100 dark:border-purple-900/30">
                                      {v.size}
                                    </span>
                                  )}
                                  {v.color && (
                                    <span className="text-[10px] text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/40 px-2 py-0.5 rounded-full font-bold border border-pink-100 dark:border-pink-900/30">
                                      {v.color}
                                    </span>
                                  )}
                                </div>

                                {/* Controls */}
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleUpdateQuantity(group.id, v.size, v.color, v.quantity - 1)}
                                    className="w-5.5 h-5.5 flex items-center justify-center bg-white dark:bg-gray-800 text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 border border-gray-100 dark:border-gray-700 rounded-lg shadow-sm hover:shadow transition-all"
                                  >
                                    <Minus size={10} />
                                  </button>
                                  <span className="text-xs font-bold text-gray-950 dark:text-white min-w-[14px] text-center">
                                    {v.quantity}
                                  </span>
                                  <button
                                    onClick={() => handleUpdateQuantity(group.id, v.size, v.color, v.quantity + 1)}
                                    className="w-5.5 h-5.5 flex items-center justify-center bg-white dark:bg-gray-800 text-gray-500 hover:text-pink-600 dark:hover:text-pink-400 border border-gray-100 dark:border-gray-700 rounded-lg shadow-sm hover:shadow transition-all"
                                  >
                                    <Plus size={10} />
                                  </button>

                                  <button
                                    onClick={() => handleRemoveItem(group.id, v.size, v.color)}
                                    className="ml-1 p-1 text-gray-400 hover:text-red-500 rounded-md transition-colors"
                                    title="Удалить этот вариант"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center justify-between mt-2.5">
                            <span className="font-extrabold text-base bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                              {Math.round(group.price).toLocaleString('ru-RU')} ₽
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Upsell Sections & Summary */}
            {items.length > 0 && (
              <div className="border-t border-gray-100 dark:border-gray-800/80 bg-gray-50/50 dark:bg-gray-950/40">
                {/* Free Shipping Progress */}
                {remainingForFreeShipping > 0 ? (
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800/60 bg-gradient-to-r from-purple-500/5 to-pink-500/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                        <Rocket size={14} className="text-purple-500" />
                        До бесплатной доставки:
                      </span>
                      <span className="text-xs font-extrabold text-purple-600 dark:text-purple-400">
                        {remainingForFreeShipping.toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                    
                    <div className="h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${freeShippingProgress}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5">
                      Добавьте вещи на {remainingForFreeShipping.toLocaleString('ru-RU')} ₽, чтобы сэкономить на доставке!
                    </p>
                  </div>
                ) : (
                  <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-800/60 bg-emerald-500/5 flex items-center gap-2">
                    <div className="p-1 bg-emerald-500 rounded-full text-white">
                      <Rocket size={10} />
                    </div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      Поздравляем! Вам доступна бесплатная доставка 🎉
                    </span>
                  </div>
                )}

                {/* Discount Tier progress */}
                {nextTier && (
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800/60 bg-gradient-to-r from-green-500/5 to-emerald-500/5">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl text-white shadow-sm flex-shrink-0">
                        <Gift size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900 dark:text-white mb-0.5">
                          Получите {nextTier.label}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                          Нужно добавить ещё на {(nextTier.threshold - total).toLocaleString('ru-RU')} ₽
                        </p>
                        <div className="mt-2 h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (total / nextTier.threshold) * 100)}%` }}
                            transition={{ duration: 0.6 }}
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pricing Footer */}
                <div className="p-6 bg-[var(--fc-surface-elevated)] border-t border-[var(--fc-glass-border)] space-y-4">
                  {/* Discount Badge */}
                  {getDiscount() > 0 && (
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2.5 rounded-xl shadow-sm text-xs font-bold"
                    >
                      <Gift size={14} className="animate-bounce" />
                      <span>Ваша скидка активирована: -{getDiscount()} ₽</span>
                    </motion.div>
                  )}

                  <div className="space-y-2.5 text-xs text-[var(--text-secondary)]">
                    <div className="flex justify-between items-center">
                      <span>Товары ({itemCount} шт.)</span>
                      <span className="font-bold text-[var(--foreground)]">{Math.round(total).toLocaleString('ru-RU')} ₽</span>
                    </div>

                    {getDiscount() > 0 && (
                      <div className="flex justify-between items-center text-green-600 dark:text-green-400">
                        <span>Скидка по сумме заказа</span>
                        <span className="font-bold">-{getDiscount()} ₽</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span>Доставка</span>
                      {total >= FREE_SHIPPING_THRESHOLD ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <Rocket size={12} />
                          Бесплатно
                        </span>
                      ) : (
                        <span className="font-bold text-[var(--foreground)]">300 ₽</span>
                      )}
                    </div>

                    <div className="border-t border-[var(--fc-glass-border)] pt-3 mt-3 flex justify-between items-center text-sm">
                      <span className="font-bold text-[var(--foreground)]">Итого к оплате:</span>
                      <motion.span
                        key={finalTotal}
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 0.3 }}
                        className="text-lg font-black bg-clip-text text-transparent"
                        style={{ backgroundImage: 'linear-gradient(135deg, #8b7cf6, #c4b5fd)' }}
                      >
                        {Math.round(finalTotal).toLocaleString('ru-RU')} ₽
                      </motion.span>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <motion.button
                    whileHover={{
                      scale: 1.02,
                      boxShadow: "0 10px 25px -5px rgba(139, 124, 246, 0.45)"
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCheckout}
                    className="w-full text-white py-3.5 px-6 rounded-xl font-bold text-sm relative overflow-hidden group shadow-md transition-all flex items-center justify-center gap-2"
                    style={{ backgroundImage: 'linear-gradient(135deg, #8b7cf6, #c4b5fd)' }}
                  >
                    {/* Shiny hover effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    
                    <span>Оформить заказ</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </motion.button>

                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                    <ShieldCheck size={12} className="text-emerald-500" />
                    <span>Безопасная оплата • Экспресс-доставка</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}