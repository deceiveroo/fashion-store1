'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ThumbsUp, MessageSquare, BadgeCheck, Calendar } from 'lucide-react';
import StarRating from './StarRating';

interface ReviewCardProps {
  review: {
    id: string;
    userId: string;
    rating: number;
    title?: string | null;
    comment: string;
    images?: string[] | null;
    isVerifiedPurchase: boolean;
    helpfulCount: number;
    createdAt: string;
    adminResponse?: string | null;
    adminRespondedAt?: string | null;
    userName?: string | null;
    userAvatar?: string | null;
    userImage?: string | null;
  };
  onHelpfulClick?: (reviewId: string) => Promise<void>;
  hasVoted?: boolean;
}

export default function ReviewCard({
  review,
  onHelpfulClick,
  hasVoted = false,
}: ReviewCardProps) {
  const [isHelpfulLoading, setIsHelpfulLoading] = useState(false);

  // Функция для получения аватара пользователя
  const getUserAvatar = () => {
    // Сначала проверяем аватар из профиля
    if (review.userAvatar) return review.userAvatar;
    if (review.userImage) return review.userImage;
    
    // Если нет аватара, используем UI Avatars API с именем
    if (review.userName) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(review.userName)}&background=random&color=fff&size=128`;
    }
    
    // Fallback: первая буква имени или 'U'
    return null;
  };

  const userAvatarUrl = getUserAvatar();

  const handleHelpfulClick = async () => {
    if (!onHelpfulClick || isHelpfulLoading) return;
    
    setIsHelpfulLoading(true);
    try {
      await onHelpfulClick(review.id);
    } catch (error) {
      console.error('Error marking review as helpful:', error);
    } finally {
      setIsHelpfulLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          {userAvatarUrl ? (
            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-200 dark:border-gray-700">
              <Image
                src={userAvatarUrl}
                alt={review.userName || 'User'}
                width={48}
                height={48}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Если изображение не загрузилось, показываем fallback
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = `
                    <div class="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                      ${review.userName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  `;
                }}
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              {review.userName?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {review.userName || 'Анонимный пользователь'}
              </h4>
              
              {review.isVerifiedPurchase && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium">
                  <BadgeCheck className="w-3 h-3" />
                  Подтвержденная покупка
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2 mt-1">
              <StarRating rating={review.rating} size="sm" />
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(review.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        {review.title && (
          <h5 className="font-semibold text-gray-900 dark:text-white text-lg">
            {review.title}
          </h5>
        )}
        
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
          {review.comment}
        </p>

        {/* Images */}
        {review.images && review.images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
            {review.images.map((image, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 cursor-pointer"
              >
                <Image
                  src={image}
                  alt={`Фото отзыва ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer - Helpful button */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleHelpfulClick}
          disabled={isHelpfulLoading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            hasVoted
              ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <ThumbsUp className={`w-4 h-4 ${isHelpfulLoading ? 'animate-pulse' : ''}`} />
          <span className="text-sm font-medium">
            {hasVoted ? 'Полезно' : 'Отметить как полезное'}
          </span>
          {review.helpfulCount > 0 && (
            <span className="text-xs font-bold">({review.helpfulCount})</span>
          )}
        </button>
      </div>

      {/* Admin Response */}
      {review.adminResponse && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 p-4 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-lg border border-violet-200 dark:border-violet-800"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-violet-900 dark:text-violet-300">
                  Ответ магазина
                </span>
                {review.adminRespondedAt && (
                  <span className="text-xs text-violet-600 dark:text-violet-400">
                    {formatDate(review.adminRespondedAt)}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {review.adminResponse}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
