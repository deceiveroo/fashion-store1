'use client';

import { useState, useEffect } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { Star, ThumbsUp, MessageSquare, CheckCircle, XCircle, Trash2, Eye, ExternalLink, Package, User } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

type Review = {
  id: string;
  productId: string;
  productName?: string;
  userId: string;
  userName?: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  helpfulCount: number;
  createdAt: string;
  adminResponse?: string;
  adminRespondedAt?: string;
};

type Statistics = {
  averageRating: number;
  totalCount: number;
  distribution: { [key: number]: number };
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful'>('newest');

  useEffect(() => {
    loadReviews();
  }, [filter, page, sortBy]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sortBy: sortBy,
      });

      if (filter === 'pending') {
        params.append('status', 'pending');
      } else if (filter === 'approved') {
        params.append('status', 'approved');
      }

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const res = await fetch(`/api/admin/reviews?${params}`, {
        credentials: 'include',
        cache: 'no-store',
      });

      if (!res.ok) throw new Error('Failed to load reviews');

      const data = await res.json();
      setReviews(data.reviews || []);
      setStatistics(data.statistics || null);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast.error('Не удалось загрузить отзывы');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId: string) => {
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}/approve`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to approve');

      toast.success('Отзыв одобрен');
      loadReviews();
    } catch (error) {
      toast.error('Ошибка при одобрении отзыва');
    }
  };

  const handleReject = async (reviewId: string) => {
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}/reject`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to reject');

      toast.success('Отзыв отклонен');
      loadReviews();
    } catch (error) {
      toast.error('Ошибка при отклонении отзыва');
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Удалить этот отзыв навсегда?')) return;

    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to delete');

      toast.success('Отзыв удален');
      loadReviews();
      setSelectedReview(null);
    } catch (error) {
      toast.error('Ошибка при удалении отзыва');
    }
  };

  const handleSubmitResponse = async (reviewId: string) => {
    if (!adminResponse.trim()) {
      toast.error('Введите ответ');
      return;
    }

    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}/respond`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: adminResponse }),
      });

      if (!res.ok) throw new Error('Failed to respond');

      toast.success('Ответ отправлен');
      setAdminResponse('');
      loadReviews();
    } catch (error) {
      toast.error('Ошибка при отправке ответа');
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const filteredReviews = reviews.filter((review) => {
    if (filter === 'pending') return !review.isApproved;
    if (filter === 'approved') return review.isApproved;
    return true;
  });

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Управление отзывами</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Модерация и управление отзывами клиентов
          </p>
        </div>

        {/* Statistics */}
        {statistics && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Средний рейтинг</div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {statistics.averageRating.toFixed(1)}
                </span>
                {renderStars(Math.round(statistics.averageRating))}
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Всего отзывов</div>
              <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                {statistics.totalCount}
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Ожидают модерации</div>
              <div className="mt-2 text-2xl font-bold text-orange-600">
                {reviews.filter((r) => !r.isApproved).length}
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Одобрено</div>
              <div className="mt-2 text-2xl font-bold text-green-600">
                {reviews.filter((r) => r.isApproved).length}
              </div>
            </div>
          </div>
        )}

        {/* Search and Sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Поиск по отзывам..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="newest">Сначала новые</option>
            <option value="oldest">Сначала старые</option>
            <option value="highest">Высокий рейтинг</option>
            <option value="lowest">Низкий рейтинг</option>
            <option value="helpful">Полезные</option>
          </select>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-violet-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Все
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Ожидают модерации
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filter === 'approved'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Одобрены
          </button>
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-sm text-gray-500">Нет отзывов для отображения</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredReviews.map((review) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        {renderStars(review.rating)}
                        {review.isVerifiedPurchase && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                            <CheckCircle className="h-3 w-3" />
                            Подтвержденная покупка
                          </span>
                        )}
                        {!review.isApproved && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                            Ожидает модерации
                          </span>
                        )}
                      </div>
                      {review.title && (
                        <h3 className="mt-2 font-semibold text-gray-900 dark:text-white">{review.title}</h3>
                      )}
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{review.comment}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                        {/* User */}
                        <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                          <User className="h-3 w-3" />
                          {review.userName || 'Аноним'}
                        </span>
                        <span className="text-gray-300 dark:text-gray-600">•</span>
                        
                        {/* Date */}
                        <span className="text-gray-500 dark:text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString('ru-RU')}
                        </span>
                        
                        {/* Product Link */}
                        {review.productName && review.productId && (
                          <>
                            <span className="text-gray-300 dark:text-gray-600">•</span>
                            <a
                              href={`/products/${review.productId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 font-medium transition-colors"
                            >
                              <Package className="h-3 w-3" />
                              {review.productName}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </>
                        )}
                        
                        {/* Helpful Count */}
                        {review.helpfulCount > 0 && (
                          <>
                            <span className="text-gray-300 dark:text-gray-600">•</span>
                            <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                              <ThumbsUp className="h-3 w-3" />
                              {review.helpfulCount}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {/* View Product Button */}
                      {review.productId && (
                        <a
                          href={`/products/${review.productId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg bg-violet-100 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-200 dark:bg-violet-900 dark:text-violet-300 dark:hover:bg-violet-800 transition-colors flex items-center gap-1.5"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Товар
                        </a>
                      )}
                      
                      {!review.isApproved && (
                        <>
                          <button
                            onClick={() => handleApprove(review.id)}
                            className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                          >
                            Одобрить
                          </button>
                          <button
                            onClick={() => handleReject(review.id)}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                          >
                            Отклонить
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setSelectedReview(review)}
                        className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                      >
                        Ответить
                      </button>
                      <button
                        onClick={() => handleDelete(review.id)}
                        className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {review.adminResponse && (
                    <div className="mt-4 rounded-lg bg-violet-50 p-4 dark:bg-violet-900/20">
                      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-violet-700 dark:text-violet-300">
                        <MessageSquare className="h-3 w-3" />
                        Ответ администрации
                        {review.adminRespondedAt && (
                          <span className="text-violet-500">
                            • {new Date(review.adminRespondedAt).toLocaleDateString('ru-RU')}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-violet-900 dark:text-violet-200">{review.adminResponse}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              Назад
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Страница {page} из {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              Вперед
            </button>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
