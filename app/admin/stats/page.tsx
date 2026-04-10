'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, TrendingUp, Users, Star, RefreshCw, Download } from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';
import { toast } from 'sonner';

interface OperatorStat {
  id: string; name: string; email: string;
  completedChats: number; avgRating: number; totalRatings: number;
  hourlyStats: { hour: string; count: number }[];
  recentRatings: { rating: number; timestamp: string; sessionId: string }[];
}

export default function StatsPage() {
  const [stats, setStats] = useState<OperatorStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'today' | 'week' | 'month'>('week');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/stats?range=${range}&operator=all`);
      if (res.ok) { const d = await res.json(); setStats(d.stats || []); }
      else toast.error('Ошибка загрузки статистики');
    } catch { toast.error('Ошибка'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [range]);

  const totalChats = stats.reduce((s, x) => s + x.completedChats, 0);
  const avgRating = stats.length ? (stats.reduce((s, x) => s + (x.avgRating || 0), 0) / stats.length).toFixed(1) : '—';
  const totalRatings = stats.reduce((s, x) => s + x.totalRatings, 0);

  const exportCSV = () => {
    const rows = [
      ['Оператор','Email','Чатов','Средняя оценка','Всего оценок'],
      ...stats.map(s => [s.name||s.email, s.email, s.completedChats, s.avgRating, s.totalRatings]),
    ].map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\uFEFF'+rows], { type: 'text/csv;charset=utf-8;' }));
    a.download = `stats_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <AdminShell>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Статистика операторов</h1>
            <p className="text-sm text-white/40">Аналитика поддержки клиентов</p>
          </div>
          <div className="flex gap-2">
            <select value={range} onChange={e => setRange(e.target.value as any)}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none">
              <option value="today" className="bg-[#0f0f1a]">Сегодня</option>
              <option value="week" className="bg-[#0f0f1a]">Неделя</option>
              <option value="month" className="bg-[#0f0f1a]">Месяц</option>
            </select>
            <button onClick={load} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={exportCSV} disabled={!stats.length}
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-40 transition-colors">
              <Download className="h-4 w-4" />
              CSV
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Всего чатов', value: loading ? '—' : totalChats, icon: MessageSquare, color: 'text-violet-400 bg-violet-500/10' },
            { label: 'Средний рейтинг', value: loading ? '—' : avgRating, icon: Star, color: 'text-amber-400 bg-amber-500/10' },
            { label: 'Активных операторов', value: loading ? '—' : stats.length, icon: Users, color: 'text-blue-400 bg-blue-500/10' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="text-xs text-white/30 uppercase tracking-wider">{label}</p>
              <p className="mt-1 text-2xl font-bold text-white">{value}</p>
            </div>
          ))}
        </div>

        {/* Operators table */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.03] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h3 className="text-sm font-semibold text-white">Операторы</h3>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
            </div>
          ) : stats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-white/20">
              <MessageSquare className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">Нет данных за выбранный период</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Оператор','Чатов','Средняя оценка','Всего оценок'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.map(s => (
                    <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/10 text-xs font-bold text-violet-400">
                            {(s.name||s.email)[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-white">{s.name || '—'}</p>
                            <p className="text-[10px] text-white/30">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-white/60">{s.completedChats}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-white/5 max-w-[80px]">
                            <div className="h-1.5 rounded-full bg-amber-400" style={{ width: `${(s.avgRating / 10) * 100}%` }} />
                          </div>
                          <span className="text-xs text-amber-400 font-medium">{s.avgRating.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-white/60">{s.totalRatings}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent ratings */}
        {stats.length > 0 && (
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <h3 className="text-sm font-semibold text-white">Последние оценки</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Оператор','Оценка','Время','Сессия'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.flatMap(s => s.recentRatings.map(r => ({ ...r, opName: s.name || s.email })))
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .slice(0, 10)
                    .map((r, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 text-xs text-white/60">{r.opName}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <div className="flex gap-0.5">
                              {[...Array(10)].map((_, j) => (
                                <div key={j} className={`h-1.5 w-1.5 rounded-full ${j < r.rating ? 'bg-amber-400' : 'bg-white/10'}`} />
                              ))}
                            </div>
                            <span className="text-xs text-amber-400 font-medium">{r.rating}/10</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-white/30 whitespace-nowrap">
                          {new Date(r.timestamp).toLocaleString('ru-RU', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
                        </td>
                        <td className="px-4 py-3 text-[10px] text-white/20 font-mono">{r.sessionId.slice(0,8)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
