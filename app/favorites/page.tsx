// app/favorites/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Eye, Trash2, Share2, Download, Tag } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';

interface FavoriteItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  inStock: boolean;
  featured: boolean;
  createdAt: Date;
}

export default function FavoritesPage() {
  const { user } = useAuth();
  const { addItem } = useCart();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [priceDrops, setPriceDrops] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchFavorites();
      checkPriceDrops();
    }
  }, [user]);

  const checkPriceDrops = async () => {
    try {
      const response = await fetch('/api/wishlist/price-check');
      if (response.ok) {
        const data = await response.json();
        // Check for items with compareAtPrice > currentPrice (discounted)
        const drops = (data.items || []).filter((item: any) => 
          item.compareAtPrice && Number(item.currentPrice) < Number(item.compareAtPrice)
        ).map((item: any) => ({
          ...item,
          discount: Number(item.compareAtPrice) - Number(item.currentPrice),
          discountPercent: Math.round(((Number(item.compareAtPrice) - Number(item.currentPrice)) / Number(item.compareAtPrice)) * 100),
        }));
        setPriceDrops(drops);
      }
    } catch (error) {
      console.error('Error checking price drops:', error);
    }
  };

  const fetchFavorites = async () => {
    try {
      const response = await fetch('/api/favorites');
      if (response.ok) {
        const data = await response.json();
        // Проверяем, что data это массив
        if (Array.isArray(data)) {
          setFavorites(data);
        } else {
          setFavorites([]);
        }
      } else {
        // Если таблица не существует, показываем пустой список
        setFavorites([]);
        console.warn('Favorites API returned error, showing empty list');
      }
    } catch (error) {
      console.warn('Favorites not available:', error);
      setFavorites([]);
      // Не показываем toast при ошибке - таблица может не существовать
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromFavorites = async (productId: string) => {
    if (!user) return;

    setRemovingIds(prev => new Set(prev).add(productId));

    try {
      const response = await fetch(`/api/favorites/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setFavorites(prev => prev.filter(item => item.id !== productId));
        toast.success('Удалено из избранного');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Ошибка при удалении из избранного');
      }
    } catch (error) {
      toast.error('Ошибка при удалении из избранного');
    } finally {
      setRemovingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const shareWishlist = async () => {
    const shareUrl = `${window.location.origin}/favorites?shared=${user?.id}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Мой список желаний',
          text: `Посмотрите мои избранные товары! ${favorites.length} товаров`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Ссылка скопирована в буфер обмена!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const addAllToCart = () => {
    const inStockItems = favorites.filter(item => item.inStock);
    
    if (inStockItems.length === 0) {
      toast.error('Нет товаров в наличии');
      return;
    }

    inStockItems.forEach(item => {
      addItem({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
      });
    });

    toast.success(`Добавлено ${inStockItems.length} товаров в корзину`);
  };

  if (!user) {
    return (
      <div className="min-h-screen fc-ambient-bg pt-24">
        <div className="max-w-4xl mx-auto px-4 text-center py-16">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-8"
          >
            <Heart size={80} className="mx-auto text-gray-400 mb-4" />
          </motion.div>
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-4">Необходима авторизация</h1>
          <p className="text-[var(--text-secondary)] mb-8">Пожалуйста, войдите в систему чтобы просмотреть избранное.</p>
          <Button href="/auth/signin" size="lg">Войти в аккаунт</Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen fc-ambient-bg pt-24">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-700 dark:text-gray-300">Загрузка избранного...</p>
          </div>
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="min-h-screen fc-ambient-bg pt-24">
        <div className="max-w-4xl mx-auto px-4 text-center py-16">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-8"
          >
            <Heart size={80} className="mx-auto text-gray-500 mb-4" />
          </motion.div>
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-4">В избранном пусто</h1>
          <p className="text-[var(--text-secondary)] mb-8">Добавьте товары в избранное, чтобы они появились здесь.</p>
          <Button href="/collections" size="lg" icon={<ShoppingCart size={18} />}>Начать покупки</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen fc-ambient-bg pt-24">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-center mb-4 uppercase tracking-tight text-[var(--foreground)]">
            Избранное
          </h1>
          <p className="text-[var(--text-secondary)] text-center">
            {favorites.length} товар{favorites.length !== 1 ? 'а' : ''} в избранном
          </p>
        </motion.div>

        {/* Price Drops Alert */}
        {priceDrops.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                <Tag className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900 dark:text-green-100">
                  Цены снизились!
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {priceDrops.length} товар{priceDrops.length !== 1 ? 'а' : ''} со скидкой
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {priceDrops.slice(0, 3).map((drop) => (
                <div key={drop.productId} className="flex items-center justify-between bg-white/50 dark:bg-black/20 rounded-lg p-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate flex-1">
                    {drop.productName}
                  </span>
                  <span className="ml-2 text-sm font-bold text-green-600">
                    -{drop.discountPercent}%
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Button onClick={addAllToCart} disabled={favorites.length === 0} fullWidth icon={<ShoppingCart size={18} />} className="sm:flex-1">
            Добавить все в корзину
          </Button>
          <Button variant="outline" onClick={shareWishlist} icon={<Share2 size={18} />}>
            Поделиться
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favorites.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="fc-glass-card p-4 hover:shadow-3xl transition-all group"
            >
              <div className="relative mb-4">
                <Link href={`/products/${item.id}`}>
                  <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-700">
                    <img
                      src={item.image || '/placeholder-image.jpg'}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-image.jpg';
                      }}
                    />
                  </div>
                </Link>

                <button
                  onClick={() => removeFromFavorites(item.id)}
                  disabled={removingIds.has(item.id)}
                  className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {removingIds.has(item.id) ? (
                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 size={16} className="text-red-600" />
                  )}
                </button>

                {item.featured && (
                  <div className="absolute top-3 left-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                    Хит
                  </div>
                )}

                {!item.inStock && (
                  <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                    <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      Нет в наличии
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <Link href={`/products/${item.id}`}>
                    <h3 className="font-semibold text-[var(--foreground)] text-sm line-clamp-2 hover:text-[#8b7cf6] transition-colors">
                      {item.name}
                    </h3>
                  </Link>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, #8b7cf6, #c4b5fd)' }}>
                    {item.price.toLocaleString()} ₽
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <Button href={`/products/${item.id}`} variant="outline" size="sm" fullWidth icon={<Eye size={16} />}>
                    Посмотреть
                  </Button>

                  {item.inStock && (
                    <Button
                      size="sm"
                      fullWidth
                      icon={<ShoppingCart size={16} />}
                      onClick={() =>
                        addItem({ id: item.id, name: item.name, price: item.price, image: item.image })
                      }
                    >
                      В корзину
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}