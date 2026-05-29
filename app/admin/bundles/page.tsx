'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Plus, Edit, Trash2, X, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ui/ConfirmDialog';

interface Bundle {
  id: string;
  name: string;
  slug: string;
  description?: string;
  coverImage?: string;
  discountPercent: number;
  isActive: boolean;
}

export default function AdminBundlesPage() {
  const { showConfirm } = useConfirm();
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    discountPercent: 10,
    isActive: true,
  });

  useEffect(() => {
    fetchBundles();
  }, []);

  const fetchBundles = async () => {
    try {
      const res = await fetch('/api/admin/bundles');
      if (res.ok) {
        const data = await res.json();
        setBundles(data.bundles || []);
      }
    } catch (error) {
      console.error('Error fetching bundles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.slug) {
      toast.error('Заполните название и slug');
      return;
    }

    try {
      const url = editingBundle
        ? `/api/admin/bundles/${editingBundle.id}`
        : '/api/admin/bundles';

      const method = editingBundle ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingBundle ? 'Подборка обновлена' : 'Подборка создана');
        setShowForm(false);
        setEditingBundle(null);
        setFormData({
          name: '',
          slug: '',
          description: '',
          discountPercent: 10,
          isActive: true,
        });
        fetchBundles();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Ошибка при сохранении');
      }
    } catch (error) {
      toast.error('Ошибка при сохранении');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm({
      title: 'Удаление подборки',
      message: 'Удалить эту подборку?',
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      variant: 'danger',
    });
    
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/bundles/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Подборка удалена');
        fetchBundles();
      }
    } catch (error) {
      toast.error('Ошибка при удалении');
    }
  };

  const startEdit = (bundle: Bundle) => {
    setEditingBundle(bundle);
    setFormData({
      name: bundle.name,
      slug: bundle.slug,
      description: bundle.description || '',
      discountPercent: bundle.discountPercent,
      isActive: bundle.isActive,
    });
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-[var(--admin-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--admin-text)]">
            Комплектные предложения
          </h1>
          <p className="text-[var(--admin-text-muted)] mt-1">
            Создавайте наборы товаров со скидкой
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-[var(--admin-accent)] text-white px-6 py-3 rounded-xl font-semibold transition-all hover:opacity-90 shadow-lg hover:shadow-xl"
        >
          <Plus size={20} />
          Создать набор
        </button>
      </div>

      {/* Bundles List */}
      <div className="grid gap-4">
        {bundles.length === 0 ? (
          <div className="bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-2xl p-12 text-center">
            <Package className="w-16 h-16 mx-auto text-[var(--admin-text-faint)] mb-4" />
            <h3 className="text-xl font-semibold text-[var(--admin-text)] mb-2">
              Нет комплектных предложений
            </h3>
            <p className="text-[var(--admin-text-muted)]">
              Создайте первый набор товаров со скидкой
            </p>
          </div>
        ) : (
          bundles.map((bundle) => (
            <motion.div
              key={bundle.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-2xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-[var(--admin-text)]">
                      {bundle.name}
                    </h3>
                    <span className="px-3 py-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-full text-sm font-semibold">
                      -{bundle.discountPercent}%
                    </span>
                    {!bundle.isActive && (
                      <span className="px-3 py-1 bg-[var(--admin-bg-muted)] text-[var(--admin-text-muted)] rounded-full text-sm">
                        Неактивен
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--admin-text-muted)]">
                    /bundles/{bundle.slug}
                  </p>
                  {bundle.description && (
                    <p className="text-sm text-[var(--admin-text-muted)] mt-2">
                      {bundle.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEdit(bundle)}
                    className="p-2 hover:bg-[var(--admin-card-hover)] rounded-lg transition-colors"
                  >
                    <Edit size={20} className="text-[var(--admin-text-muted)]" />
                  </button>
                  <button
                    onClick={() => handleDelete(bundle.id)}
                    className="p-2 hover:bg-rose-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={20} className="text-rose-600 dark:text-rose-400" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--admin-bg-elevated)] border border-[var(--admin-border)] rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[var(--admin-text)]">
                {editingBundle ? 'Редактировать набор' : 'Создать набор'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingBundle(null);
                }}
                className="p-2 hover:bg-[var(--admin-card-hover)] rounded-lg transition-colors text-[var(--admin-text-muted)]"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[var(--admin-text-muted)] mb-2">
                  Название *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--admin-bg-muted)] border border-[var(--admin-border)] text-[var(--admin-text)] outline-none focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/40"
                  placeholder="Например: Летний образ"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--admin-text-muted)] mb-2">
                  Slug *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--admin-bg-muted)] border border-[var(--admin-border)] text-[var(--admin-text)] outline-none focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/40"
                  placeholder="summer-look"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--admin-text-muted)] mb-2">
                  Описание
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--admin-bg-muted)] border border-[var(--admin-border)] text-[var(--admin-text)] outline-none focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/40 resize-none"
                  placeholder="Описание набора..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--admin-text-muted)] mb-2">
                  Скидка (%)
                </label>
                <input
                  type="number"
                  value={formData.discountPercent}
                  onChange={(e) => setFormData({ ...formData, discountPercent: Number(e.target.value) })}
                  min="0"
                  max="100"
                  className="w-full px-4 py-3 rounded-xl bg-[var(--admin-bg-muted)] border border-[var(--admin-border)] text-[var(--admin-text)] outline-none focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/40"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 rounded border-[var(--admin-border)] text-[var(--admin-accent)] focus:ring-[var(--admin-accent)]"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-[var(--admin-text-muted)]">
                  Активен
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingBundle(null);
                  }}
                  className="flex-1 px-6 py-3 border border-[var(--admin-border)] bg-[var(--admin-card)] rounded-xl font-semibold text-[var(--admin-text)] hover:bg-[var(--admin-card-hover)] transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 bg-[var(--admin-accent)] text-white px-6 py-3 rounded-xl font-semibold transition-all hover:opacity-90 shadow-lg"
                >
                  <Save size={20} />
                  Сохранить
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
