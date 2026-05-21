'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Save, X, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import AdminShell from '@/components/admin/AdminShell';

interface ShopCoupon {
  id: string;
  name: string;
  description: string;
  discount: number;
  discountType: 'percent' | 'fixed';
  couponCode: string;
  priceCoins: number;
  stock: number | null;
  maxUses: number;
  expiresDays: number;
  minOrder: number | null;
  isActive: boolean;
  purchasedCount?: number;
}

export default function AdminShopCouponsPage() {
  const [coupons, setCoupons] = useState<ShopCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<Partial<ShopCoupon>>({
    name: '',
    description: '',
    discount: 10,
    discountType: 'percent',
    couponCode: '',
    priceCoins: 100,
    stock: null,
    maxUses: 1,
    expiresDays: 30,
    minOrder: null,
    isActive: true,
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const res = await fetch('/api/admin/shop-coupons');
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons || []);
      } else {
        toast.error('Ошибка загрузки данных');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      const res = await fetch('/api/admin/shop-coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success('Промокод добавлен');
        setShowAddForm(false);
        resetForm();
        fetchCoupons();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Ошибка добавления');
      }
    } catch (error) {
      toast.error('Ошибка сети');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/shop-coupons/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success('Изменения сохранены');
        setEditingId(null);
        resetForm();
        fetchCoupons();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Ошибка обновления');
      }
    } catch (error) {
      toast.error('Ошибка сети');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить этот промокод из магазина?')) return;

    try {
      const res = await fetch(`/api/admin/shop-coupons/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Промокод удалён');
        fetchCoupons();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Ошибка удаления');
      }
    } catch (error) {
      toast.error('Ошибка сети');
    }
  };

  const handleResetPurchases = async (id: string) => {
    if (!confirm('Сбросить все покупки этого промокода? Пользователи смогут купить его снова.')) return;

    try {
      const res = await fetch(`/api/admin/shop-coupons/${id}/reset`, {
        method: 'POST',
      });

      if (res.ok) {
        toast.success('Покупки сброшены');
        fetchCoupons();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Ошибка сброса');
      }
    } catch (error) {
      toast.error('Ошибка сети');
    }
  };

  const startEdit = (coupon: ShopCoupon) => {
    setEditingId(coupon.id);
    setFormData({
      name: coupon.name,
      description: coupon.description,
      discount: coupon.discount,
      discountType: coupon.discountType,
      couponCode: coupon.couponCode,
      priceCoins: coupon.priceCoins,
      stock: coupon.stock,
      maxUses: coupon.maxUses,
      expiresDays: coupon.expiresDays,
      minOrder: coupon.minOrder,
      isActive: coupon.isActive,
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      discount: 10,
      discountType: 'percent',
      couponCode: '',
      priceCoins: 100,
      stock: null,
      maxUses: 1,
      expiresDays: 30,
      minOrder: null,
      isActive: true,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <AdminShell>
      <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Магазин промокодов</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Управление товарами в магазине за монеты</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          <Plus size={20} />
          Добавить товар
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg mb-6 border border-gray-200 dark:border-gray-700"
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Новый товар</h2>
          <CouponForm
            data={formData}
            onChange={setFormData}
            onSave={handleAdd}
            onCancel={() => { setShowAddForm(false); resetForm(); }}
          />
        </motion.div>
      )}

      {/* Coupons List */}
      <div className="grid gap-4">
        {coupons.map((coupon) => (
          <motion.div
            key={coupon.id}
            layout
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700"
          >
            {editingId === coupon.id ? (
              <CouponForm
                data={formData}
                onChange={setFormData}
                onSave={() => handleUpdate(coupon.id)}
                onCancel={() => { setEditingId(null); resetForm(); }}
              />
            ) : (
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{coupon.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      coupon.isActive 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {coupon.isActive ? 'Активен' : 'Неактивен'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{coupon.description}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Код:</span>
                      <p className="font-mono font-semibold text-purple-600 dark:text-purple-400">{coupon.couponCode}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Скидка:</span>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {coupon.discount}{coupon.discountType === 'percent' ? '%' : '₽'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Цена:</span>
                      <p className="font-semibold text-purple-600 dark:text-purple-400">{coupon.priceCoins} 💰</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Остаток:</span>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {coupon.stock === null ? '∞' : coupon.stock}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Макс. использований:</span>
                      <p className="font-semibold text-gray-900 dark:text-white">{coupon.maxUses}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Куплено:</span>
                      <p className="font-semibold text-gray-900 dark:text-white">{coupon.purchasedCount || 0}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Срок:</span>
                      <p className="font-semibold text-gray-900 dark:text-white">{coupon.expiresDays} дней</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Мин. заказ:</span>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {coupon.minOrder ? `${coupon.minOrder} ₽` : 'Нет'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => startEdit(coupon)}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Редактировать"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleResetPurchases(coupon.id)}
                    className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                    title="Сбросить покупки"
                  >
                    <RefreshCw size={18} />
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
            )}
          </motion.div>
        ))}

        {coupons.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <AlertTriangle size={48} className="mx-auto mb-4 opacity-20" />
            <p>Нет товаров в магазине</p>
          </div>
        )}
      </div>
    </div>
    </AdminShell>
  );
}

interface CouponFormProps {
  data: Partial<ShopCoupon>;
  onChange: (data: Partial<ShopCoupon>) => void;
  onSave: () => void;
  onCancel: () => void;
}

function CouponForm({ data, onChange, onSave, onCancel }: CouponFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Название</label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => onChange({ ...data, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Например: Скидка 10%"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Код промокода</label>
          <input
            type="text"
            value={data.couponCode}
            onChange={(e) => onChange({ ...data, couponCode: e.target.value.toUpperCase() })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
            placeholder="SUMMER2024"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Описание</label>
        <textarea
          value={data.description}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
          placeholder="Краткое описание промокода..."
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Скидка</label>
          <input
            type="number"
            value={data.discount}
            onChange={(e) => onChange({ ...data, discount: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Тип скидки</label>
          <select
            value={data.discountType}
            onChange={(e) => onChange({ ...data, discountType: e.target.value as 'percent' | 'fixed' })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="percent">Процент (%)</option>
            <option value="fixed">Фиксированная (₽)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Цена в монетах</label>
          <input
            type="number"
            value={data.priceCoins}
            onChange={(e) => onChange({ ...data, priceCoins: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Остаток (пусто = ∞)</label>
          <input
            type="number"
            value={data.stock ?? ''}
            onChange={(e) => onChange({ ...data, stock: e.target.value ? Number(e.target.value) : null })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="∞"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Макс. использований</label>
          <input
            type="number"
            value={data.maxUses}
            onChange={(e) => onChange({ ...data, maxUses: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Срок действия (дни)</label>
          <input
            type="number"
            value={data.expiresDays}
            onChange={(e) => onChange({ ...data, expiresDays: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Мин. заказ (пусто = нет)</label>
          <input
            type="number"
            value={data.minOrder ?? ''}
            onChange={(e) => onChange({ ...data, minOrder: e.target.value ? Number(e.target.value) : null })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="0"
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.isActive}
              onChange={(e) => onChange({ ...data, isActive: e.target.checked })}
              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Активен</span>
          </label>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={onSave}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          <Save size={18} />
          Сохранить
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
        >
          <X size={18} />
          Отмена
        </button>
      </div>
    </div>
  );
}
