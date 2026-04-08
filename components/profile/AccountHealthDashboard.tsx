'use client';

import { motion } from 'framer-motion';
import { Shield, CheckCircle, AlertTriangle, XCircle, Gift, Zap } from 'lucide-react';

interface HealthCheck {
  id: string;
  label: string;
  status: 'good' | 'warning' | 'bad';
  description: string;
  action?: string;
  reward?: string;
}

interface AccountHealthDashboardProps {
  hasPassword: boolean;
  has2FA: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
}

export default function AccountHealthDashboard({
  hasPassword,
  has2FA,
  emailVerified,
  phoneVerified
}: AccountHealthDashboardProps) {
  
  const checks: HealthCheck[] = [
    {
      id: 'password',
      label: 'Пароль',
      status: hasPassword ? 'good' : 'bad',
      description: hasPassword ? 'Пароль установлен' : 'Пароль не установлен',
      action: hasPassword ? undefined : 'Установить пароль',
    },
    {
      id: '2fa',
      label: 'Двухфакторная аутентификация',
      status: has2FA ? 'good' : 'warning',
      description: has2FA ? '2FA включена' : '2FA не включена',
      action: has2FA ? undefined : 'Включить 2FA',
      reward: has2FA ? undefined : 'Бесплатная доставка следующего заказа',
    },
    {
      id: 'email',
      label: 'Email',
      status: emailVerified ? 'good' : 'warning',
      description: emailVerified ? 'Email подтверждён' : 'Email не подтверждён',
      action: emailVerified ? undefined : 'Подтвердить email',
    },
    {
      id: 'phone',
      label: 'Телефон',
      status: phoneVerified ? 'good' : 'warning',
      description: phoneVerified ? 'Телефон подтверждён' : 'Телефон не подтверждён',
      action: phoneVerified ? undefined : 'Добавить телефон',
      reward: phoneVerified ? undefined : 'Скидка 5% на следующую покупку',
    },
  ];

  const goodCount = checks.filter(c => c.status === 'good').length;
  const totalCount = checks.length;
  const healthScore = Math.round((goodCount / totalCount) * 100);

  const getHealthColor = () => {
    if (healthScore >= 75) return { bg: 'from-green-500 to-emerald-500', text: 'text-green-600', ring: 'ring-green-500' };
    if (healthScore >= 50) return { bg: 'from-yellow-500 to-orange-500', text: 'text-yellow-600', ring: 'ring-yellow-500' };
    return { bg: 'from-red-500 to-rose-500', text: 'text-red-600', ring: 'ring-red-500' };
  };

  const getHealthLabel = () => {
    if (healthScore >= 75) return 'Отлично';
    if (healthScore >= 50) return 'Хорошо';
    return 'Требует внимания';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="text-green-500" size={20} />;
      case 'warning': return <AlertTriangle className="text-yellow-500" size={20} />;
      case 'bad': return <XCircle className="text-red-500" size={20} />;
    }
  };

  const colors = getHealthColor();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/50 dark:border-gray-700/50"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Shield className="text-indigo-600 dark:text-indigo-400" size={24} />
          Здоровье аккаунта
        </h2>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          className={`px-4 py-2 rounded-full bg-gradient-to-r ${colors.bg} text-white font-bold text-sm shadow-lg`}
        >
          {getHealthLabel()}
        </motion.div>
      </div>

      {/* Health Score Circle */}
      <div className="flex items-center justify-center mb-8">
        <div className="relative w-40 h-40">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            <motion.circle
              cx="80"
              cy="80"
              r="70"
              stroke="url(#healthGradient)"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              initial={{ strokeDashoffset: 440 }}
              animate={{ strokeDashoffset: 440 - (440 * healthScore) / 100 }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
              style={{
                strokeDasharray: 440,
              }}
            />
            <defs>
              <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={healthScore >= 75 ? '#10b981' : healthScore >= 50 ? '#f59e0b' : '#ef4444'} />
                <stop offset="100%" stopColor={healthScore >= 75 ? '#059669' : healthScore >= 50 ? '#d97706' : '#dc2626'} />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className={`text-4xl font-black ${colors.text} dark:opacity-90`}
            >
              {healthScore}%
            </motion.span>
            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Безопасность</span>
          </div>
        </div>
      </div>

      {/* Checks List */}
      <div className="space-y-3 mb-6">
        {checks.map((check, index) => (
          <motion.div
            key={check.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + index * 0.1 }}
            className="flex items-start gap-3 p-4 bg-white/50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
          >
            <div className="mt-0.5">
              {getStatusIcon(check.status)}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{check.label}</h3>
                {check.reward && (
                  <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 font-medium">
                    <Gift size={14} />
                    <span>Награда</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{check.description}</p>
              {check.action && (
                <button className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors">
                  <Zap size={14} />
                  {check.action}
                </button>
              )}
              {check.reward && (
                <div className="mt-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-medium inline-block">
                  🎁 {check.reward}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* AI Recommendations */}
      {healthScore < 100 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg">
              <Zap className="text-white" size={16} />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">AI-рекомендация</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Улучшите безопасность аккаунта и получите эксклюзивные бонусы! 
                {!has2FA && ' Включите 2FA для бесплатной доставки.'}
                {!phoneVerified && ' Добавьте телефон для скидки 5%.'}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
