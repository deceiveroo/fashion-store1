'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { Heart, Star, ArrowLeft, ShoppingBag, Sparkles, TrendingUp, Shield, Truck } from 'lucide-react';
import Link from 'next/link';
import AddToCartButton from './AddToCartButton';
import FavoriteButton from './FavoriteButton';
import { useState, useRef } from 'react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categories: string[];
  inStock: boolean;
  featured: boolean;
  images: { id: string; url: string; isMain: boolean }[];
}

interface ProductClientProps {
  product: Product;
}

const getPlaceholderImage = (productId: string, width: number = 800, height: number = 800): string => {
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    const char = productId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & 0xFFFFFFFF;
  }
  const seed = Math.abs(hash) % 10000;
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
};

export default function ProductClient({ product }: ProductClientProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });
  
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

  const mainImage = product.images.find(img => img.isMain) || product.images[0];
  const allImages = product.images.length > 0 ? product.images : [
    { id: '1', url: getPlaceholderImage(product.id, 800, 800), isMain: true }
  ];
  
  const cartItemData = {
    id: product.id,
    name: product.name,
    price: product.price,
    image: allImages[selectedImage]?.url || getPlaceholderImage(product.id, 800, 800)
  };

  const features = [
    { icon: Shield, title: 'Гарантия качества', description: '100% оригинал' },
    { icon: Truck, title: 'Быстрая доставка', description: 'От 1 дня' },
    { icon: TrendingUp, title: 'Популярный товар', description: '1000+ покупок' },
    { icon: Sparkles, title: 'Премиум', description: 'Эксклюзив' },
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link 
            href="/collections"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors group"
          >
            <motion.div
              whileHover={{ x: -5 }}
              transition={{ duration: 0.2 }}
            >
              <ArrowLeft size={20} />
            </motion.div>
            <span className="font-medium">Назад к коллекциям</span>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <motion.div
            style={{ opacity, scale }}
            className="space-y-6"
          >
            {/* Main Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="relative aspect-square overflow-hidden rounded-3xl bg-white dark:bg-gray-800 shadow-2xl"
            >
              <motion.img
                key={selectedImage}
                src={allImages[selectedImage]?.url}
                alt={product.name}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full h-full object-cover"
              />
              
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
              
              {/* Featured badge */}
              {product.featured && (
                <motion.div
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="absolute top-6 left-6 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-2xl"
                  style={{ backgroundSize: "200% 100%" }}
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <Sparkles size={20} className="animate-pulse" />
                  Хит недели
                </motion.div>
              )}
            </motion.div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {allImages.map((image, index) => (
                  <motion.button
                    key={image.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square overflow-hidden rounded-2xl transition-all duration-300 ${
                      selectedImage === index
                        ? 'ring-4 ring-purple-600 shadow-xl'
                        : 'ring-2 ring-gray-200 dark:ring-gray-700 hover:ring-purple-400'
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={`${product.name} view ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              {/* Title */}
              <h1 className="text-5xl font-black text-gray-900 dark:text-white leading-tight">
                {product.name}
              </h1>

              {/* Price */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-baseline gap-4"
              >
                <span className="text-5xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {product.price.toLocaleString('ru-RU')} ₽
                </span>
                <span className="text-lg text-gray-500 dark:text-gray-400 line-through">
                  {(product.price * 1.3).toLocaleString('ru-RU')} ₽
                </span>
                <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  -30%
                </span>
              </motion.div>

              {/* Description */}
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                {product.description}
              </p>

              {/* Categories & Stock */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-md">
                  <span className="text-gray-600 dark:text-gray-400">Категории:</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400">
                    {product.categories.join(', ')}
                  </span>
                </div>
                
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-md ${
                  product.inStock 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${product.inStock ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                  <span className="font-bold">
                    {product.inStock ? 'В наличии' : 'Нет в наличии'}
                  </span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 pt-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 min-w-[200px]"
                >
                  <AddToCartButton 
                    product={cartItemData} 
                    disabled={!product.inStock}
                  />
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FavoriteButton productId={product.id} size={28} />
                </motion.div>
              </div>
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-2 gap-4"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700"
                >
                  <feature.icon className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-2" />
                  <h4 className="font-bold text-gray-900 dark:text-white mb-1">{feature.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* Product Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-700"
            >
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Sparkles className="text-purple-600" />
                Детали товара
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <span className="text-gray-600 dark:text-gray-400 block mb-1">Артикул</span>
                  <span className="font-bold text-gray-900 dark:text-white">#{product.id.substring(0, 8).toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400 block mb-1">Категории</span>
                  <span className="font-bold text-gray-900 dark:text-white capitalize">{product.categories.join(', ')}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400 block mb-1">Состав</span>
                  <span className="font-bold text-gray-900 dark:text-white">Премиум материалы</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400 block mb-1">Уход</span>
                  <span className="font-bold text-gray-900 dark:text-white">Деликатная стирка</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
