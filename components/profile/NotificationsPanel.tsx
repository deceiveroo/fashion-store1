'use client';

import { Mail, Bell, Phone, Package, Star, Heart, X, CheckCircle2 } from 'lucide-react';

interface NotificationSettings {
  ordersEmail?: boolean;
  ordersPush?: boolean;
  ordersSms?: boolean;
  promotionsEmail?: boolean;
  promotionsPush?: boolean;
  promotionsSms?: boolean;
  wishlistEmail?: boolean;
  wishlistPush?: boolean;
  wishlistSms?: boolean;
}

interface NotificationsPanelProps {
  notifications: NotificationSettings;
  setNotifications: (settings: NotificationSettings) => void;
}

export default function NotificationsPanel({ notifications, setNotifications }: NotificationsPanelProps) {
  const updateNotification = (key: string, value: boolean) => {
    const newSettings = { ...notifications, [key]: value };
    setNotifications(newSettings);
    fetch('/api/profile/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
      },
      body: JSON.stringify(newSettings),
    });
  };

  const toggleAll = (enable: boolean) => {
    const allKeys = Object.keys(notifications);
    const newSettings = allKeys.reduce((acc, key) => ({ ...acc, [key]: enable }), {});
    setNotifications(newSettings);
    fetch('/api/profile/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
      },
      body: JSON.stringify(newSettings),
    });
  };

  const categories = [
    {
      title: 'Заказы',
      description: 'Статус заказа, доставка, оплата',
      icon: Package,
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      keys: ['ordersEmail', 'ordersPush', 'ordersSms'],
    },
    {
      title: 'Акции и скидки',
      description: 'Специальные предложения и промокоды',
      icon: Star,
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
      keys: ['promotionsEmail', 'promotionsPush', 'promotionsSms'],
    },
    {
      title: 'Избранное',
      description: 'Изменения цен, наличие товаров',
      icon: Heart,
      iconColor: 'text-red-600 dark:text-red-400',
      iconBg: 'bg-red-100 dark:bg-red-900/30',
      keys: ['wishlistEmail', 'wishlistPush', 'wishlistSms'],
    },
  ];

  const channels = [
    { key: 'Email', icon: Mail },
    { key: 'Push', icon: Bell },
    { key: 'SMS', icon: Phone },
  ];

  return (
    <div className="space-y-4">
      {/* Main Panel */}
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
       
        {/* Categories */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {categories.map((category) => (
            <div key={category.title} className="p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 ${category.iconBg} rounded-lg`}>
                    <category.icon size={18} className={category.iconColor} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{category.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{category.description}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 pl-14">
                {category.keys.map((key, idx) => {
                  const channel = channels[idx];
                  const Icon = channel.icon;
                  return (
                    <label
                      key={key}
                      className="flex items-center justify-between p-3 bg-white dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 transition-all group"
                    >
                      <div className="flex items-center gap-2">
                        <Icon size={14} className="text-gray-400 group-hover:text-purple-500 transition-colors" />
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{channel.key}</span>
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={(notifications as any)[key] || false}
                          onChange={(e) => updateNotification(key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-300 dark:bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => toggleAll(false)}
          className="p-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-700 transition-all group"
        >
          <X size={20} className="mx-auto mb-2 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300" />
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Отключить все</p>
        </button>
        <button
          onClick={() => toggleAll(true)}
          className="p-4 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 rounded-xl border border-purple-200 dark:border-purple-800 transition-all group"
        >
          <CheckCircle2 size={20} className="mx-auto mb-2 text-purple-600 dark:text-purple-400" />
          <p className="text-xs font-medium text-purple-700 dark:text-purple-300">Включить все</p>
        </button>
      </div>
    </div>
  );
}
