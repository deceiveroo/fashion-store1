'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

interface FavoriteButtonProps {
  productId: string;
  size?: number;
}

export default function FavoriteButton({ productId, size = 20 }: FavoriteButtonProps) {
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
          toast.success('Добавлено в избранное');
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
      className="p-2 text-gray-600 hover:text-red-500 transition-colors disabled:opacity-50"
    >
      <Heart 
        size={size} 
        fill={isFavorite ? 'currentColor' : 'none'}
        className={isFavorite ? 'text-red-500' : ''}
      />
    </motion.button>
  );
}