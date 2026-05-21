'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Filter, SortDesc, CheckCircle } from 'lucide-react';
import ReviewCard from './ReviewCard';
import StarRating, { RatingDistribution } from './StarRating';

interface ReviewListProps {
  productId: string;
}

export default function ReviewList({ productId }: ReviewListProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [statistics, setStatistics] = useState({ averageRating: 0, totalCount: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } });
  const [sortBy, setSortBy] = useState('newest');
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [userVotes, setUserVotes] = useState<Record<string, boolean>>({});

  const loadReviews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        productId,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
      });

      if (ratingFilter) {
        params.append('rating', ratingFilter.toString());
      }

      if (verifiedOnly) {
        params.append('verified', 'true');
      }

      const response = await fetch(`/api/reviews?${params}`);
      const data = await response.json();

      if (response.ok) {
        setReviews(data.reviews);
        setPagination(data.pagination);
        setStatistics(data.statistics);
        
        // Загружаем голоса пользователя для каждого отзыва
        const votes: Record<string, boolean> = {};
        await Promise.all(
          data.reviews.map(async (review: any) => {
            try {
              const voteResponse = await fetch(`/api/reviews/${review.id}/helpful`);
              const voteData = await voteResponse.json();
              votes[review.id] = voteData.voted;
            } catch {
              votes[review.id] = false;
            }
          })
        );
        setUserVotes(votes);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [productId, pagination.page, sortBy, ratingFilter, verifiedOnly]);

  const handleHelpfulClick = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setUserVotes((prev) => ({
          ...prev,
          [reviewId]: data.action === 'added',
        }));

        // Обновляем счетчик в списке
        setReviews((prev) =>
          prev.map((review) =>
            review.id === reviewId
              ? { ...review, helpfulCount: data.helpfulCount }
              : review
          )
        );
      }
    } catch (error) {
      console.error('Error toggling helpful vote:', error);
    }
  };

  const resetFilters = () => {
    setRatingFilter(null);
    setVerifiedOnly(false);
    setSortBy('newest');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Загрузка отзывов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Statistics */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Average Rating */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Средний рейтинг</h4>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-bold text-gray-900 dark:text-white">
              {statistics.averageRating.toFixed(1)}
            </span>
            <span className="text-gray-500 dark:text-gray-400 mb-1">/ 5</span>
          </div>
          <StarRating rating={statistics.averageRating} size="md" className="mt-3" showValue={false} />
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            На основе {statistics.totalCount} {statistics.totalCount === 1 ? 'отзыва' : 'отзывов'}
          </p>
        </div>

        {/* Distribution */}
        <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">Распределение оценок</h4>
          <RatingDistribution
            distribution={statistics.distribution}
            totalReviews={statistics.totalCount}
            onFilterByRating={(rating) => {
              setRatingFilter(rating);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            selectedRating={ratingFilter}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Фильтры:</span>
        </div>

        <button
          onClick={() => setVerifiedOnly(!verifiedOnly)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            verifiedOnly
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <CheckCircle className="w-4 h-4 inline mr-1" />
          Подтвержденные покупки
        </button>

        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-violet-500"
        >
          <option value="newest">Сначала новые</option>
          <option value="oldest">Сначала старые</option>
          <option value="highest">Высокий рейтинг</option>
          <option value="lowest">Низкий рейтинг</option>
          <option value="helpful">Полезные</option>
        </select>

        {(ratingFilter || verifiedOnly || sortBy !== 'newest') && (
          <button
            onClick={resetFilters}
            className="px-3 py-1.5 text-sm text-violet-600 dark:text-violet-400 hover:underline"
          >
            Сбросить фильтры
          </button>
        )}
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <p className="text-gray-600 dark:text-gray-400">
            {ratingFilter || verifiedOnly
              ? 'Нет отзывов по выбранным фильтрам'
              : 'Пока нет отзывов. Будьте первым!'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onHelpfulClick={handleHelpfulClick}
              hasVoted={userVotes[review.id]}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
            disabled={pagination.page === 1}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Назад
          </button>

          <span className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
            Страница {pagination.page} из {pagination.totalPages}
          </span>

          <button
            onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }))}
            disabled={pagination.page === pagination.totalPages}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Вперед
          </button>
        </div>
      )}
    </div>
  );
}
