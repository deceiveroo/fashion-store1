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
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Star className="h-7 w-7 text-yellow-500" />
              История оценок качества
            </h1>
            <p className="text-sm text-gray-500 dark:text-white/40 mt-1">
              Анализ удовлетворенности клиентов работой операторов
            </p>
          </div>
          
          <select
            value={selectedDays}
            onChange={(e) => {
              setSelectedDays(Number(e.target.value));
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value={7}>7 дней</option>
            <option value={30}>30 дней</option>
            <option value={90}>90 дней</option>
          </select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-500/10 dark:to-orange-500/10 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-white/50 uppercase tracking-wider">
                  Средняя оценка
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {summary.averageRating.toFixed(1)}
                  </p>
                  <span className="text-sm text-gray-500 dark:text-white/40">/ 5</span>
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 text-white shadow-lg">
                <Star className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-500/10 dark:to-cyan-500/10 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-white/50 uppercase tracking-wider">
                  Всего оценок
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {summary.totalRatings}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg">
                <MessageSquare className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-500/10 dark:to-pink-500/10 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-white/50 uppercase tracking-wider">
                  Активных операторов
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {operatorStats.length}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Operator Performance */}
        {operatorStats.length > 0 && (
          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-violet-500" />
                Производительность операторов
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/5">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-white/50 uppercase tracking-wider">
                      Оператор
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-white/50 uppercase tracking-wider">
                      Чатов
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-white/50 uppercase tracking-wider">
                      Средняя оценка
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                  {operatorStats.map((stat) => (
                    <tr key={stat.operatorId || stat.operatorEmail} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-bold">
                            {stat.operatorName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {stat.operatorName}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-white/40">
                              {stat.operatorEmail}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-900 dark:text-white">
                        {stat.totalChats}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 dark:text-white">
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
        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-violet-500" />
              Последние оценки
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center p-12">
              <div className="h-12 w-12 animate-spin rounded-full border-3 border-violet-500/30 border-t-violet-500" />
            </div>
          ) : ratings.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-white/40">
              <Star className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Нет оценок за выбранный период</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-white/5">
              {ratings.map((rating) => (
                <div key={rating.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {renderStars(rating.rating)}
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {rating.rating}/5
                        </span>
                      </div>
                      
                      {rating.feedback && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                          {rating.feedback}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-white/40">
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
            <div className="px-6 py-4 border-t border-gray-200 dark:border-white/10 flex items-center justify-between">
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
              >
                Назад
              </button>

              <span className="text-sm text-gray-700 dark:text-gray-300">
                Страница {pagination.page} из {pagination.totalPages}
              </span>

              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }))}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
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
