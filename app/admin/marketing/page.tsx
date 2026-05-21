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
          <h1 className="text-3xl font-bold text-white">Маркетинг</h1>
          <p className="text-gray-400 mt-1">Управление купонами, брошенными корзинами и email рассылками</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('coupons')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'coupons'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-white'
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
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-white'
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
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-white'
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
            <h2 className="text-xl font-semibold text-white">Активные купоны</h2>
            <button
              onClick={() => {
                setEditingCoupon(null);
                setShowCouponModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
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
                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Tag className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white font-mono">{coupon.code}</h3>
                      <p className="text-sm text-gray-400">
                        {coupon.type === 'percent' ? `${coupon.discount}% скидка` : `${coupon.discount}₽ скидка`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToClipboard(coupon.code)}
                      className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                      title="Копировать код"
                    >
                      <Copy className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingCoupon(coupon);
                        setShowCouponModal(true);
                      }}
                      className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                      title="Редактировать"
                    >
                      <Edit className="w-4 h-4 text-blue-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteCoupon(coupon.id)}
                      className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {coupon.minOrder && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <DollarSign className="w-4 h-4" />
                      Мин. заказ: {coupon.minOrder}₽
                    </div>
                  )}
                  {coupon.maxUses && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <Users className="w-4 h-4" />
                      Использовано: {coupon.usedCount}/{coupon.maxUses}
                    </div>
                  )}
                  {coupon.expiresAt && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock className="w-4 h-4" />
                      Истекает: {new Date(coupon.expiresAt).toLocaleDateString('ru-RU')}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    {coupon.active ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-green-400">Активен</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-500">Неактивен</span>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {coupons.length === 0 && (
            <div className="text-center py-12">
              <Tag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Нет активных купонов</p>
              <button
                onClick={() => setShowCouponModal(true)}
                className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Создать первый купон
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'abandoned' && (
        <div>
          <h2 className="text-xl font-semibold text-white mb-6">Брошенные корзины</h2>
          
          {abandonedCarts.length > 0 ? (
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Клиент</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Товары</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Сумма</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Время</th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {abandonedCarts.map((cart) => (
                    <tr key={cart.id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white font-medium">{cart.userName || 'Гость'}</p>
                          <p className="text-sm text-gray-400">{cart.userEmail}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white">{cart.itemCount} товаров</td>
                      <td className="px-6 py-4 text-white font-semibold">{cart.totalAmount}₽</td>
                      <td className="px-6 py-4 text-gray-400">
                        {new Date(cart.createdAt).toLocaleString('ru-RU')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-blue-400 hover:text-blue-300 text-sm">
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
              <ShoppingCart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Нет брошенных корзин</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'email' && (
        <div>
          <h2 className="text-xl font-semibold text-white mb-6">Email шаблоны</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {emailTemplates.map((template) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{template.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">{template.subject}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    template.category === 'marketing' ? 'bg-purple-500/20 text-purple-400' :
                    template.category === 'transactional' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {template.category}
                  </span>
                </div>
                
                {template.variables && template.variables.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Переменные:</p>
                    <div className="flex flex-wrap gap-2">
                      {template.variables.map((variable) => (
                        <span key={variable} className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300 font-mono">
                          {`{{${variable}}}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm">
                    Редактировать
                  </button>
                  <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm">
                    Предпросмотр
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {emailTemplates.length === 0 && (
            <div className="text-center py-12">
              <Mail className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Нет email шаблонов</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
