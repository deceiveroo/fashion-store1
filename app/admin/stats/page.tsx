'use client';

import { useState, useEffect } from 'react';
import { Calendar, Download, Star, TrendingUp, Clock, MessageSquare, Users } from 'lucide-react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import AdminLayout from '@/components/AdminLayout';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface OperatorStat {
  id: string;
  name: string;
  email: string;
  completedChats: number;
  avgRating: number;
  totalRatings: number;
  hourlyStats: { hour: string; count: number }[];
  recentRatings: { rating: number; timestamp: string; sessionId: string }[];
}

export default function StatsPage() {
  const [stats, setStats] = useState<OperatorStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today');
  const [selectedOperator, setSelectedOperator] = useState<string>('all');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/admin/stats?range=${dateRange}&operator=${selectedOperator}`);
        const data = await response.json();
        setStats(data.stats || []);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [dateRange, selectedOperator]);

  // Prepare chart data
  const hourlyChartData = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [
      {
        label: 'Количество чатов',
        data: stats.flatMap(stat => 
          Array.from({ length: 24 }, (_, i) => {
            const hourData = stat.hourlyStats.find(h => parseInt(h.hour.split(':')[0]) === i);
            return hourData ? hourData.count : 0;
          })
        ).reduce((acc, val, idx) => {
          acc[idx % 24] = (acc[idx % 24] || 0) + val;
          return acc;
        }, Array(24).fill(0)),
        backgroundColor: 'rgba(147, 51, 234, 0.5)',
        borderColor: 'rgba(147, 51, 234, 1)',
        borderWidth: 1,
      },
    ],
  };

  const ratingDistributionData = {
    labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    datasets: [
      {
        label: 'Количество оценок',
        data: Array.from({ length: 10 }, (_, i) => {
          const ratingValue = i + 1;
          return stats.reduce((sum, stat) => {
            return sum + stat.recentRatings.filter(r => r.rating === ratingValue).length;
          }, 0);
        }),
        backgroundColor: [
          '#ef4444', // 1 star - red
          '#f97316', // 2 stars - orange
          '#f59e0b', // 3 stars - amber
          '#eab308', // 4 stars - yellow
          '#84cc16', // 5 stars - lime
          '#22c55e', // 6 stars - green
          '#10b981', // 7 stars - emerald
          '#059669', // 8 stars - teal
          '#0d9488', // 9 stars - cyan
          '#0891b2', // 10 stars - sky
        ],
        borderWidth: 1,
      },
    ],
  };

  const topOperatorsData = {
    labels: stats.map(s => s.name || s.email),
    datasets: [
      {
        label: 'Средняя оценка',
        data: stats.map(s => s.avgRating),
        backgroundColor: 'rgba(72, 187, 120, 0.5)',
        borderColor: 'rgba(72, 187, 120, 1)',
        borderWidth: 1,
      },
    ],
  };

  const exportToCSV = () => {
    // In a real implementation, this would generate a CSV file
    alert('CSV export would be implemented here');
  };

  if (loading) {
    return (
      <AdminLayout currentPage="stats">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPage="stats">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Статистика операторов</h1>
            <p className="text-sm text-gray-500">Аналитика поддержки клиентов</p>
          </div>
          
          <div className="flex gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
            >
              <option value="today">Сегодня</option>
              <option value="week">Неделя</option>
              <option value="month">Месяц</option>
            </select>
            
            <select
              value={selectedOperator}
              onChange={(e) => setSelectedOperator(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
            >
              <option value="all">Все операторы</option>
              {stats.map(stat => (
                <option key={stat.id} value={stat.id}>{stat.name || stat.email}</option>
              ))}
            </select>
            
            <button 
              onClick={exportToCSV}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm"
            >
              <Download className="w-4 h-4" />
              Экспорт
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                <MessageSquare className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Всего чатов</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.reduce((sum, stat) => sum + stat.completedChats, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/50">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Средний рейтинг</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(stats.reduce((sum, stat) => sum + (stat.avgRating || 0), 0) / (stats.length || 1)).toFixed(1)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Активные операторы</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/50">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Всего оценок</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.reduce((sum, stat) => sum + stat.totalRatings, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Распределение оценок</h3>
            <Pie data={ratingDistributionData} />
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Средний рейтинг по операторам</h3>
            <Bar data={topOperatorsData} options={{ 
              scales: { 
                y: { 
                  beginAtZero: true,
                  max: 10
                } 
              } 
            }} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Активность по часам</h3>
            <Line data={hourlyChartData} />
          </div>
        </div>

        {/* Recent Ratings Table */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Последние оценки</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Оператор</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Оценка</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Время</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Сессия</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {stats.flatMap(stat => 
                  stat.recentRatings.map(rating => ({
                    ...rating,
                    operatorName: stat.name || stat.email
                  }))
                )
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, 10)
                .map((rating, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{rating.operatorName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {[...Array(10)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < rating.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300 dark:text-gray-600'
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-sm text-gray-900 dark:text-white">{rating.rating}/10</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(rating.timestamp).toLocaleString('ru-RU')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{rating.sessionId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}