'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/context/CartContext';
import FavoriteButton from './FavoriteButton';
import { useState, useMemo, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';

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
    hash = ((hash << 5) - hash) + productId.charCodeAt(i);
    hash = hash & 0xFFFFFFFF;
  }
  const seed = Math.abs(hash) % 10000;
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
};

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const router = useRouter();

  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(product.price);
  const [currentStock, setCurrentStock] = useState(product.inStock);
  const realtimeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const currentImage = useMemo(() => {
    if (product.mainImage && product.mainImage.trim() !== '' && product.mainImage !== '/placeholder-image.jpg') {
      return product.mainImage;
    }
    return getPlaceholderImage(product.id, 400, 500);
  }, [product.id, product.mainImage]);

  const getCartItemData = () => ({
    id: product.id,
    name: product.name,
    price: currentPrice,
    image: currentImage,
  });

  useEffect(() => {
    const channel = supabase
      .channel(`product-${product.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
          filter: `id=eq.${product.id}`,
        },
        (payload) => {
          const newProduct = payload.new as { price?: number; stock?: number };
          if (newProduct.price !== undefined && newProduct.price !== currentPrice) {
            setCurrentPrice(newProduct.price);
          }
          if (newProduct.stock !== undefined) {
            setCurrentStock(newProduct.stock > 0);
          }
        }
      )
      .subscribe();

    realtimeChannelRef.current = channel;
    return () => {
      if (realtimeChannelRef.current) supabase.removeChannel(realtimeChannelRef.current);
    };
  }, [product.id, currentPrice]);

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block"
      onMouseEnter={() => router.prefetch(`/products/${product.id}`)}
    >
      <article className="flex flex-col">
        {/* Изображение */}
        <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-neutral-900 mb-4">
          <img
            src={currentImage}
            alt={product.name}
            onError={() => setImageLoaded(true)}
            onLoad={() => setImageLoaded(true)}
            className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {!imageLoaded && (
            <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-neutral-800" />
          )}

          {/* Бейджи */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.featured && (
              <span className="px-3 py-1.5 text-[10px] font-medium tracking-wider uppercase bg-white/95 dark:bg-black/90 text-gray-900 dark:text-white backdrop-blur-sm">
                Хит
              </span>
            )}
            {!currentStock && (
              <span className="px-3 py-1.5 text-[10px] font-medium tracking-wider uppercase bg-gray-900/90 dark:bg-white/90 text-white dark:text-gray-900 backdrop-blur-sm">
                Нет в наличии
              </span>
            )}
          </div>

          {/* Кнопка избранного */}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <FavoriteButton productId={product.id} />
          </div>
        </div>

        {/* Информация о товаре */}
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white tracking-wide line-clamp-1">
            {product.name}
          </h3>
          
          <p className="text-xs text-gray-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          <div className="flex items-center justify-between pt-2 mt-auto">
            <span className="text-base font-medium text-gray-900 dark:text-white">
              {currentPrice.toLocaleString('ru-RU')} ₽
            </span>
            
            {currentStock && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  addItem(getCartItemData());
                  toast.success(`${product.name} добавлен в корзину`);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-neutral-200 transition-colors duration-200"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>В корзину</span>
              </button>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
