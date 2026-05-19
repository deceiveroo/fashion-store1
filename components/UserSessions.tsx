'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Smartphone, Tablet, Clock, Shield, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface Session {
  id: string;
  userId: string;
  isCurrent: boolean;
  createdAt: string;
  lastActive: string;
  userAgent: string;
  ip: string;
  parsedUA: {
    device: string;
    os: string;
    browser: string;
    icon: 'mobile' | 'tablet' | 'desktop';
  };
  lastActiveRelative: string;
  device: string;
}

export default function UserSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch('/api/user/sessions', {
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
  }, []);

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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Активные сессии</h3>
          <p className="text-sm text-white/40 mt-1">Информация о вашем текущем входе</p>
        </div>
        <button 
          onClick={loadSessions} 
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Обновить
        </button>
      </div>

      {/* Sessions List */}
      {loading && sessions.length === 0 ? (
        <div className="flex items-center justify-center h-32">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        </div>
      ) : error && sessions.length === 0 ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
            <div>
              <p className="text-sm text-red-300">{error}</p>
              <button 
                onClick={loadSessions} 
                className="mt-2 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-medium transition-colors"
              >
                Повторить
              </button>
            </div>
          </div>
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-8 bg-white/[0.03] rounded-xl border border-white/5">
          <Monitor className="h-10 w-10 mx-auto mb-2 opacity-40 text-white/20" />
          <p className="text-sm text-white/30">Нет активных сессий</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {sessions.map((session) => (
              <motion.div
                key={session.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className={`rounded-xl border p-4 transition-all ${
                  session.isCurrent 
                    ? 'border-violet-500/30 bg-violet-500/10' 
                    : 'border-white/5 bg-white/[0.03]'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left side - Device info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${getDeviceColor(session.parsedUA.icon)}`}>
                        {getDeviceIcon(session.parsedUA.icon)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-white truncate">
                            {session.parsedUA.device}
                          </h4>
                          {session.isCurrent && (
                            <span className="inline-flex items-center rounded-full border border-violet-500/30 bg-violet-500/20 px-2 py-0.5 text-[10px] font-medium text-violet-300">
                              Текущая
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-white/40 truncate">
                          {session.parsedUA.browser} • {session.parsedUA.os}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      {/* IP Address */}
                      <div className="flex items-center gap-2 text-white/60">
                        <Shield className="w-4 h-4 text-white/20 flex-shrink-0" />
                        <span className="font-mono text-xs truncate">{session.ip}</span>
                      </div>

                      {/* Last Active */}
                      <div className="flex items-center gap-2 text-white/60">
                        <Clock className="w-4 h-4 text-white/20 flex-shrink-0" />
                        <span>{session.lastActiveRelative}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Info Banner */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
        <p className="text-sm text-blue-300">
          <strong>Примечание:</strong> Supabase Auth не предоставляет список всех ваших сессий. 
          Отображается информация о текущем устройстве. Для завершения всех других сессий используйте функцию смены пароля.
        </p>
      </div>
    </div>
  );
}
