'use client';

import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ShoppingBag, Heart, Eye, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/context/CartContext';
import FavoriteButton from './FavoriteButton';
import { useState, useEffect, useMemo, useRef } from 'react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categories: string[];
  inStock: boolean;
  featured: boolean;
  mainImage?: string;
  images?: { id: string; url: string; isMain: boolean }[];
}

interface ProductCardProps {
  product: Product;
}

const getPlaceholderImage = (productId: string, width: number = 400, height: number = 500): string => {
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    const char = productId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & 0xFFFFFFFF;
  }
  const seed = Math.abs(hash) % 10000;
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
};

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const cardRef = useRef<HTMLDivElement>(null);
  
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // 3D tilt effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7.5deg", "-7.5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7.5deg", "7.5deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  const currentImage = useMemo(() => {
    if (product.mainImage && product.mainImage.trim() !== '' && product.mainImage !== '/placeholder-image.jpg') {
      return product.mainImage;
    }
    return getPlaceholderImage(product.id, 400, 500);
  }, [product.id, product.mainImage]);

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
    toast.success(
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-purple-500" />
        <span>{product.name} добавлен в корзину!</span>
      </div>
    );
  };

  const handleImageError = () => {
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
    <Link href={`/products/${product.id}`} className="block group">
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="relative bg-white dark:bg-gray-900 rounded-3xl overflow-hidden cursor-pointer h-full flex flex-col"
      >
        {/* Animated gradient border */}
        <motion.div
          className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: "linear-gradient(45deg, #8b5cf6, #ec4899, #8b5cf6)",
            backgroundSize: "200% 200%",
            padding: "2px",
            zIndex: 0,
          }}
          animate={{
            backgroundPosition: isHovered ? ["0% 50%", "100% 50%", "0% 50%"] : "0% 50%",
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <div className="w-full h-full bg-white dark:bg-gray-900 rounded-3xl" />
        </motion.div>

        {/* Content wrapper */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Image Container with parallax */}
          <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700">
            <motion.div
              style={{
                transform: isHovered ? "translateZ(20px)" : "translateZ(0px)",
              }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              <motion.img
                src={currentImage}
                alt={product.name}
                onError={handleImageError}
                onLoad={handleImageLoad}
                className={`w-full h-80 object-cover transition-all duration-700 ${
                  imageLoaded && hasRealImages ? 'group-hover:scale-110' : ''
                } ${!imageLoaded ? 'opacity-0' : 'opacity-100'}`}
                animate={{
                  filter: isHovered ? "brightness(1.1)" : "brightness(1)",
                }}
              />
              
              {/* Shimmer effect */}
              {imageLoaded && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: "-100%" }}
                  animate={{ x: isHovered ? "100%" : "-100%" }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                />
              )}
            </motion.div>
            
            {/* Loading skeleton */}
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100 dark:from-gray-800 dark:to-gray-700">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 border-4 border-purple-600 dark:border-purple-400 border-t-transparent rounded-full"
                />
              </div>
            )}
            
            {/* Floating action buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end justify-center pb-6 gap-3"
            >
              <motion.button
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-4 rounded-2xl shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
                title={product.inStock ? 'Добавить в корзину' : 'Товар недоступен'}
              >
                <ShoppingBag size={22} />
              </motion.button>
              
              <motion.div
                whileHover={{ scale: 1.1, rotate: -5 }}
                whileTap={{ scale: 0.9 }}
              >
                <FavoriteButton productId={product.id} />
              </motion.div>

              <motion.button
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-4 rounded-2xl shadow-2xl backdrop-blur-sm"
                title="Быстрый просмотр"
              >
                <Eye size={22} />
              </motion.button>
            </motion.div>

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {product.featured && (
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg backdrop-blur-sm"
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
                  <Sparkles size={16} className="animate-pulse" />
                  Хит недели
                </motion.div>
              )}

              {!hasRealImages && imageLoaded && (
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gray-900/80 dark:bg-gray-700/80 text-white px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm"
                >
                  Нет фото
                </motion.div>
              )}
            </div>

            {!product.inStock && (
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="absolute top-4 right-4 bg-red-600 dark:bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg"
              >
                Нет в наличии
              </motion.div>
            )}
          </div>

          {/* Content */}
          <motion.div
            style={{
              transform: isHovered ? "translateZ(30px)" : "translateZ(0px)",
            }}
            transition={{ duration: 0.3 }}
            className="p-6 flex-1 flex flex-col bg-white dark:bg-gray-900"
          >
            <motion.h3
              className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2"
              animate={{
                color: isHovered ? "#8b5cf6" : undefined,
              }}
              transition={{ duration: 0.3 }}
            >
              {product.name}
            </motion.h3>
            
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2 flex-1">
              {product.description}
            </p>
            
            {/* Price and CTA */}
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">Цена</span>
                <motion.span
                  className="text-3xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
                  animate={{
                    scale: isHovered ? 1.05 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {product.price.toLocaleString('ru-RU')} ₽
                </motion.span>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className="relative bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group/btn"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600"
                  initial={{ x: "100%" }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
                <span className="relative z-10 flex items-center gap-2">
                  {product.inStock ? (
                    <>
                      <ShoppingBag size={18} />
                      Купить
                    </>
                  ) : (
                    'Нет в наличии'
                  )}
                </span>
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Glow effect */}
        <motion.div
          className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 -z-10"
          animate={{
            scale: isHovered ? 1.05 : 1,
          }}
        />
      </motion.div>
    </Link>
  );
}
