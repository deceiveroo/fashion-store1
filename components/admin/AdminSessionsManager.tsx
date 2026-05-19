'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Monitor, Smartphone, Tablet, Trash2, RefreshCw, 
  AlertCircle, CheckCircle, Clock, MapPin, Shield 
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
        return <Smartphone className="w-5 h-5" />;
      case 'tablet':
        return <Tablet className="w-5 h-5" />;
      default:
        return <Monitor className="w-5 h-5" />;
    }
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-violet-500" />
          <p className="text-gray-600 dark:text-gray-400">Загрузка сессий...</p>
        </div>
      </div>
    );
  }

  if (error && sessions.length === 0) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 dark:text-red-300">Ошибка</h3>
            <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
            <button
              onClick={loadSessions}
              className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Повторить
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Активные сессии
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Всего сессий: {sessions.length}
          </p>
        </div>
        <button
          onClick={loadSessions}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Обновить
        </button>
      </div>

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
          <Monitor className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400">Нет активных сессий</p>
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
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left side - User & Device info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white">
                        {getDeviceIcon(session.parsedUA.icon)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {session.userEmail}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {session.userName || 'Без имени'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3 text-sm">
                      {/* Device */}
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <Monitor className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{session.parsedUA.device}</span>
                      </div>

                      {/* Location */}
                      {session.location && (
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{session.location}</span>
                        </div>
                      )}

                      {/* IP */}
                      {session.ip && (
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <Shield className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="font-mono text-xs">{session.ip}</span>
                        </div>
                      )}

                      {/* Last Active */}
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span>{session.lastActiveRelative}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right side - Actions */}
                  <div className="flex-shrink-0">
                    {confirmDelete === session.id ? (
                      <div className="flex flex-col gap-2">
                        <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          Подтвердить?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeleteSession(session.id, session.userId)}
                            disabled={deletingId === session.id}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
                          >
                            {deletingId === session.id ? '...' : 'Да'}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium transition-colors"
                          >
                            Нет
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(session.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Завершить сессию"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
