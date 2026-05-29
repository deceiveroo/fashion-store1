'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Tag, 
  ShoppingCart, 
  Mail, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  CheckCircle,
  TrendingUp,
  Users,
  DollarSign,
  Clock
} from 'lucide-react';
import { useConfirm } from '@/components/ui/ConfirmDialog';

interface Coupon {
  id: string;
  code: string;
  discount: number;
  type: 'percent' | 'fixed';
  minOrder?: string;
  maxUses?: number;
  usedCount: number;
  active: boolean;
  expiresAt?: string;
  createdAt: string;
}

interface AbandonedCart {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  totalAmount: string;
  itemCount: number;
  createdAt: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  category: string;
  active: boolean;
  variables?: string[];
}

export default function MarketingPage() {
  const { showConfirm } = useConfirm();
  const [activeTab, setActiveTab] = useState<'coupons' | 'abandoned' | 'email'>('coupons');
  
  // Coupons state
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  
  // Abandoned carts state
  const [abandonedCarts, setAbandonedCarts] = useState<AbandonedCart[]>([]);
  
  // Email templates state
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);

  // Fetch data
  useEffect(() => {
    if (activeTab === 'coupons') fetchCoupons();
    else if (activeTab === 'abandoned') fetchAbandonedCarts();
    else if (activeTab === 'email') fetchEmailTemplates();
  }, [activeTab]);

  const fetchCoupons = async () => {
    try {
      const response = await fetch('/api/admin/coupons');
      if (response.ok) {
        const data = await response.json();
        setCoupons(data.coupons || []);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
    }
  };

  const fetchAbandonedCarts = async () => {
    try {
      const response = await fetch('/api/admin/abandoned-carts');
      if (response.ok) {
        const data = await response.json();
        setAbandonedCarts(data.abandonedCarts || []);
      }
    } catch (error) {
      console.error('Error fetching abandoned carts:', error);
    }
  };

  const fetchEmailTemplates = async () => {
    try {
      const response = await fetch('/api/admin/email-templates');
      if (response.ok) {
        const data = await response.json();
        setEmailTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error fetching email templates:', error);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    const confirmed = await showConfirm({
      title: 'Удаление купона',
      message: 'Удалить этот купон?',
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      variant: 'danger',
    });
    
    if (!confirmed) return;
    
    try {
      const response = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        alert('Купон удален');
        fetchCoupons();
      }
    } catch (error) {
      console.error('Error deleting coupon:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Скопировано!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--admin-text)]">Маркетинг</h1>
          <p className="text-[var(--admin-text-muted)] mt-1">Управление купонами, брошенными корзинами и email рассылками</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-[var(--admin-border)]">
        <button
          onClick={() => setActiveTab('coupons')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'coupons'
              ? 'text-[var(--admin-accent)] border-b-2 border-[var(--admin-accent)]'
              : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]'
          }`}
        >
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Купоны ({coupons.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('abandoned')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'abandoned'
              ? 'text-[var(--admin-accent)] border-b-2 border-[var(--admin-accent)]'
              : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]'
          }`}
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Брошенные корзины ({abandonedCarts.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('email')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'email'
              ? 'text-[var(--admin-accent)] border-b-2 border-[var(--admin-accent)]'
              : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]'
          }`}
        >
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email шаблоны ({emailTemplates.length})
          </div>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'coupons' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-[var(--admin-text)]">Активные купоны</h2>
            <button
              onClick={() => {
                setEditingCoupon(null);
                setShowCouponModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--admin-accent)] hover:opacity-90 text-white font-medium rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Создать купон
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.map((coupon) => (
              <motion.div
                key={coupon.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[var(--admin-card)] backdrop-blur-sm border border-[var(--admin-border)] rounded-xl p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[var(--admin-accent)] rounded-lg flex items-center justify-center">
                      <Tag className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[var(--admin-text)] font-mono">{coupon.code}</h3>
                      <p className="text-sm text-[var(--admin-text-muted)]">
                        {coupon.type === 'percent' ? `${coupon.discount}% скидка` : `${coupon.discount}₽ скидка`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToClipboard(coupon.code)}
                      className="p-2 hover:bg-[var(--admin-card-hover)] rounded-lg transition-colors"
                      title="Копировать код"
                    >
                      <Copy className="w-4 h-4 text-[var(--admin-text-muted)]" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingCoupon(coupon);
                        setShowCouponModal(true);
                      }}
                      className="p-2 hover:bg-[var(--admin-card-hover)] rounded-lg transition-colors"
                      title="Редактировать"
                    >
                      <Edit className="w-4 h-4 text-[var(--admin-accent)]" />
                    </button>
                    <button
                      onClick={() => handleDeleteCoupon(coupon.id)}
                      className="p-2 hover:bg-[var(--admin-card-hover)] rounded-lg transition-colors"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4 text-rose-400" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {coupon.minOrder && (
                    <div className="flex items-center gap-2 text-[var(--admin-text-muted)]">
                      <DollarSign className="w-4 h-4" />
                      Мин. заказ: {coupon.minOrder}₽
                    </div>
                  )}
                  {coupon.maxUses && (
                    <div className="flex items-center gap-2 text-[var(--admin-text-muted)]">
                      <Users className="w-4 h-4" />
                      Использовано: {coupon.usedCount}/{coupon.maxUses}
                    </div>
                  )}
                  {coupon.expiresAt && (
                    <div className="flex items-center gap-2 text-[var(--admin-text-muted)]">
                      <Clock className="w-4 h-4" />
                      Истекает: {new Date(coupon.expiresAt).toLocaleDateString('ru-RU')}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    {coupon.active ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">Активен</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 text-[var(--admin-text-faint)]" />
                        <span className="text-[var(--admin-text-faint)]">Неактивен</span>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {coupons.length === 0 && (
            <div className="text-center py-12">
              <Tag className="w-16 h-16 text-[var(--admin-text-faint)] mx-auto mb-4" />
              <p className="text-[var(--admin-text-muted)]">Нет активных купонов</p>
              <button
                onClick={() => setShowCouponModal(true)}
                className="mt-4 px-6 py-2 bg-[var(--admin-accent)] hover:opacity-90 text-white font-medium rounded-lg transition-colors"
              >
                Создать первый купон
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'abandoned' && (
        <div>
          <h2 className="text-xl font-semibold text-[var(--admin-text)] mb-6">Брошенные корзины</h2>

          {abandonedCarts.length > 0 ? (
            <div className="bg-[var(--admin-card)] backdrop-blur-sm border border-[var(--admin-border)] rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-[var(--admin-bg-muted)]">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[var(--admin-text-muted)]">Клиент</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[var(--admin-text-muted)]">Товары</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[var(--admin-text-muted)]">Сумма</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[var(--admin-text-muted)]">Время</th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-[var(--admin-text-muted)]">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--admin-border)]">
                  {abandonedCarts.map((cart) => (
                    <tr key={cart.id} className="hover:bg-[var(--admin-card-hover)] transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-[var(--admin-text)] font-medium">{cart.userName || 'Гость'}</p>
                          <p className="text-sm text-[var(--admin-text-muted)]">{cart.userEmail}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[var(--admin-text)]">{cart.itemCount} товаров</td>
                      <td className="px-6 py-4 text-[var(--admin-text)] font-semibold">{cart.totalAmount}₽</td>
                      <td className="px-6 py-4 text-[var(--admin-text-muted)]">
                        {new Date(cart.createdAt).toLocaleString('ru-RU')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-[var(--admin-accent)] hover:opacity-80 text-sm">
                          Отправить напоминание
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-[var(--admin-text-faint)] mx-auto mb-4" />
              <p className="text-[var(--admin-text-muted)]">Нет брошенных корзин</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'email' && (
        <div>
          <h2 className="text-xl font-semibold text-[var(--admin-text)] mb-6">Email шаблоны</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {emailTemplates.map((template) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[var(--admin-card)] backdrop-blur-sm border border-[var(--admin-border)] rounded-xl p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--admin-text)]">{template.name}</h3>
                    <p className="text-sm text-[var(--admin-text-muted)] mt-1">{template.subject}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    template.category === 'marketing' ? 'bg-purple-500/20 text-purple-400' :
                    template.category === 'transactional' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {template.category}
                  </span>
                </div>

                {template.variables && template.variables.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-[var(--admin-text-faint)] mb-2">Переменные:</p>
                    <div className="flex flex-wrap gap-2">
                      {template.variables.map((variable) => (
                        <span key={variable} className="px-2 py-1 bg-[var(--admin-bg-muted)] rounded text-xs text-[var(--admin-text-muted)] font-mono">
                          {`{{${variable}}}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button className="flex-1 px-4 py-2 bg-[var(--admin-accent)] hover:opacity-90 text-white font-medium rounded-lg transition-colors text-sm">
                    Редактировать
                  </button>
                  <button className="px-4 py-2 border border-[var(--admin-border)] bg-[var(--admin-card)] hover:bg-[var(--admin-card-hover)] text-[var(--admin-text)] rounded-lg transition-colors text-sm">
                    Предпросмотр
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {emailTemplates.length === 0 && (
            <div className="text-center py-12">
              <Mail className="w-16 h-16 text-[var(--admin-text-faint)] mx-auto mb-4" />
              <p className="text-[var(--admin-text-muted)]">Нет email шаблонов</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
