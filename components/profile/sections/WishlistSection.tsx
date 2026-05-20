'use client';

import { Heart, ExternalLink, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { WishlistItem } from '@/app/profile/hooks/useProfileData';

interface WishlistSectionProps {
  wishlist: WishlistItem[];
  handleRemoveFromWishlist: (productId: string) => Promise<void>;
}

export default function WishlistSection({ wishlist, handleRemoveFromWishlist }: WishlistSectionProps) {
  if (wishlist.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart size={64} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Список избранного пуст
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Добавьте товары в избранное, чтобы быстро найти их позже
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {wishlist.map((item) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ duration: 0.2 }}
          className="group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
        >
          {/* Product Image */}
          <Link href={`/products/${item.productId}`} className="block">
            <div className="relative aspect-square overflow-hidden">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <Heart size={48} className="text-gray-300 dark:text-gray-600" />
                </div>
              )}
              
              {/* Quick View Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 rounded-full text-sm font-semibold text-gray-900 dark:text-white shadow-lg">
                    <ExternalLink size={16} />
                    Смотреть товар
                  </span>
                </div>
              </div>
            </div>
          </Link>

          {/* Product Info */}
          <div className="p-4">
            <Link href={`/products/${item.productId}`} className="block">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {item.product.name}
              </h4>
            </Link>
            
            <div className="flex items-center justify-between">
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                {item.product.price.toLocaleString('ru-RU')} ₽
              </p>
              
              <motion.button
                onClick={() => handleRemoveFromWishlist(item.productId)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title="Удалить из избранного"
              >
                <Trash2 size={18} />
              </motion.button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
