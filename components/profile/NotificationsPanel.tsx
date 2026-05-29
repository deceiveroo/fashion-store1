'use client';

import { Mail, Bell, Phone, Package, Star, Heart, X, CheckCircle2 } from 'lucide-react';
import Button from '@/components/ui/Button';

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
  const updateNotification = async (key: string, value: boolean) => {
    const newSettings = { ...notifications, [key]: value };
    setNotifications(newSettings);
    
    try {
      const res = await fetch('/api/profile/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Use cookies for auth
        body: JSON.stringify({ [key]: value }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
      // Revert on error
      setNotifications(notifications);
    }
  };

  const toggleAll = async (enable: boolean) => {
    const allKeys = Object.keys(notifications);
    const newSettings = allKeys.reduce((acc, key) => ({ ...acc, [key]: enable }), {});
    setNotifications(newSettings);
    
    try {
      const res = await fetch('/api/profile/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newSettings),
      });
      
      if (!res.ok) {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
      // Revert on error
      setNotifications(notifications);
    }
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
      <div className="fc-glass-card overflow-hidden">

        {/* Categories */}
        <div className="divide-y divide-[var(--fc-glass-border)]">
          {categories.map((category) => (
            <div key={category.title} className="p-5 transition-colors hover:bg-[var(--fc-surface-elevated)]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 ${category.iconBg} rounded-lg`}>
                    <category.icon size={18} className={category.iconColor} />
                  </div>
                  <div>
                    <h4 className="font-medium text-[var(--foreground)]">{category.title}</h4>
                    <p className="text-xs text-[var(--text-secondary)]">{category.description}</p>
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
                      className="group flex cursor-pointer items-center justify-between rounded-xl border border-[var(--fc-glass-border)] bg-[var(--fc-surface-elevated)] p-3 transition-all hover:border-[#8b7cf6] hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex items-center gap-2">
                        <Icon size={14} className="text-[var(--text-secondary)] transition-colors group-hover:text-[#8b7cf6]" />
                        <span className="text-xs font-medium text-[var(--foreground)]">{channel.key}</span>
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={(notifications as any)[key] || false}
                          onChange={(e) => updateNotification(key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-300 dark:bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#8b7cf6]"></div>
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
        <Button
          variant="outline"
          size="md"
          fullWidth
          icon={<X size={16} />}
          onClick={() => toggleAll(false)}
        >
          Отключить все
        </Button>
        <Button
          variant="primary"
          size="md"
          fullWidth
          icon={<CheckCircle2 size={16} />}
          onClick={() => toggleAll(true)}
        >
          Включить все
        </Button>
      </div>
    </div>
  );
}
