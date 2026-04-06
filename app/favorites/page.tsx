// app/favorites/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Eye, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

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
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

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

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 pt-24">
        <div className="max-w-4xl mx-auto px-4 text-center py-16">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-8"
          >
            <Heart size={80} className="mx-auto text-gray-400 mb-4" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-950 mb-4">Необходима авторизация</h1>
          <p className="text-gray-700 mb-8">Пожалуйста, войдите в систему чтобы просмотреть избранное.</p>
          <Link
            href="/auth/signin"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-2xl font-semibold hover:shadow-xl transition-all"
          >
            Войти в аккаунт
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 pt-24">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-700">Загрузка избранного...</p>
          </div>
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 pt-24">
        <div className="max-w-4xl mx-auto px-4 text-center py-16">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-8"
          >
            <Heart size={80} className="mx-auto text-gray-500 mb-4" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-950 mb-4">Хит недели пуст</h1>
          <p className="text-gray-700 mb-8">Добавьте товары в избранное, чтобы они появились здесь.</p>
          <Link
            href="/collections"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-2xl font-semibold hover:shadow-xl transition-all"
          >
            Начать покупки
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 pt-24">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Хит недели
          </h1>
          <p className="text-gray-700 text-center">
            {favorites.length} товар{favorites.length !== 1 ? 'а' : ''} в избранном
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favorites.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/90 backdrop-blur-sm rounded-3xl p-4 shadow-2xl border border-white/50 hover:shadow-3xl transition-all group"
            >
              <div className="relative mb-4">
                <Link href={`/products/${item.id}`}>
                  <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-gray-100">
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
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 hover:text-purple-600 transition-colors">
                      {item.name}
                    </h3>
                  </Link>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {item.price.toLocaleString()} ₽
                  </span>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/products/${item.id}`}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                  >
                    <Eye size={16} />
                    Посмотреть
                  </Link>

                  {item.inStock && (
                    <button className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-3 py-2 rounded-xl text-sm font-medium transition-all">
                      <ShoppingCart size={16} />
                      В корзину
                    </button>
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