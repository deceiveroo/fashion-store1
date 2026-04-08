'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Smartphone, Key, Clock, MapPin, Monitor, X, Check, AlertTriangle } from 'lucide-react';

interface Session {
  id: string;
  device: string;
  location: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
}

interface LoginHistory {
  id: string;
  device: string;
  location: string;
  timestamp: string;
  success: boolean;
}

export default function SecuritySettings() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  const [sessions, setSessions] = useState<Session[]>([
    { id: '1', device: 'Chrome на Windows', location: 'Москва, Россия', ip: '192.168.1.1', lastActive: '2 минуты назад', isCurrent: true },
    { id: '2', device: 'Safari на iPhone', location: 'Москва, Россия', ip: '192.168.1.2', lastActive: '1 час назад', isCurrent: false },
    { id: '3', device: 'Firefox на MacOS', location: 'Санкт-Петербург, Россия', ip: '192.168.1.3', lastActive: '2 дня назад', isCurrent: false },
  ]);

  const [loginHistory] = useState<LoginHistory[]>([
    { id: '1', device: 'Chrome на Windows', location: 'Москва', timestamp: '2024-04-08 14:30', success: true },
    { id: '2', device: 'Safari на iPhone', location: 'Москва', timestamp: '2024-04-08 10:15', success: true },
    { id: '3', device: 'Unknown Device', location: 'Неизвестно', timestamp: '2024-04-07 23:45', success: false },
    { id: '4', device: 'Firefox на MacOS', location: 'Санкт-Петербург', timestamp: '2024-04-06 18:20', success: true },
  ]);

  const terminateSession = (sessionId: string) => {
    setSessions(sessions.filter(s => s.id !== sessionId));
  };

  const terminateAllSessions = () => {
    setSessions(sessions.filter(s => s.isCurrent));
  };

  const enable2FA = () => {
    if (verificationCode.length === 6) {
      setTwoFactorEnabled(true);
      setShowQRCode(false);
      setVerificationCode('');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-gradient-to-br from-indigo-500/10 via-blue-500/10 to-cyan-500/10 dark:from-indigo-900/20 dark:via-blue-900/20 dark:to-cyan-900/20 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-indigo-200/50 dark:border-indigo-700/50"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl">
          <Shield className="text-white" size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Безопасность</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Управление доступом и защитой</p>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Smartphone className="text-indigo-500" size={20} />
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Двухфакторная аутентификация</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {twoFactorEnabled ? 'Включена' : 'Дополнительная защита аккаунта'}
              </p>
            </div>
          </div>
          <button
            onClick={() => twoFactorEnabled ? setTwoFactorEnabled(false) : setShowQRCode(true)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              twoFactorEnabled
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-indigo-500 hover:bg-indigo-600 text-white'
            }`}
          >
            {twoFactorEnabled ? 'Отключить' : 'Включить'}
          </button>
        </div>

        <AnimatePresence>
          {showQRCode && !twoFactorEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 bg-white dark:bg-gray-700 rounded-lg"
            >
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                Отсканируйте QR-код в приложении Google Authenticator или Authy
              </p>
              <div className="w-48 h-48 bg-gray-200 dark:bg-gray-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <span className="text-gray-500">QR CODE</span>
              </div>
              <input
                type="text"
                placeholder="Введите 6-значный код"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg text-center text-lg tracking-widest mb-3"
                maxLength={6}
              />
              <div className="flex gap-2">
                <button
                  onClick={enable2FA}
                  disabled={verificationCode.length !== 6}
                  className="flex-1 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  Подтвердить
                </button>
                <button
                  onClick={() => { setShowQRCode(false); setVerificationCode(''); }}
                  className="flex-1 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                >
                  Отмена
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {twoFactorEnabled && (
          <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center gap-2 text-green-700 dark:text-green-400 text-sm">
            <Check size={16} />
            <span>2FA активна. Ваш аккаунт защищён дополнительным уровнем безопасности.</span>
          </div>
        )}
      </div>

      {/* Active Sessions */}
      <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Monitor className="text-blue-500" size={18} />
            <h4 className="font-semibold text-gray-900 dark:text-white">Активные сессии</h4>
          </div>
          {sessions.length > 1 && (
            <button
              onClick={terminateAllSessions}
              className="text-xs text-red-600 dark:text-red-400 hover:underline"
            >
              Завершить все
            </button>
          )}
        </div>
        <div className="space-y-2">
          {sessions.map((session) => (
            <motion.div
              key={session.id}
              layout
              className={`p-3 rounded-lg ${
                session.isCurrent
                  ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700'
                  : 'bg-white dark:bg-gray-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Monitor size={14} className="text-gray-500" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{session.device}</p>
                    {session.isCurrent && (
                      <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">Текущая</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <MapPin size={10} />
                      {session.location}
                    </span>
                    <span>{session.ip}</span>
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {session.lastActive}
                    </span>
                  </div>
                </div>
                {!session.isCurrent && (
                  <button
                    onClick={() => terminateSession(session.id)}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Login History */}
      <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="text-purple-500" size={18} />
          <h4 className="font-semibold text-gray-900 dark:text-white">История входов</h4>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {loginHistory.map((login) => (
            <motion.div
              key={login.id}
              whileHover={{ scale: 1.01 }}
              className={`p-3 rounded-lg ${
                login.success
                  ? 'bg-white dark:bg-gray-700'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {login.success ? (
                      <Check size={14} className="text-green-500" />
                    ) : (
                      <AlertTriangle size={14} className="text-red-500" />
                    )}
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{login.device}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <MapPin size={10} />
                      {login.location}
                    </span>
                    <span>{login.timestamp}</span>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  login.success
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                }`}>
                  {login.success ? 'Успешно' : 'Неудачно'}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Security Tips */}
      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-2">
          <Key className="text-blue-500 flex-shrink-0 mt-0.5" size={16} />
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <p className="font-medium mb-1">Советы по безопасности:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Используйте уникальный пароль для каждого сервиса</li>
              <li>Включите двухфакторную аутентификацию</li>
              <li>Регулярно проверяйте активные сессии</li>
              <li>Не входите в аккаунт с общедоступных устройств</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
