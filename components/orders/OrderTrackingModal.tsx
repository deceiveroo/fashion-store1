'use client';

import { motion } from 'framer-motion';
import { MapPin, Truck, Package, CheckCircle, Clock, Calendar, X } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface TrackingEvent {
  id: string;
  status: string;
  location: string;
  description: string;
  timestamp: string;
}

interface OrderTrackingProps {
  trackingNumber?: string;
  trackingStatus?: string;
  currentLocation?: string;
  estimatedDelivery?: string;
  trackingHistory?: TrackingEvent[];
  onClose: () => void;
}

// Ordered pipeline used by both the horizontal step indicator and status lookups.
const STEP_ORDER = ['pending', 'in_transit', 'out_for_delivery', 'delivered'] as const;

export default function OrderTrackingModal({
  trackingNumber,
  trackingStatus = 'pending',
  currentLocation,
  estimatedDelivery,
  trackingHistory = [],
  onClose
}: OrderTrackingProps) {

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; short: string; color: string; icon: any }> = {
      pending: { label: 'Заказ оформлен', short: 'Принят', color: 'text-[var(--text-secondary)]', icon: Clock },
      in_transit: { label: 'В пути', short: 'В пути', color: 'text-[var(--fc-accent)]', icon: Truck },
      out_for_delivery: { label: 'Доставляется', short: 'Доставка', color: 'text-[var(--fc-accent)]', icon: Package },
      delivered: { label: 'Доставлен', short: 'Доставлен', color: 'text-emerald-500', icon: CheckCircle },
    };
    return statusMap[status] || statusMap.pending;
  };

  const statusInfo = getStatusInfo(trackingStatus);
  const StatusIcon = statusInfo.icon;

  // Index of the active step in the horizontal pipeline (used to fill completed steps).
  const currentStepIndex = Math.max(
    0,
    STEP_ORDER.indexOf(trackingStatus as (typeof STEP_ORDER)[number])
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 24 }}
        transition={{ type: 'spring', damping: 24, stiffness: 280 }}
        className="fc-glass-card relative max-w-2xl w-full max-h-[90vh] overflow-y-auto !rounded-3xl border border-[var(--fc-glass-border)] shadow-[var(--fc-shadow-lifted)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[var(--fc-surface-elevated)] backdrop-blur-xl border-b border-[var(--fc-glass-border)] p-6 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
              <span className="grid place-items-center w-9 h-9 rounded-xl bg-[rgba(var(--fc-accent-rgb)/0.14)] text-[var(--fc-accent)]">
                <Truck size={20} />
              </span>
              Отслеживание заказа
            </h3>
            {trackingNumber && (
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Трек-номер: {trackingNumber}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Horizontal step indicator */}
          <div className="fc-neomorph-inset rounded-2xl px-4 py-5">
            <div className="flex items-center justify-between">
              {STEP_ORDER.map((step, index) => {
                const info = getStatusInfo(step);
                const StepIcon = info.icon;
                const isDone = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const isConnectorActive = index < currentStepIndex;

                return (
                  <div key={step} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-2">
                      <motion.div
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.08, type: 'spring', damping: 18, stiffness: 260 }}
                        className={`relative grid place-items-center w-10 h-10 rounded-full border transition-colors ${
                          isDone
                            ? 'bg-[var(--fc-accent)] border-transparent text-white shadow-[0_6px_18px_rgba(var(--fc-accent-rgb)/0.4)]'
                            : 'bg-[var(--fc-surface)] border-[var(--fc-glass-border)] text-[var(--text-secondary)]'
                        }`}
                      >
                        <StepIcon size={18} />
                        {isCurrent && (
                          <motion.span
                            className="absolute inset-0 rounded-full ring-2 ring-[var(--fc-accent)]"
                            initial={{ opacity: 0.6, scale: 1 }}
                            animate={{ opacity: 0, scale: 1.6 }}
                            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                          />
                        )}
                      </motion.div>
                      <span
                        className={`text-[11px] font-semibold text-center ${
                          isDone ? 'text-[var(--foreground)]' : 'text-[var(--text-secondary)]'
                        }`}
                      >
                        {info.short}
                      </span>
                    </div>

                    {index < STEP_ORDER.length - 1 && (
                      <div className="flex-1 h-0.5 mx-1 -mt-6 rounded-full bg-[var(--fc-glass-border)] overflow-hidden">
                        <motion.div
                          className="h-full bg-[var(--fc-accent)]"
                          initial={{ width: 0 }}
                          animate={{ width: isConnectorActive ? '100%' : '0%' }}
                          transition={{ duration: 0.5, ease: 'easeInOut', delay: index * 0.08 }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current Status */}
          <div className="fc-holographic-panel rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-[var(--fc-surface-elevated)] rounded-xl border border-[var(--fc-glass-border)]">
                <StatusIcon className={statusInfo.color} size={32} />
              </div>
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Текущий статус</p>
                <p className={`text-lg font-bold ${statusInfo.color}`}>
                  {statusInfo.label}
                </p>
              </div>
            </div>

            {currentLocation && (
              <div className="flex items-center gap-2 text-[var(--foreground)]">
                <MapPin size={18} className="text-[var(--fc-accent)]" />
                <span className="font-medium">{currentLocation}</span>
              </div>
            )}

            {estimatedDelivery && (
              <div className="flex items-center gap-2 text-[var(--foreground)] mt-2">
                <Calendar size={18} className="text-[var(--fc-accent)]" />
                <span>Ожидаемая доставка: {format(new Date(estimatedDelivery), 'dd MMMM yyyy', { locale: ru })}</span>
              </div>
            )}
          </div>

          {/* Tracking History */}
          {trackingHistory.length > 0 ? (
            <div>
              <h4 className="font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
                <Clock size={20} className="text-[var(--fc-accent)]" />
                История перемещений
              </h4>

              <div className="space-y-4">
                {trackingHistory.map((event, index) => {
                  const EventIcon = getStatusInfo(event.status).icon;
                  const isLast = index === trackingHistory.length - 1;

                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + index * 0.08, ease: 'easeOut' }}
                      className="relative"
                    >
                      {/* Timeline line */}
                      {!isLast && (
                        <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-gradient-to-b from-[var(--fc-accent)] to-[rgba(var(--fc-accent-rgb)/0.2)]"></div>
                      )}

                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full fc-glass-card !rounded-full grid place-items-center border border-[rgba(var(--fc-accent-rgb)/0.3)]">
                            <EventIcon size={20} className="text-[var(--fc-accent)]" />
                          </div>
                        </div>

                        <div className="flex-1 pb-4">
                          <div className="flex items-start justify-between mb-1 gap-3">
                            <p className="font-semibold text-[var(--foreground)]">
                              {event.description}
                            </p>
                            <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap">
                              {format(new Date(event.timestamp), 'dd.MM.yyyy HH:mm', { locale: ru })}
                            </span>
                          </div>

                          {event.location && (
                            <div className="flex items-center gap-1 text-sm text-[var(--text-secondary)]">
                              <MapPin size={14} />
                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-[var(--text-secondary)]">
              <Package size={48} className="mx-auto mb-4 opacity-50" />
              <p>История отслеживания пока пуста</p>
              <p className="text-sm mt-2">Информация появится после отправки заказа</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
