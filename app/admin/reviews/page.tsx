'use client';

import { useState, useEffect } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminStatCard from '@/components/admin/AdminStatCard';
import { Star, ThumbsUp, MessageSquare, CheckCircle, XCircle, Trash2, Eye, ExternalLink, Package, User, AlertTriangle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

type Review = {
  id: string;
  productId: string;
  productName?: string;
  orderId?: string | null; // Добавляем ID заказа
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
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    loadReviews();
  }, [filter, page, sortBy, searchQuery]);

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
      setStatistics(data.statistics || data.stats || null);
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
    // Показываем красивое подтверждение
    setDeleteConfirmId(reviewId);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    
    try {
      const res = await fetch(`/api/admin/reviews/${deleteConfirmId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to delete');

      toast.success('Отзыв удален');
      loadReviews();
      setSelectedReview(null);
      setDeleteConfirmId(null);
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
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-[var(--admin-text-faint)]'
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
        <AdminPageHeader
          title="Управление отзывами"
          description="Модерация и управление отзывами клиентов"
        />

        {/* Statistics */}
        {statistics && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminStatCard
              title="Средний рейтинг"
              value={statistics.averageRating.toFixed(1)}
              sub="из 5 звёзд"
              icon={Star}
              accent="amber"
            />
            <AdminStatCard
              title="Всего отзывов"
              value={statistics.totalCount}
              icon={MessageSquare}
              accent="blue"
            />
            <AdminStatCard
              title="Ожидают модерации"
              value={reviews.filter((r) => !r.isApproved).length}
              icon={Clock}
              accent="amber"
            />
            <AdminStatCard
              title="Одобрено"
              value={reviews.filter((r) => r.isApproved).length}
              icon={CheckCircle}
              accent="emerald"
            />
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
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full px-4 py-2 rounded-lg bg-[var(--admin-bg-muted)] border border-[var(--admin-border)] text-[var(--admin-text)] text-sm outline-none focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/40 transition-colors"
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 rounded-lg bg-[var(--admin-bg-muted)] border border-[var(--admin-border)] text-[var(--admin-text)] text-sm outline-none focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/40 transition-colors"
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
                ? 'bg-[var(--admin-accent)] text-white'
                : 'border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-muted)] hover:bg-[var(--admin-card-hover)]'
            }`}
          >
            Все
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-amber-600 text-white'
                : 'border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-muted)] hover:bg-[var(--admin-card-hover)]'
            }`}
          >
            Ожидают модерации
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filter === 'approved'
                ? 'bg-emerald-600 text-white'
                : 'border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-muted)] hover:bg-[var(--admin-card-hover)]'
            }`}
          >
            Одобрены
          </button>
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--admin-accent)] border-t-transparent" />
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--admin-border)] p-12 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-[var(--admin-text-faint)]" />
            <p className="mt-4 text-sm text-[var(--admin-text-muted)]">Нет отзывов для отображения</p>
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
                  className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        {renderStars(review.rating)}
                        {review.isVerifiedPurchase ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            <CheckCircle className="h-3 w-3" />
                            Подтвержденная покупка
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                            <AlertTriangle className="h-3 w-3" />
                            Нет подтверждения покупки
                          </span>
                        )}
                        {!review.isApproved && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                            Ожидает модерации
                          </span>
                        )}
                      </div>
                      {review.title && (
                        <h3 className="mt-2 font-semibold text-[var(--admin-text)]">{review.title}</h3>
                      )}
                      <p className="mt-1 text-sm text-[var(--admin-text-muted)]">{review.comment}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                        {/* User */}
                        <span className="flex items-center gap-1.5 text-[var(--admin-text-muted)]">
                          <User className="h-3 w-3" />
                          {review.userName || 'Аноним'}
                        </span>
                        <span className="text-[var(--admin-text-faint)]">•</span>

                        {/* Date */}
                        <span className="text-[var(--admin-text-muted)]">
                          {new Date(review.createdAt).toLocaleDateString('ru-RU')}
                        </span>

                        {/* Order ID - показываем только если есть верификация */}
                        {review.isVerifiedPurchase && review.orderId && (
                          <>
                            <span className="text-[var(--admin-text-faint)]">•</span>
                            <a
                              href={`/admin/orders?search=${review.orderId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                            >
                              <Package className="h-3 w-3" />
                              Заказ: {review.orderId.slice(0, 8)}...
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </>
                        )}

                        {/* Product Link */}
                        {review.productName && review.productId && (
                          <>
                            <span className="text-[var(--admin-text-faint)]">•</span>
                            <a
                              href={`/products/${review.productId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-[var(--admin-accent)] hover:opacity-80 font-medium transition-opacity"
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
                            <span className="text-[var(--admin-text-faint)]">•</span>
                            <span className="flex items-center gap-1 text-[var(--admin-text-muted)]">
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
                          className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-1.5 text-xs font-medium text-[var(--admin-text)] hover:bg-[var(--admin-card-hover)] transition-colors flex items-center gap-1.5"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Товар
                        </a>
                      )}

                      {!review.isApproved && (
                        <>
                          <button
                            onClick={() => handleApprove(review.id)}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors"
                          >
                            Одобрить
                          </button>
                          <button
                            onClick={() => handleReject(review.id)}
                            className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700 transition-colors"
                          >
                            Отклонить
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setSelectedReview(review)}
                        className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-1.5 text-xs font-medium text-[var(--admin-text)] hover:bg-[var(--admin-card-hover)] transition-colors"
                      >
                        Ответить
                      </button>
                      <button
                        onClick={() => handleDelete(review.id)}
                        className="rounded-lg bg-rose-500/15 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-500/25 dark:text-rose-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {review.adminResponse && (
                    <div className="mt-4 rounded-lg border border-[var(--admin-border-subtle)] bg-[var(--admin-bg-muted)] p-4">
                      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[var(--admin-accent)]">
                        <MessageSquare className="h-3 w-3" />
                        Ответ администрации
                        {review.adminRespondedAt && (
                          <span className="text-[var(--admin-text-faint)]">
                            • {new Date(review.adminRespondedAt).toLocaleDateString('ru-RU')}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[var(--admin-text)]">{review.adminResponse}</p>
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
              className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] px-4 py-2 text-sm font-medium text-[var(--admin-text)] hover:bg-[var(--admin-card-hover)] transition-colors disabled:opacity-50"
            >
              Назад
            </button>
            <span className="text-sm text-[var(--admin-text-muted)]">
              Страница {page} из {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] px-4 py-2 text-sm font-medium text-[var(--admin-text)] hover:bg-[var(--admin-card-hover)] transition-colors disabled:opacity-50"
            >
              Вперед
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmId(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]"
            />
            
            {/* Confirmation Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[90] px-4"
            >
              <div className="bg-[var(--admin-bg-elevated)] rounded-2xl shadow-2xl border border-[var(--admin-border)] overflow-hidden">
                {/* Icon Header */}
                <div className="px-6 pt-8 pb-4 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-rose-500/15 to-amber-500/15 flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-rose-600 dark:text-rose-400" />
                  </div>
                  <h3 className="text-xl font-bold text-[var(--admin-text)] mb-2">
                    Удалить этот отзыв навсегда?
                  </h3>
                  <p className="text-sm text-[var(--admin-text-muted)]">
                    Это действие нельзя отменить. Отзыв будет полностью удален из базы данных.
                  </p>
                </div>

                {/* Actions */}
                <div className="px-6 py-4 bg-[var(--admin-bg-muted)] border-t border-[var(--admin-border)] flex gap-3">
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text)] font-medium hover:bg-[var(--admin-card-hover)] transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-medium hover:from-rose-700 hover:to-amber-700 transition-all shadow-lg shadow-rose-500/30 flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Да, удалить
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </AdminShell>
  );
}
