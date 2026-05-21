'use client';

import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  showValue?: boolean;
  className?: string;
}

export default function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onRatingChange,
  showValue = false,
  className = '',
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-8 h-8',
  };

  const handleClick = (clickedRating: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(clickedRating);
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex gap-0.5">
        {[...Array(maxRating)].map((_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= rating;
          const isHalfFilled = !isFilled && starValue - 0.5 <= rating;

          return (
            <motion.button
              key={index}
              type="button"
              disabled={!interactive}
              onClick={() => handleClick(starValue)}
              whileHover={interactive ? { scale: 1.2 } : undefined}
              whileTap={interactive ? { scale: 0.9 } : undefined}
              className={`${interactive ? 'cursor-pointer' : 'cursor-default'} transition-colors`}
              aria-label={`${starValue} из ${maxRating} звезд`}
            >
              <Star
                className={`${sizeClasses[size]} ${
                  isFilled
                    ? 'text-yellow-400 fill-yellow-400'
                    : isHalfFilled
                    ? 'text-yellow-400 fill-yellow-400/50'
                    : 'text-gray-300 dark:text-gray-600'
                }`}
              />
            </motion.button>
          );
        })}
      </div>
      
      {showValue && (
        <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {rating.toFixed(1)} / {maxRating}
        </span>
      )}
    </div>
  );
}

// Компонент для отображения распределения рейтингов
interface RatingDistributionProps {
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  totalReviews: number;
  onFilterByRating?: (rating: number | null) => void;
  selectedRating?: number | null;
}

export function RatingDistribution({
  distribution,
  totalReviews,
  onFilterByRating,
  selectedRating,
}: RatingDistributionProps) {
  const ratings = [5, 4, 3, 2, 1];

  return (
    <div className="space-y-2">
      {ratings.map((rating) => {
        const count = distribution[rating as keyof typeof distribution];
        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
        const isSelected = selectedRating === rating;

        return (
          <button
            key={rating}
            onClick={() => onFilterByRating?.(isSelected ? null : rating)}
            className={`w-full flex items-center gap-3 group ${
              onFilterByRating ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors' : ''
            } ${isSelected ? 'bg-violet-50 dark:bg-violet-900/20' : ''}`}
          >
            <div className="flex items-center gap-1 w-16">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{rating}</span>
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            </div>
            
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.5 }}
                className={`h-full rounded-full ${
                  isSelected
                    ? 'bg-gradient-to-r from-violet-500 to-purple-500'
                    : 'bg-gradient-to-r from-yellow-400 to-orange-400'
                }`}
              />
            </div>
            
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 w-12 text-right">
              {count}
            </div>
          </button>
        );
      })}
    </div>
  );
}
