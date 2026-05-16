'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/context/CartContext';
import FavoriteButton from './FavoriteButton';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  inStock: boolean;
  mainImage?: string;
  images?: { id: string; url: string; isMain: boolean }[];
}

interface QuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string | null;
}

export default function QuickViewModal({ isOpen, onClose, productId }: QuickViewModalProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const { addItem } = useCart();

  useEffect(() => {
    if (productId && isOpen) {
      fetchProduct(productId);
    }
  }, [productId, isOpen]);

  const fetchProduct = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/products/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProduct(data.product);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Ошибка загрузки товара');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.mainImage || '',
      size: selectedSize || undefined,
    });

    toast.success(`${product.name} добавлен в корзину`);
    onClose();
  };

  const images = product?.images && product.images.length > 0 
    ? product.images 
    : product?.mainImage 
      ? [{ id: '1', url: product.mainImage, isMain: true }]
      : [];

  const nextImage = () => {
    if (images.length > 0) {
      setSelectedImage((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (images.length > 0) {
      setSelectedImage((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto pointer-events-auto">
              {loading ? (
                <div className="flex items-center justify-center h-96">
                  <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : product ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                  {/* Image Gallery */}
                  <div className="relative">
                    <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                      {images.length > 0 && (
                        <img
                          src={images[selectedImage]?.url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    {/* Navigation Arrows */}
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 dark:bg-gray-800/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 dark:bg-gray-800/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}

                    {/* Image Dots */}
                    {images.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {images.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedImage(idx)}
                            className={`w-2 h-2 rounded-full transition-all ${
                              idx === selectedImage
                                ? 'bg-purple-600 w-6'
                                : 'bg-white/50 hover:bg-white/80'
                            }`}
                          />
                        ))}
                      </div>
                    )}

                    {/* Close Button */}
                    <button
                      onClick={onClose}
                      className="absolute top-4 right-4 w-10 h-10 bg-white/90 dark:bg-gray-800/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Product Info */}
                  <div className="flex flex-col">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {product.name}
                    </h2>

                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {product.price.toLocaleString('ru-RU')} ₽
                      </span>
                      {!product.inStock && (
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                          Нет в наличии
                        </span>
                      )}
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 mb-6 line-clamp-4">
                      {product.description}
                    </p>

                    {/* Size Selection */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Размер
                      </label>
                      <div className="flex gap-2">
                        {['XS', 'S', 'M', 'L', 'XL'].map((size) => (
                          <button
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                              selectedSize === size
                                ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-600'
                                : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mt-auto">
                      <button
                        onClick={handleAddToCart}
                        disabled={!product.inStock}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <ShoppingBag className="w-5 h-5" />
                        В корзину
                      </button>
                      <FavoriteButton productId={product.id} />
                    </div>

                    {/* View Full Details Link */}
                    <a
                      href={`/products/${product.id}`}
                      className="mt-4 text-center text-sm text-purple-600 hover:text-purple-700 font-medium"
                      onClick={onClose}
                    >
                      Смотреть все детали →
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-96">
                  <p className="text-gray-500">Товар не найден</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
