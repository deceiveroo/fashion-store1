'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

interface FavoriteButtonProps {
  productId: string;
  size?: number;
  onToggle?: (isFavorite: boolean) => void;
}

export default function FavoriteButton({ productId, size = 20, onToggle }: FavoriteButtonProps) {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Проверяем, находится ли товар в избранном
  useEffect(() => {
    if (user?.id) {
      checkIfFavorite();
    } else {
      setIsFavorite(false);
    }
  }, [user, productId]);

  const checkIfFavorite = async () => {
    try {
      const response = await fetch('/api/favorites');
      if (response.ok) {
        const favorites = await response.json();
        // Проверяем, что favorites это массив
        if (Array.isArray(favorites)) {
          const favorite = favorites.find((fav: { id: string }) => fav.id === productId);
          setIsFavorite(!!favorite);
        }
      }
    } catch (error) {
      // Тихо игнорируем ошибку - таблица может не существовать
      console.warn('Favorites not available:', error);
      setIsFavorite(false);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast.error('Войдите в систему чтобы добавлять в избранное');
      return;
    }

    setIsLoading(true);

    try {
      if (isFavorite) {
        // Удаляем из избранного
        const response = await fetch(`/api/favorites/${productId}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          setIsFavorite(false);
          onToggle?.(false);
          toast.success('Удалено из избранного');
        } else {
          const errorData = await response.json().catch(() => ({}));
          toast.error(errorData.error || 'Ошибка при удалении из избранного');
        }
      } else {
        // Добавляем в избранное
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ productId }),
        });
        
        if (response.ok) {
          setIsFavorite(true);
          onToggle?.(true);
          toast.success('Добавлено в избранное');
          
          // Check favorite achievements
          fetch('/api/gamification/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'favorite' }),
            credentials: 'include'
          }).catch(err => console.error('Achievement check failed:', err));
        } else {
          const errorData = await response.json().catch(() => ({}));
          if (errorData.message === 'Product already in favorites') {
            setIsFavorite(true);
            toast.success('Товар уже в избранном');
          } else {
            toast.error(errorData.error || 'Ошибка при добавлении в избранное');
          }
        }
      }
    } catch (error) {
      console.warn('Error updating favorites:', error);
      toast.error('Функция избранного временно недоступна. Выполните миграцию БД.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggleFavorite}
      disabled={isLoading}
      className="grid place-items-center rounded-full p-2 bg-white/90 dark:bg-neutral-900/80 backdrop-blur-md shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.08] transition-all duration-200 hover:bg-white dark:hover:bg-neutral-900 disabled:opacity-50"
    >
      <Heart
        size={size}
        fill={isFavorite ? 'currentColor' : 'none'}
        className={`transition-colors duration-200 ${
          isFavorite ? 'text-rose-500 dark:text-rose-400' : 'text-gray-600 dark:text-neutral-300'
        }`}
      />
    </motion.button>
  );
}