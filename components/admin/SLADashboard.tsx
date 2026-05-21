'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Clock, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Star,
  Download,
  Calendar
} from 'lucide-react';

interface AnalyticsData {
  period: string;
  overview: {
    totalSessions: number;
    resolvedSessions: number;
    activeSessions: number;
    avgFirstResponseTime: string;
    avgResolutionTime: string;
    aiResolutionRate: string;
    operatorHandledCount: number;
  };
  satisfaction: {
    totalRatings: number;
    avgSatisfaction: string;
    distribution: {
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
    };
  };
  messagesPerDay: Array<{ date: string; count: number }>;
  sessionsByStatus: Array<{ status: string; count: number }>;
  hourlyActivity: Array<{ hour: number; count: number }>;
  topCategories: Array<{ category: string; count: number }>;
  operatorPerformance: Array<{
    name: string;
    email: string;
    handledChats: number;
    avgResponseTime: string;
    avgResolutionTime: string;
    avgSatisfaction: string;
  }>;
}

interface SLADashboardProps {
  days?: number;
}

export default function SLADashboard({ days = 30 }: SLADashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState(days);

  useEffect(() => {
    loadAnalytics();
  }, [selectedDays]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/support-chats/analytics?days=${selectedDays}`);
      if (res.ok) {
        const analytics = await res.json();
        setData(analytics);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - selectedDays);
    const endDate = new Date();
    
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    
    window.open(`/api/admin/support-chats/export?startDate=${startStr}&endDate=${endStr}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-white/40">
        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-40" />
        <p>Не удалось загрузить аналитику</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">SLA Dashboard</h2>
          <p className="text-sm text-white/40 mt-1">Период: {data.period}</p>
        </div>
        
        <div className="flex gap-3">
          <select
            value={selectedDays}
            onChange={(e) => setSelectedDays(Number(e.target.value))}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500"
          >
            <option value={7}>7 дней</option>
            <option value={30}>30 дней</option>
            <option value={90}>90 дней</option>
          </select>
          
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-white text-sm transition-colors"
          >
            <Download className="h-4 w-4" />
            Экспорт CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={MessageSquare}
          label="Всего сессий"
          value={data.overview.totalSessions.toString()}
          color="blue"
        />
        <KPICard
          icon={Clock}
          label="Среднее время ответа"
          value={data.overview.avgFirstResponseTime}
          color="green"
        />
        <KPICard
          icon={TrendingUp}
          label="AI Resolution Rate"
          value={data.overview.aiResolutionRate}
          color="purple"
        />
        <KPICard
          icon={Star}
          label="Удовлетворенность"
          value={`${data.satisfaction.avgSatisfaction}/5`}
          color="yellow"
          subtitle={`${data.satisfaction.totalRatings} оценок`}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Messages per day chart */}
        <ChartCard title="Сообщения по дням">
          <div className="space-y-2">
            {data.messagesPerDay.slice(0, 7).map((day) => (
              <div key={day.date} className="flex items-center gap-3">
                <div className="text-xs text-white/40 w-20">
                  {new Date(day.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                </div>
                <div className="flex-1 h-6 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (day.count / Math.max(...data.messagesPerDay.map(d => d.count))) * 100)}%`,
                    }}
                  />
                </div>
                <div className="text-sm text-white font-medium w-12 text-right">
                  {day.count}
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Hourly activity heatmap */}
        <ChartCard title="Активность по часам">
          <div className="grid grid-cols-12 gap-1">
            {Array.from({ length: 24 }, (_, i) => {
              const hourData = data.hourlyActivity.find(h => h.hour === i);
              const count = hourData?.count || 0;
              const maxCount = Math.max(...data.hourlyActivity.map(h => h.count));
              const intensity = maxCount > 0 ? count / maxCount : 0;
              
              return (
                <div
                  key={i}
                  className="aspect-square rounded-md flex items-center justify-center text-xs cursor-pointer hover:ring-2 hover:ring-violet-400 transition-all"
                  style={{
                    backgroundColor: `rgba(139, 92, 246, ${intensity})`,
                  }}
                  title={`${i}:00 - ${count} сообщений`}
                >
                  {i}
                </div>
              );
            })}
          </div>
        </ChartCard>

        {/* Top categories */}
        <ChartCard title="Топ категорий обращений">
          <div className="space-y-3">
            {data.topCategories.map((cat, idx) => (
              <div key={cat.category} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-xs font-bold text-violet-400">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="text-sm text-white">{cat.category}</div>
                  <div className="text-xs text-white/40">{cat.count} обращений</div>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Satisfaction distribution */}
        <ChartCard title="Распределение оценок">
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = data.satisfaction.distribution[rating as keyof typeof data.satisfaction.distribution];
              const total = data.satisfaction.totalRatings;
              const percentage = total > 0 ? (count / total) * 100 : 0;
              
              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-sm text-white">{rating}</span>
                    <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                  </div>
                  <div className="flex-1 h-4 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="text-sm text-white font-medium w-12 text-right">
                    {count}
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>
      </div>

      {/* Operator Performance Table */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-violet-400" />
            Производительность операторов
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-6 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Оператор</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Чатов</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Время ответа</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Время решения</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Оценка</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.operatorPerformance.map((op) => (
                <tr key={op.email} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
                        {op.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-white font-medium">{op.name}</div>
                        <div className="text-xs text-white/40">{op.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white">{op.handledChats}</td>
                  <td className="px-6 py-4 text-white">{op.avgResponseTime}</td>
                  <td className="px-6 py-4 text-white">{op.avgResolutionTime}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-white font-medium">{op.avgSatisfaction}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Helper Components

function KPICard({ 
  icon: Icon, 
  label, 
  value, 
  color, 
  subtitle 
}: { 
  icon: any; 
  label: string; 
  value: string; 
  color: 'blue' | 'green' | 'purple' | 'yellow';
  subtitle?: string;
}) {
  const colors = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    purple: 'from-purple-500 to-pink-500',
    yellow: 'from-yellow-500 to-orange-500',
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 hover:bg-white/[0.04] transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg bg-gradient-to-br ${colors[color]} bg-opacity-10`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
      <div className="text-sm text-white/40 mb-1">{label}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {subtitle && <div className="text-xs text-white/30 mt-1">{subtitle}</div>}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
      <h3 className="text-base font-semibold text-white mb-4">{title}</h3>
      {children}
    </div>
  );
}
