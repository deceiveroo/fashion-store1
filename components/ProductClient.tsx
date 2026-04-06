'use client';

import { motion } from 'framer-motion';
import { Heart, Star, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import AddToCartButton from './AddToCartButton';
import FavoriteButton from './FavoriteButton';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categories: string[]; // Обновлено: теперь массив категорий
  inStock: boolean;
  featured: boolean;
  images: { id: string; url: string; isMain: boolean }[];
}

interface ProductClientProps {
  product: Product;
}

// ✅ Детерминированная функция для placeholder на основе product.id
const getPlaceholderImage = (productId: string, width: number = 600, height: number = 600): string => {
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

export default function ProductClient({ product }: ProductClientProps) {
  const mainImage = product.images.find(img => img.isMain) || product.images[0];
  const otherImages = product.images.filter(img => img.id !== mainImage?.id);
  
  // Подготовим данные для корзины
  const cartItemData = {
    id: product.id,
    name: product.name,
    price: product.price,
    image: mainImage?.url || getPlaceholderImage(product.id, 600, 600)
  };

  return (
    <div className="min-h-screen bg-white pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Кнопка назад */}
        <Link 
          href="/collections"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-purple-600 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Назад к коллекциям
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Изображения товара */}
          <div className="space-y-4">
            {/* Главное изображение */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="aspect-square overflow-hidden rounded-2xl bg-gray-100"
            >
              <img
                src={mainImage?.url || getPlaceholderImage(product.id, 600, 600)}
                alt={product.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </motion.div>

            {/* Дополнительные изображения */}
            {otherImages.length > 0 && (
              <div className="grid grid-cols-4 gap-4">
                {otherImages.map((image, index) => (
                  <motion.div
                    key={image.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="aspect-square overflow-hidden rounded-lg bg-gray-100"
                  >
                    <img
                      src={image.url}
                      alt={`${product.name} view ${index + 2}`}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Информация о товаре */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {product.name}
              </h1>

              {product.featured && (
                <div className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-sm font-medium mb-4">
                  <Star size={14} />
                  <span>Хит недели</span>
                </div>
              )}

              <p className="text-3xl font-bold text-gray-900 mb-6">
                {product.price.toLocaleString('ru-RU')} ₽
              </p>

              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                {product.description}
              </p>

              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Категории:</span>
                  <span className="font-medium text-purple-600">{product.categories.join(', ')}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Наличие:</span>
                  <span className={`font-medium ${product.inStock ? 'text-green-600' : 'text-red-600'}`}>
                    {product.inStock ? 'В наличии' : 'Нет в наличии'}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <AddToCartButton 
                  product={cartItemData} 
                  disabled={!product.inStock}
                />
                
                <FavoriteButton productId={product.id} size={24} />
              </div>
            </motion.div>

            {/* Детали товара */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="border-t pt-6"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Детали товара</h3>
              <div className="grid grid-cols-2 gap-4 text-gray-600">
                <div>
                  <span className="font-medium">Артикул:</span>
                  <span className="ml-2">#{product.id.substring(0, 8)}</span>
                </div>
                <div>
                  <span className="font-medium">Категории:</span>
                  <span className="ml-2 capitalize">{product.categories.join(', ')}</span>
                </div>
                <div>
                  <span className="font-medium">Состав:</span>
                  <span className="ml-2">Премиум материалы</span>
                </div>
                <div>
                  <span className="font-medium">Уход:</span>
                  <span className="ml-2">Деликатная стирка</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}