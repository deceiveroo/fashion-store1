'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Monitor, Smartphone, Tablet, Trash2, RefreshCw, 
  AlertCircle, Clock, MapPin, Shield, Users
} from 'lucide-react';
import { toast } from 'sonner';

interface Session {
  id: string;
  userId: string;
  token: string;
  device: string | null;
  location: string | null;
  ip: string | null;
  userAgent: string | null;
  lastActive: Date;
  createdAt: Date;
  userEmail: string;
  userName: string | null;
  parsedUA: {
    device: string;
    os: string;
    browser: string;
    icon: 'mobile' | 'tablet' | 'desktop';
  };
  lastActiveRelative: string;
  createdAtRelative: string;
}

export default function AdminSessionsManager() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch('/api/admin/sessions', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to load sessions');
      }

      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (err) {
      console.error('Error loading sessions:', err);
      setError('Не удалось загрузить сессии');
      toast.error('Ошибка загрузки сессий');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadSessions, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleDeleteSession = async (sessionId: string, userId: string) => {
    try {
      setDeletingId(sessionId);
      
      const res = await fetch(
        `/api/admin/sessions?id=${sessionId}&userId=${userId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error('Failed to delete session');
      }

      toast.success('Сессия завершена');
      setConfirmDelete(null);
      await loadSessions();
    } catch (err) {
      console.error('Error deleting session:', err);
      toast.error('Не удалось завершить сессию');
    } finally {
      setDeletingId(null);
    }
  };

  const getDeviceIcon = (icon: string) => {
    switch (icon) {
      case 'mobile':
        return <Smartphone className="h-5 w-5" />;
      case 'tablet':
        return <Tablet className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  const getDeviceColor = (icon: string) => {
    switch (icon) {
      case 'mobile':
        return 'bg-blue-500/20 text-blue-400';
      case 'tablet':
        return 'bg-purple-500/20 text-purple-400';
      default:
        return 'bg-emerald-500/20 text-emerald-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Monitor className="h-7 w-7 text-violet-400" />
            Активные сессии
          </h1>
          <p className="text-sm text-white/40 mt-1">Просмотр и управление активными сессиями всех пользователей</p>
        </div>
        <button onClick={loadSessions} disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Обновить
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Всего сессий', value: sessions.length, icon: Monitor, color: 'bg-violet-500/20 text-violet-400' },
          { label: 'Уникальных пользователей', value: new Set(sessions.map(s => s.userId)).size, icon: Users, color: 'bg-blue-500/20 text-blue-400' },
          { label: 'Мобильные', value: sessions.filter(s => s.parsedUA.icon === 'mobile').length, icon: Smartphone, color: 'bg-emerald-500/20 text-emerald-400' },
          { label: 'Десктоп', value: sessions.filter(s => s.parsedUA.icon === 'desktop').length, icon: Monitor, color: 'bg-amber-500/20 text-amber-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-5 hover:bg-white/[0.08] transition-all backdrop-blur-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-white/50 uppercase tracking-wider">{label}</p>
                <p className="mt-2 text-2xl font-bold text-white">{value}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color} backdrop-blur-sm shadow-lg`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.03] overflow-hidden">
        {loading && sessions.length === 0 ? (
          <div className="flex items-center justify-center h-48">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          </div>
        ) : error && sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-white/20">
            <AlertCircle className="h-10 w-10 mb-2 opacity-40 text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
            <button onClick={loadSessions} className="mt-3 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-medium transition-colors">
              Повторить
            </button>
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-white/20">
            <Monitor className="h-10 w-10 mb-2 opacity-40" />
            <p className="text-sm">Нет активных сессий</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['Пользователь', 'Устройство', 'Локация', 'IP', 'Активность', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider last:text-right">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {sessions.map(session => (
                    <motion.tr
                      key={session.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, x: -100 }}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                    >
                      {/* User */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${getDeviceColor(session.parsedUA.icon)}`}>
                            {getDeviceIcon(session.parsedUA.icon)}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-white">{session.userEmail}</p>
                            <p className="text-[10px] text-white/30">{session.userName || 'Без имени'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Device */}
                      <td className="px-4 py-3">
                        <p className="text-xs text-white/60">{session.parsedUA.browser}</p>
                        <p className="text-[10px] text-white/30">{session.parsedUA.os}</p>
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3">
                        {session.location ? (
                          <p className="text-xs text-white/60 flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-white/20" />
                            {session.location}
                          </p>
                        ) : (
                          <span className="text-xs text-white/20">—</span>
                        )}
                      </td>

                      {/* IP */}
                      <td className="px-4 py-3">
                        {session.ip ? (
                          <p className="text-xs text-white/60 font-mono flex items-center gap-1">
                            <Shield className="h-3 w-3 text-white/20" />
                            {session.ip}
                          </p>
                        ) : (
                          <span className="text-xs text-white/20">—</span>
                        )}
                      </td>

                      {/* Last Active */}
                      <td className="px-4 py-3">
                        <p className="text-xs text-white/60 flex items-center gap-1">
                          <Clock className="h-3 w-3 text-white/20" />
                          {session.lastActiveRelative}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        {confirmDelete === session.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleDeleteSession(session.id, session.userId)}
                              disabled={deletingId === session.id}
                              className="rounded-lg px-2 py-1 text-[10px] font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                            >
                              {deletingId === session.id ? '...' : 'Да'}
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="rounded-lg px-2 py-1 text-[10px] font-medium bg-white/5 text-white/40 hover:bg-white/10 transition-colors"
                            >
                              Нет
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(session.id)}
                            className="rounded-lg p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            title="Завершить сессию"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
