'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, MapPin, Shield, Clock, Phone, LogOut, AlertTriangle } from 'lucide-react';
import { UserSession } from '@/app/profile/hooks/useProfileData';
import { Loader } from 'lucide-react';
import Button from '@/components/ui/Button';

interface SecuritySectionProps {
  sessions: UserSession[];
  isLoadingData: boolean;
  onTerminateSession?: (sessionId: string) => Promise<void> | void;
  onTerminateAllOthers?: () => Promise<void> | void;
}

export default function SecuritySection({
  sessions,
  isLoadingData,
  onTerminateSession,
  onTerminateAllOthers,
}: SecuritySectionProps) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingAll, setPendingAll] = useState(false);
  const [confirmAll, setConfirmAll] = useState(false);

  const hasOtherSessions = sessions.some((s) => !s.isCurrent);

  const terminate = async (id: string) => {
    if (!onTerminateSession) return;
    setPendingId(id);
    try {
      await onTerminateSession(id);
    } finally {
      setPendingId(null);
    }
  };

  const terminateAll = async () => {
    if (!onTerminateAllOthers) return;
    setPendingAll(true);
    try {
      await onTerminateAllOthers();
      setConfirmAll(false);
    } finally {
      setPendingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <h4 className="font-semibold text-[var(--foreground)]">Активные сессии</h4>
        {hasOtherSessions && onTerminateAllOthers && (
          <Button
            type="button"
            variant="danger"
            size="sm"
            icon={<LogOut size={14} />}
            onClick={() => setConfirmAll(true)}
            disabled={pendingAll}
          >
            Завершить все другие
          </Button>
        )}
      </div>

      {isLoadingData ? (
        <div className="flex items-center justify-center py-8">
          <Loader className="animate-spin text-[#8b7cf6]" size={32} />
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-8 bg-[var(--fc-surface-elevated)] border border-[var(--fc-glass-border)] rounded-xl">
          <Monitor size={48} className="mx-auto text-[var(--text-secondary)] opacity-50 mb-3" />
          <p className="text-[var(--text-secondary)]">Нет активных сессий</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const isMobile = session.device.toLowerCase().includes('mobile') || session.device.toLowerCase().includes('iphone') || session.device.toLowerCase().includes('android');
            const isTablet = session.device.toLowerCase().includes('ipad') || session.device.toLowerCase().includes('tablet');
            const isBusy = pendingId === session.id;

            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2 }}
                className={`p-4 rounded-xl border transition-all ${
                  session.isCurrent
                    ? 'bg-gradient-to-br from-emerald-50 to-emerald-50 dark:from-emerald-900/20 dark:to-emerald-900/20 border-emerald-300 dark:border-emerald-700 shadow-lg shadow-emerald-500/10'
                    : 'bg-[var(--fc-surface-elevated)] border-[var(--fc-glass-border)] hover:shadow-lg hover:border-[#8b7cf6]/50'
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    {/* Device Icon and Name */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-lg ${
                        session.isCurrent
                          ? 'bg-emerald-500 text-white'
                          : 'bg-[#8b7cf6]/10 text-[#8b7cf6]'
                      }`}>
                        {isMobile ? <Phone size={20} /> : isTablet ? <Monitor size={20} /> : <Monitor size={20} />}
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--foreground)]">{session.device}</p>
                        {session.isCurrent && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500 text-white text-xs rounded-full font-medium">
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            Текущая сессия
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Session Details */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                        <MapPin size={14} className="text-[#8b7cf6]" />
                        <span>{session.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                        <Shield size={14} className="text-[#8b7cf6]" />
                        <span className="font-mono text-xs">{session.ip}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[var(--text-secondary)] col-span-2 md:col-span-1">
                        <Clock size={14} className="text-amber-500" />
                        <span>{session.lastActive}</span>
                      </div>
                    </div>
                  </div>

                  {/* Terminate button — только для НЕ-текущих сессий */}
                  {!session.isCurrent && onTerminateSession && (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      icon={isBusy ? <Loader size={14} className="animate-spin" /> : <LogOut size={14} />}
                      onClick={() => terminate(session.id)}
                      disabled={isBusy}
                      aria-label={`Завершить сессию ${session.device}`}
                    >
                      Завершить
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Security Tips */}
      <div className="mt-6 p-4 bg-[#8b7cf6]/10 border border-[#8b7cf6]/30 rounded-xl">
        <h5 className="font-semibold text-[#8b7cf6] mb-2 flex items-center gap-2">
          <Shield size={16} />
          Советы по безопасности
        </h5>
        <ul className="text-sm text-[var(--text-secondary)] space-y-1 list-disc list-inside">
          <li>Регулярно проверяйте активные сессии</li>
          <li>Используйте надежные пароли</li>
          <li>Включите двухфакторную аутентификацию</li>
          <li>Не входите с чужих устройств</li>
        </ul>
      </div>

      {/* Confirm modal — завершить ВСЕ другие сессии */}
      <AnimatePresence>
        {confirmAll && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => !pendingAll && setConfirmAll(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="fc-glass-card p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--foreground)]">
                    Завершить все другие сессии?
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    Все ваши устройства, кроме текущего, будут разлогинены при следующем запросе. Это необратимо.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  onClick={() => setConfirmAll(false)}
                  disabled={pendingAll}
                >
                  Отмена
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  fullWidth
                  loading={pendingAll}
                  onClick={terminateAll}
                  disabled={pendingAll}
                >
                  Завершить все
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
