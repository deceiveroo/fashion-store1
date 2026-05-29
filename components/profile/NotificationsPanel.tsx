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
    { key: 'Email', icon: Mail, hint: 'на почту' },
    { key: 'Push', icon: Bell, hint: 'в браузере' },
    { key: 'SMS', icon: Phone, hint: 'на телефон' },
  ];

  const enabledCount = Object.values(notifications).filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Пояснение: что это и как работает */}
      <div className="rounded-2xl border border-[#8b7cf6]/30 bg-[#8b7cf6]/[0.07] p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: 'linear-gradient(135deg, #8b7cf6, #c4b5fd)' }}>
            <Bell size={18} className="text-white" />
          </div>
          <div className="text-sm">
            <p className="font-semibold text-[var(--foreground)]">Как это работает</p>
            <p className="mt-0.5 text-[var(--text-secondary)]">
              Слева — <b>о чём</b> уведомлять (заказы, акции, избранное), справа — <b>каким способом</b>:
              {' '}<b className="text-[#8b7cf6]">Email</b> (на почту), <b className="text-[#8b7cf6]">Push</b> (в браузере),
              {' '}<b className="text-[#8b7cf6]">SMS</b> (на телефон). Включайте только нужное.
            </p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">Активно сейчас: {enabledCount} из 9.</p>
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="fc-glass-card overflow-hidden">
        {/* Categories */}
        <div className="divide-y divide-[var(--fc-glass-border)]">
          {categories.map((category) => {
            const activeInCat = category.keys.filter((k) => (notifications as any)[k]).length;
            return (
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
                <span className="rounded-full bg-[var(--fc-surface-elevated)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)]">
                  {activeInCat}/3
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 sm:pl-14">
                {category.keys.map((key, idx) => {
                  const channel = channels[idx];
                  const Icon = channel.icon;
                  const checked = (notifications as any)[key] || false;
                  return (
                    <label
                      key={key}
                      className={`group flex cursor-pointer flex-col gap-2 rounded-xl border p-3 transition-all hover:-translate-y-0.5 hover:shadow-md ${
                        checked
                          ? 'border-[#8b7cf6] bg-[#8b7cf6]/[0.08]'
                          : 'border-[var(--fc-glass-border)] bg-[var(--fc-surface-elevated)] hover:border-[#8b7cf6]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon size={15} className={`transition-colors ${checked ? 'text-[#8b7cf6]' : 'text-[var(--text-secondary)] group-hover:text-[#8b7cf6]'}`} />
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => updateNotification(key, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-300 dark:bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#8b7cf6]"></div>
                        </div>
                      </div>
                      <div className="leading-tight">
                        <span className="block text-xs font-semibold text-[var(--foreground)]">{channel.key}</span>
                        <span className="block text-[10px] text-[var(--text-secondary)]">{channel.hint}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
            );
          })}
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
