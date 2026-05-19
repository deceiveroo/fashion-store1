'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

export default function OrderTrackingModal({ 
  trackingNumber,
  trackingStatus = 'pending',
  currentLocation,
  estimatedDelivery,
  trackingHistory = [],
  onClose 
}: OrderTrackingProps) {
  
  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; icon: any }> = {
      pending: { label: 'Заказ оформлен', color: 'text-gray-600', icon: Clock },
      in_transit: { label: 'В пути', color: 'text-blue-600', icon: Truck },
      out_for_delivery: { label: 'Доставляется', color: 'text-purple-600', icon: Package },
      delivered: { label: 'Доставлен', color: 'text-green-600', icon: CheckCircle },
    };
    return statusMap[status] || statusMap.pending;
  };

  const statusInfo = getStatusInfo(trackingStatus);
  const StatusIcon = statusInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white dark:bg-gray-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between z-10">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Truck className="text-purple-600" size={24} />
              Отслеживание заказа
            </h3>
            {trackingNumber && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Трек-номер: {trackingNumber}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Current Status */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-700">
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 bg-white dark:bg-gray-700 rounded-xl`}>
                <StatusIcon className={statusInfo.color} size={32} />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Текущий статус</p>
                <p className={`text-lg font-bold ${statusInfo.color}`}>
                  {statusInfo.label}
                </p>
              </div>
            </div>

            {currentLocation && (
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <MapPin size={18} className="text-purple-600" />
                <span className="font-medium">{currentLocation}</span>
              </div>
            )}

            {estimatedDelivery && (
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mt-2">
                <Calendar size={18} className="text-purple-600" />
                <span>Ожидаемая доставка: {format(new Date(estimatedDelivery), 'dd MMMM yyyy', { locale: ru })}</span>
              </div>
            )}
          </div>

          {/* Tracking History */}
          {trackingHistory.length > 0 ? (
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Clock size={20} />
                История перемещений
              </h4>
              
              <div className="space-y-4">
                {trackingHistory.map((event, index) => {
                  const EventIcon = getStatusInfo(event.status).icon;
                  const isLast = index === trackingHistory.length - 1;
                  
                  return (
                    <div key={event.id} className="relative">
                      {/* Timeline line */}
                      {!isLast && (
                        <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                      )}
                      
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <EventIcon size={20} className="text-purple-600 dark:text-purple-400" />
                          </div>
                        </div>
                        
                        <div className="flex-1 pb-4">
                          <div className="flex items-start justify-between mb-1">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {event.description}
                            </p>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {format(new Date(event.timestamp), 'dd.MM.yyyy HH:mm', { locale: ru })}
                            </span>
                          </div>
                          
                          {event.location && (
                            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                              <MapPin size={14} />
                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
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
