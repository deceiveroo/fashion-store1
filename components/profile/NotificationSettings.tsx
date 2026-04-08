'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Mail, Smartphone, MessageSquare, Package, Tag, Heart, TrendingUp } from 'lucide-react';

interface NotificationChannel {
  email: boolean;
  push: boolean;
  sms: boolean;
}

interface NotificationSettings {
  orders: NotificationChannel;
  promotions: NotificationChannel;
  wishlist: NotificationChannel;
  priceDrops: NotificationChannel;
  newsletter: NotificationChannel;
  security: NotificationChannel;
}

export default function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>({
    orders: { email: true, push: true, sms: true },
    promotions: { email: true, push: false, sms: false },
    wishlist: { email: true, push: true, sms: false },
    priceDrops: { email: true, push: true, sms: false },
    newsletter: { email: true, push: false, sms: false },
    security: { email: true, push: true, sms: true },
  });

  const toggleChannel = (category: keyof NotificationSettings, channel: keyof NotificationChannel) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [channel]: !prev[category][channel],
      },
    }));
  };

  const categories = [
    {
      key: 'orders' as keyof NotificationSettings,
      icon: Package,
      title: 'Заказы и доставка',
      description: 'Статус заказа, отправка, доставка',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500',
    },
    {
      key: 'promotions' as keyof NotificationSettings,
      icon: Tag,
      title: 'Акции и скидки',
      description: 'Специальные предложения и распродажи',
      color: 'text-red-500',
      bgColor: 'bg-red-500',
    },
    {
      key: 'wishlist' as keyof NotificationSettings,
      icon: Heart,
      title: 'Избранное',
      description: 'Товары из списка желаний',
      color: 'text-pink-500',
      bgColor: 'bg-pink-500',
    },
    {
      key: 'priceDrops' as keyof NotificationSettings,
      icon: TrendingUp,
      title: 'Снижение цен',
      description: 'Уведомления о падении цен',
      color: 'text-green-500',
      bgColor: 'bg-green-500',
    },
    {
      key: 'newsletter' as keyof NotificationSettings,
      icon: MessageSquare,
      title: 'Новости и статьи',
      description: 'Рассылка новостей и полезных материалов',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500',
    },
    {
      key: 'security' as keyof NotificationSettings,
      icon: Bell,
      title: 'Безопасность',
      description: 'Важные уведомления о безопасности',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500',
    },
  ];

  const channels = [
    { key: 'email' as keyof NotificationChannel, icon: Mail, label: 'Email' },
    { key: 'push' as keyof NotificationChannel, icon: Bell, label: 'Push' },
    { key: 'sms' as keyof NotificationChannel, icon: Smartphone, label: 'SMS' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-red-500/10 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-red-900/20 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-amber-200/50 dark:border-amber-700/50"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl">
          <Bell className="text-white" size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Уведомления</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Настройте способы получения уведомлений</p>
        </div>
      </div>

      {/* Channel Headers */}
      <div className="flex items-center justify-end gap-4 mb-4 px-4">
        {channels.map((channel) => (
          <div key={channel.key} className="w-16 text-center">
            <channel.icon className="mx-auto mb-1 text-gray-500 dark:text-gray-400" size={16} />
            <p className="text-xs text-gray-600 dark:text-gray-400">{channel.label}</p>
          </div>
        ))}
      </div>

      {/* Categories */}
      <div className="space-y-3">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <motion.div
              key={category.key}
              whileHover={{ scale: 1.01 }}
              className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`p-2 ${category.bgColor} rounded-lg`}>
                    <Icon className="text-white" size={18} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{category.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{category.description}</p>
                  </div>
                </div>

                {/* Toggle Switches */}
                <div className="flex items-center gap-4">
                  {channels.map((channel) => (
                    <div key={channel.key} className="w-16 flex justify-center">
                      <button
                        onClick={() => toggleChannel(category.key, channel.key)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          settings[category.key][channel.key]
                            ? category.bgColor
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <motion.div
                          layout
                          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
                          animate={{
                            left: settings[category.key][channel.key] ? '28px' : '4px',
                          }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={() => {
            const allOn: NotificationSettings = Object.keys(settings).reduce((acc, key) => ({
              ...acc,
              [key]: { email: true, push: true, sms: true },
            }), {} as NotificationSettings);
            setSettings(allOn);
          }}
          className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-medium transition-all"
        >
          Включить все
        </button>
        <button
          onClick={() => {
            const allOff: NotificationSettings = Object.keys(settings).reduce((acc, key) => ({
              ...acc,
              [key]: { email: false, push: false, sms: false },
            }), {} as NotificationSettings);
            setSettings(allOff);
          }}
          className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-all"
        >
          Отключить все
        </button>
      </div>

      {/* Info */}
      <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <Bell className="inline mr-1" size={14} />
          Уведомления о безопасности всегда включены для защиты вашего аккаунта. Вы можете изменить только способ их получения.
        </p>
      </div>
    </motion.div>
  );
}
