'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Save, X, Tag, Percent, Calendar, Users, CheckCircle, XCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';
import AdminShell from '@/components/admin/AdminShell';

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

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    discount: '',
    type: 'percent' as 'percent' | 'fixed',
    minOrder: '',
    maxUses: '',
    expiresAt: '',
    active: true
  });

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      const res = await fetch('/api/admin/coupons', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setCoupons(data.coupons || []);
    } catch (error) {
      toast.error('Ошибка загрузки купонов');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code || !formData.discount) {
      toast.error('Заполните обязательные поля');
      return;
    }

    try {
      const url = editingCoupon 
        ? `/api/admin/coupons/${editingCoupon.id}`
        : '/api/admin/coupons';
      
      const method = editingCoupon ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          code: formData.code.toUpperCase(),
          discount: parseInt(formData.discount),
          type: formData.type,
          minOrder: formData.minOrder ? parseFloat(formData.minOrder) : null,
          maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
          expiresAt: formData.expiresAt || null,
          active: formData.active
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Ошибка сохранения');
      }

      toast.success(editingCoupon ? 'Купон обновлён' : 'Купон создан');
      setShowForm(false);
      setEditingCoupon(null);
      resetForm();
      loadCoupons();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить купон?')) return;
    
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!res.ok) throw new Error('Failed to delete');
      
      toast.success('Купон удалён');
      loadCoupons();
    } catch (error) {
      toast.error('Ошибка удаления');
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount: coupon.discount.toString(),
      type: coupon.type,
      minOrder: coupon.minOrder || '',
      maxUses: coupon.maxUses?.toString() || '',
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split('T')[0] : '',
      active: coupon.active
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discount: '',
      type: 'percent',
      minOrder: '',
      maxUses: '',
      expiresAt: '',
      active: true
    });
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Код скопирован!');
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Промокоды</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Всего: {coupons.length} | Активных: {coupons.filter(c => c.active).length}
            </p>
          </div>
          <button
            onClick={() => {
              setEditingCoupon(null);
              resetForm();
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            <Plus size={18} />
            Создать купон
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingCoupon ? 'Редактировать купон' : 'Новый купон'}
                </h2>
                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Код купона *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    placeholder="SUMMER2024"
                    className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Тип скидки *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value as 'percent' | 'fixed'})}
                      className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="percent">Процент (%)</option>
                      <option value="fixed">Фиксированная сумма (₽)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Размер скидки *
                    </label>
                    <input
                      type="number"
                      value={formData.discount}
                      onChange={(e) => setFormData({...formData, discount: e.target.value})}
                      placeholder={formData.type === 'percent' ? '10' : '500'}
                      min={formData.type === 'percent' ? '1' : '1'}
                      max={formData.type === 'percent' ? '100' : undefined}
                      className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Минимальная сумма заказа (₽)
                  </label>
                  <input
                    type="number"
                    value={formData.minOrder}
                    onChange={(e) => setFormData({...formData, minOrder: e.target.value})}
                    placeholder="1000"
                    min="0"
                    className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Макс. использований
                    </label>
                    <input
                      type="number"
                      value={formData.maxUses}
                      onChange={(e) => setFormData({...formData, maxUses: e.target.value})}
                      placeholder="∞"
                      min="1"
                      className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Срок действия
                    </label>
                    <input
                      type="date"
                      value={formData.expiresAt}
                      onChange={(e) => setFormData({...formData, expiresAt: e.target.value})}
                      className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) => setFormData({...formData, active: e.target.checked})}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="active" className="text-sm text-gray-700 dark:text-gray-300">
                    Активен
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-4 py-2 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all"
                  >
                    <Save size={18} />
                    Сохранить
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Coupons List */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Загрузка...</div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-12">
            <Tag size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">Нет созданных купонов</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {coupons.map((coupon) => {
              const expired = isExpired(coupon.expiresAt);
              const usagePercent = coupon.maxUses ? (coupon.usedCount / coupon.maxUses) * 100 : 0;
              
              return (
                <motion.div
                  key={coupon.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white dark:bg-gray-800 rounded-xl p-5 border-2 ${
                    !coupon.active || expired 
                      ? 'border-gray-200 dark:border-gray-700 opacity-60' 
                      : 'border-purple-200 dark:border-purple-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg">
                          <Tag size={16} className="text-purple-600" />
                          <span className="font-mono font-bold text-lg text-purple-700 dark:text-purple-400">
                            {coupon.code}
                          </span>
                          <button
                            onClick={() => copyToClipboard(coupon.code)}
                            className="p-1 hover:bg-white/50 rounded"
                            title="Копировать"
                          >
                            <Copy size={14} className="text-purple-600" />
                          </button>
                        </div>
                        {coupon.active && !expired ? (
                          <CheckCircle size={18} className="text-green-500" />
                        ) : (
                          <XCircle size={18} className="text-red-500" />
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          {coupon.type === 'percent' ? <Percent size={14} /> : <span className="font-bold">₽</span>}
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {coupon.type === 'percent' ? `${coupon.discount}%` : `${coupon.discount} ₽`}
                          </span>
                        </div>
                        
                        {coupon.minOrder && (
                          <div>Мин. заказ: {parseInt(coupon.minOrder).toLocaleString('ru-RU')} ₽</div>
                        )}
                        
                        {coupon.maxUses && (
                          <div className="flex items-center gap-1">
                            <Users size={14} />
                            {coupon.usedCount}/{coupon.maxUses}
                          </div>
                        )}
                        
                        {coupon.expiresAt && (
                          <div className={`flex items-center gap-1 ${expired ? 'text-red-500' : ''}`}>
                            <Calendar size={14} />
                            {new Date(coupon.expiresAt).toLocaleDateString('ru-RU')}
                            {expired && ' (истёк)'}
                          </div>
                        )}
                      </div>

                      {coupon.maxUses && (
                        <div className="mt-3">
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                              style={{ width: `${usagePercent}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(coupon)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Редактировать"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(coupon.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Удалить"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
