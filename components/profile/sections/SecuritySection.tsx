'use client';

import { motion } from 'framer-motion';
import { Monitor, MapPin, Shield, Clock, Phone } from 'lucide-react';
import { UserSession } from '@/app/profile/hooks/useProfileData';
import { Loader } from 'lucide-react';

interface SecuritySectionProps {
  sessions: UserSession[];
  isLoadingData: boolean;
}

export default function SecuritySection({ sessions, isLoadingData }: SecuritySectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-gray-900 dark:text-white">Активные сессии</h4>
      </div>
      
      {isLoadingData ? (
        <div className="flex items-center justify-center py-8">
          <Loader className="animate-spin text-purple-600" size={32} />
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <Monitor size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-600 dark:text-gray-400">Нет активных сессий</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const isMobile = session.device.toLowerCase().includes('mobile') || session.device.toLowerCase().includes('iphone') || session.device.toLowerCase().includes('android');
            const isTablet = session.device.toLowerCase().includes('ipad') || session.device.toLowerCase().includes('tablet');
            
            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl border-2 transition-all ${
                  session.isCurrent 
                    ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-300 dark:border-green-700 shadow-lg shadow-green-100 dark:shadow-green-900/20' 
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    {/* Device Icon and Name */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-lg ${
                        session.isCurrent 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        {isMobile ? <Phone size={20} /> : isTablet ? <Monitor size={20} /> : <Monitor size={20} />}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{session.device}</p>
                        {session.isCurrent && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full font-medium">
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            Текущая сессия
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Session Details */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <MapPin size={14} className="text-purple-500" />
                        <span>{session.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Shield size={14} className="text-blue-500" />
                        <span className="font-mono text-xs">{session.ip}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 col-span-2 md:col-span-1">
                        <Clock size={14} className="text-orange-500" />
                        <span>{session.lastActive}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Security Tips */}
      <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl">
        <h5 className="font-semibold text-purple-900 dark:text-purple-300 mb-2 flex items-center gap-2">
          <Shield size={16} />
          Советы по безопасности
        </h5>
        <ul className="text-sm text-purple-800 dark:text-purple-400 space-y-1 list-disc list-inside">
          <li>Регулярно проверяйте активные сессии</li>
          <li>Используйте надежные пароли</li>
          <li>Включите двухфакторную аутентификацию</li>
          <li>Не входите с чужих устройств</li>
        </ul>
      </div>
    </div>
  );
}
