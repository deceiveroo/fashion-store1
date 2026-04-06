'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/context/CartContext';
import FavoriteButton from './FavoriteButton';
import { useState, useEffect, useMemo } from 'react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categories: string[]; // Обновлено: теперь массив категорий
  inStock: boolean;
  featured: boolean;
  mainImage?: string;
  images?: { id: string; url: string; isMain: boolean }[];
}

interface ProductCardProps {
  product: Product;
}

// ✅ ДЕТЕРМИНИРОВАННЫЙ placeholder на основе product.id
const getPlaceholderImage = (productId: string, width: number = 300, height: number = 300): string => {
  // Создаем стабильный хэш из product.id
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    const char = productId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & 0xFFFFFFFF; // Convert to 32-bit integer
  }
  const seed = Math.abs(hash) % 10000; // Keep seed reasonable

  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
};

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();

  // ✅ Инициализируем изображение при монтировании
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const currentImage = useMemo(() => {
    if (product.mainImage && product.mainImage.trim() !== '' && product.mainImage !== '/placeholder-image.jpg') {
      return product.mainImage;
    }

    // Fallback - детерминированный placeholder
    return getPlaceholderImage(product.id, 300, 300);
  }, [product.id, product.mainImage]);

  // ✅ Получаем данные для корзины
  const getCartItemData = () => ({
    id: product.id,
    name: product.name,
    price: product.price,
    image: currentImage,
  });

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    addItem(getCartItemData());
    toast.success(`${product.name} добавлен в корзину!`);
  };

  const handleImageError = () => {
    // Используем детерминированный placeholder при ошибке
    console.warn(`Image failed to load for product ${product.id}`);
    setImageError(true);
    setImageLoaded(true);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const hasRealImages = !!(product.mainImage && 
    product.mainImage.trim() !== '' && 
    product.mainImage !== '/placeholder-image.jpg'
  );

  return (
    <Link href={`/products/${product.id}`} className="block">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        whileHover={{ y: -5 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 overflow-hidden group cursor-pointer h-full flex flex-col border border-transparent dark:border-gray-700"
      >
        {/* Image Container */}
        <div className="relative overflow-hidden bg-gray-100 dark:bg-gray-700 flex-1">
          <img
            src={currentImage}
            alt={product.name}
            onError={handleImageError}
            onLoad={handleImageLoad}
            className={`w-full h-64 object-cover transition-all duration-300 ${
              imageLoaded && hasRealImages ? 'group-hover:scale-110' : ''
            } ${!imageLoaded ? 'opacity-0' : 'opacity-100'}`}
          />
          
          {/* Лоадер */}
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-purple-600 dark:border-purple-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          
          {/* Overlay Actions */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 dark:group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-3 rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                title={product.inStock ? 'Добавить в корзину' : 'Товар недоступен'}
              >
                <ShoppingBag size={20} />
              </motion.button>
              
              <FavoriteButton productId={product.id} />
            </div>
          </div>

          {/* Badge */}
          {product.featured && (
            <div className="absolute top-4 left-4 bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-500 dark:to-pink-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              Хит недели
            </div>
          )}

          {/* Stock Status */}
          {!product.inStock && (
            <div className="absolute top-4 right-4 bg-red-600 dark:bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              Нет в наличии
            </div>
          )}

          {/* No Image Badge */}
          {!hasRealImages && imageLoaded && (
            <div className="absolute top-4 left-4 bg-gray-600 dark:bg-gray-700 text-white px-3 py-1 rounded-full text-sm font-medium">
              Нет фото
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 flex-1 flex flex-col">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
            {product.name}
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2 flex-1">
            {product.description}
          </p>
          
          <div className="flex items-center justify-between mt-auto">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {product.price.toLocaleString('ru-RU')} ₽
            </span>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-500 dark:to-pink-500 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {product.inStock ? 'В корзину' : 'Нет в наличии'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}