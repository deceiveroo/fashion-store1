'use client';

import { useState, useEffect } from 'react';
import { Star, TrendingUp, Users, MessageSquare, Calendar } from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';

interface Rating {
  id: string;
  sessionId: string;
  rating: number;
  feedback: string | null;
  ratedBy: string | null;
  createdAt: string;
  sessionStatus: string | null;
  operatorDisplayName: string;
  operatorEmail: string | null;
}

interface OperatorStat {
  operatorId: string | null;
  operatorName: string;
  operatorEmail: string | null;
  totalChats: number;
  avgRating: string;
}

export default function RatingsHistoryPage() {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [operatorStats, setOperatorStats] = useState<OperatorStat[]>([]);
  const [summary, setSummary] = useState({ averageRating: 0, totalRatings: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState(30);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  useEffect(() => {
    loadRatings();
  }, [selectedDays, pagination.page]);

  const loadRatings = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/support-chats/ratings/history?days=${selectedDays}&page=${pagination.page}&limit=${pagination.limit}`
      );
      
      if (res.ok) {
        const data = await res.json();
        setRatings(data.ratings || []);
        setOperatorStats(data.operatorStats || []);
        setSummary(data.summary || { averageRating: 0, totalRatings: 0 });
        setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
      }
    } catch (error) {
      console.error('Failed to load ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-amber-400 text-amber-400' : 'text-[var(--admin-text-faint)]'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--admin-text)] flex items-center gap-2">
              <Star className="h-7 w-7 text-amber-500" />
              История оценок качества
            </h1>
            <p className="text-sm text-[var(--admin-text-muted)] mt-1">
              Анализ удовлетворенности клиентов работой операторов
            </p>
          </div>

          <select
            value={selectedDays}
            onChange={(e) => {
              setSelectedDays(Number(e.target.value));
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-2 bg-[var(--admin-bg-muted)] border border-[var(--admin-border)] text-[var(--admin-text)] rounded-xl text-sm outline-none focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/40"
          >
            <option value={7}>7 дней</option>
            <option value={30}>30 дней</option>
            <option value={90}>90 дней</option>
          </select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-[var(--admin-text-muted)] uppercase tracking-wider">
                  Средняя оценка
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-[var(--admin-text)]">
                    {summary.averageRating.toFixed(1)}
                  </p>
                  <span className="text-sm text-[var(--admin-text-muted)]">/ 5</span>
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg">
                <Star className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-[var(--admin-text-muted)] uppercase tracking-wider">
                  Всего оценок
                </p>
                <p className="mt-2 text-3xl font-bold text-[var(--admin-text)]">
                  {summary.totalRatings}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg">
                <MessageSquare className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-[var(--admin-text-muted)] uppercase tracking-wider">
                  Активных операторов
                </p>
                <p className="mt-2 text-3xl font-bold text-[var(--admin-text)]">
                  {operatorStats.length}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 text-white shadow-lg">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Operator Performance */}
        {operatorStats.length > 0 && (
          <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--admin-border)]">
              <h2 className="text-lg font-semibold text-[var(--admin-text)] flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[var(--admin-accent)]" />
                Производительность операторов
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--admin-border)] bg-[var(--admin-bg-muted)]">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--admin-text-muted)] uppercase tracking-wider">
                      Оператор
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--admin-text-muted)] uppercase tracking-wider">
                      Чатов
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--admin-text-muted)] uppercase tracking-wider">
                      Средняя оценка
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--admin-border)]">
                  {operatorStats.map((stat) => (
                    <tr key={stat.operatorId || stat.operatorEmail} className="hover:bg-[var(--admin-card-hover)] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-bold">
                            {stat.operatorName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-[var(--admin-text)]">
                              {stat.operatorName}
                            </div>
                            <div className="text-xs text-[var(--admin-text-muted)]">
                              {stat.operatorEmail}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[var(--admin-text)]">
                        {stat.totalChats}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[var(--admin-text)]">
                            {stat.avgRating}
                          </span>
                          {renderStars(parseFloat(stat.avgRating))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Ratings */}
        <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--admin-border)]">
            <h2 className="text-lg font-semibold text-[var(--admin-text)] flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[var(--admin-accent)]" />
              Последние оценки
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center p-12">
              <div className="h-12 w-12 animate-spin rounded-full border-3 border-[var(--admin-accent)]/30 border-t-[var(--admin-accent)]" />
            </div>
          ) : ratings.length === 0 ? (
            <div className="p-12 text-center text-[var(--admin-text-muted)]">
              <Star className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Нет оценок за выбранный период</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--admin-border)]">
              {ratings.map((rating) => (
                <div key={rating.id} className="px-6 py-4 hover:bg-[var(--admin-card-hover)] transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {renderStars(rating.rating)}
                        <span className="text-sm font-medium text-[var(--admin-text)]">
                          {rating.rating}/5
                        </span>
                      </div>

                      {rating.feedback && (
                        <p className="text-sm text-[var(--admin-text-muted)] mb-2">
                          {rating.feedback}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-[var(--admin-text-muted)]">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {rating.operatorDisplayName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(rating.createdAt).toLocaleDateString('ru-RU', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-[var(--admin-border)] flex items-center justify-between">
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="px-4 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--admin-card-hover)] transition-colors text-sm"
              >
                Назад
              </button>

              <span className="text-sm text-[var(--admin-text-muted)]">
                Страница {pagination.page} из {pagination.totalPages}
              </span>

              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }))}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--admin-card-hover)] transition-colors text-sm"
              >
                Вперед
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
