'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, Edit3, Trash2, Save, X, Eye, Package, 
  ArrowUp, ArrowDown, CheckCircle, AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ui/ConfirmDialog';

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  mainImage?: string;
}

export default function CuratedCollectionsPage() {
  const { showConfirm } = useConfirm();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [collectionProducts, setCollectionProducts] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    coverImage: '',
    isActive: true,
  });

  useEffect(() => {
    fetchCollections();
    fetchProducts();
  }, []);

  const fetchCollections = async () => {
    try {
      const res = await fetch('/api/admin/collections');
      if (res.ok) {
        const data = await res.json();
        setCollections(data.collections || []);
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products?limit=100');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCollectionProducts = async (collectionId: string) => {
    try {
      const res = await fetch(`/api/admin/collections/${collectionId}/products`);
      if (res.ok) {
        const data = await res.json();
        setCollectionProducts(data.productIds || []);
      }
    } catch (error) {
      console.error('Error fetching collection products:', error);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.slug) {
      toast.error('Заполните название и slug');
      return;
    }

    try {
      const res = await fetch('/api/admin/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success('Подборка создана');
        setShowForm(false);
        setFormData({ name: '', slug: '', description: '', coverImage: '', isActive: true });
        fetchCollections();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Ошибка создания');
      }
    } catch (error) {
      console.error('Error creating collection:', error);
      toast.error('Ошибка создания подборки');
    }
  };

  const handleUpdate = async () => {
    if (!editingCollection) return;

    try {
      const res = await fetch(`/api/admin/collections/${editingCollection.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCollection),
      });

      if (res.ok) {
        toast.success('Подборка обновлена');
        setEditingCollection(null);
        fetchCollections();
      } else {
        toast.error('Ошибка обновления');
      }
    } catch (error) {
      console.error('Error updating collection:', error);
      toast.error('Ошибка обновления подборки');
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
      const res = await fetch(`/api/admin/collections/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Подборка удалена');
        fetchCollections();
      } else {
        toast.error('Ошибка удаления');
      }
    } catch (error) {
      console.error('Error deleting collection:', error);
      toast.error('Ошибка удаления подборки');
    }
  };

  const handleSelectCollection = (id: string) => {
    setSelectedCollection(id);
    fetchCollectionProducts(id);
  };

  const toggleProduct = (productId: string) => {
    setCollectionProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const saveCollectionProducts = async () => {
    if (!selectedCollection) return;

    try {
      const res = await fetch(`/api/admin/collections/${selectedCollection}/products`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: collectionProducts }),
      });

      if (res.ok) {
        toast.success('Товары сохранены');
      } else {
        toast.error('Ошибка сохранения');
      }
    } catch (error) {
      console.error('Error saving collection products:', error);
      toast.error('Ошибка сохранения товаров');
    }
  };

  const moveProduct = (index: number, direction: 'up' | 'down') => {
    const newProducts = [...collectionProducts];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= newProducts.length) return;
    
    [newProducts[index], newProducts[newIndex]] = [newProducts[newIndex], newProducts[index]];
    setCollectionProducts(newProducts);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-[var(--admin-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--admin-text)]">Кураторские подборки</h1>
          <p className="text-[var(--admin-text-muted)] mt-1">
            Создавайте ручные подборки товаров для рекомендаций
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-[var(--admin-accent)] text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-all"
        >
          <Plus className="w-5 h-5" />
          Создать подборку
        </button>
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[var(--admin-bg-elevated)] border border-[var(--admin-border)] rounded-2xl p-6 w-full max-w-lg shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[var(--admin-text)]">Новая подборка</h2>
              <button onClick={() => setShowForm(false)} className="text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--admin-text-muted)] mb-2">
                  Название *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-[var(--admin-bg-muted)] border border-[var(--admin-border)] text-[var(--admin-text)] rounded-lg outline-none focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/40"
                  placeholder="Например: Выбор редакции"
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
                  className="w-full px-4 py-2 bg-[var(--admin-bg-muted)] border border-[var(--admin-border)] text-[var(--admin-text)] rounded-lg outline-none focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/40"
                  placeholder="editors-choice"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--admin-text-muted)] mb-2">
                  Описание
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-[var(--admin-bg-muted)] border border-[var(--admin-border)] text-[var(--admin-text)] rounded-lg outline-none focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/40"
                  rows={3}
                  placeholder="Описание подборки..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--admin-text-muted)] mb-2">
                  URL обложки
                </label>
                <input
                  type="url"
                  value={formData.coverImage}
                  onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                  className="w-full px-4 py-2 bg-[var(--admin-bg-muted)] border border-[var(--admin-border)] text-[var(--admin-text)] rounded-lg outline-none focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/40"
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 accent-[var(--admin-accent)] rounded focus:ring-[var(--admin-accent)]"
                />
                <label htmlFor="isActive" className="text-sm text-[var(--admin-text-muted)]">
                  Активна
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreate}
                className="flex-1 bg-[var(--admin-accent)] text-white py-2 rounded-lg font-medium hover:opacity-90 transition-all"
              >
                Создать
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text)] py-2 rounded-lg font-medium hover:bg-[var(--admin-card-hover)] transition-all"
              >
                Отмена
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Collections List */}
      <div className="grid gap-4">
        {collections.map((collection) => (
          <motion.div
            key={collection.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-[var(--admin-card)] rounded-2xl p-6 border-2 transition-all ${
              selectedCollection === collection.id
                ? 'border-[var(--admin-accent)] shadow-lg shadow-[var(--admin-accent)]/20'
                : 'border-[var(--admin-border)] hover:border-[var(--admin-accent)]/50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-[var(--admin-text)]">
                    {collection.name}
                  </h3>
                  {collection.isActive ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-[var(--admin-text-faint)]" />
                  )}
                </div>
                <p className="text-sm text-[var(--admin-text-muted)] mb-2">
                  Slug: <code className="bg-[var(--admin-bg-muted)] px-2 py-1 rounded">{collection.slug}</code>
                </p>
                {collection.description && (
                  <p className="text-sm text-[var(--admin-text-muted)]">{collection.description}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSelectCollection(collection.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--admin-bg-muted)] text-[var(--admin-accent)] rounded-lg hover:bg-[var(--admin-card-hover)] transition-colors"
                >
                  <Package className="w-4 h-4" />
                  Товары
                </button>
                <button
                  onClick={() => setEditingCollection(collection)}
                  className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(collection.id)}
                  className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {collections.length === 0 && (
          <div className="text-center py-12 bg-[var(--admin-card)] rounded-2xl border-2 border-dashed border-[var(--admin-border)]">
            <Package className="w-12 h-12 text-[var(--admin-text-faint)] mx-auto mb-4" />
            <p className="text-[var(--admin-text-muted)]">Нет созданных подборок</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-[var(--admin-accent)] hover:opacity-90 font-medium"
            >
              Создать первую подборку
            </button>
          </div>
        )}
      </div>

      {/* Products Manager */}
      {selectedCollection && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--admin-card)] rounded-2xl p-6 border-2 border-[var(--admin-accent)] shadow-lg"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-[var(--admin-text)]">Управление товарами</h3>
              <p className="text-sm text-[var(--admin-text-muted)]">
                Выберите товары для этой подборки ({collectionProducts.length} выбрано)
              </p>
            </div>
            <button
              onClick={saveCollectionProducts}
              className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-all"
            >
              <Save className="w-5 h-5" />
              Сохранить
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
            {products.map((product) => {
              const isSelected = collectionProducts.includes(product.id);
              return (
                <div
                  key={product.id}
                  onClick={() => toggleProduct(product.id)}
                  className={`relative cursor-pointer rounded-xl border-2 transition-all p-3 ${
                    isSelected
                      ? 'border-[var(--admin-accent)] bg-[var(--admin-accent)]/10'
                      : 'border-[var(--admin-border)] hover:border-[var(--admin-accent)]/50'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-[var(--admin-accent)] rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  {product.mainImage && (
                    <img
                      src={product.mainImage}
                      alt={product.name}
                      className="w-full aspect-square object-cover rounded-lg mb-2"
                    />
                  )}
                  
                  <h4 className="text-sm font-medium text-[var(--admin-text)] line-clamp-2">
                    {product.name}
                  </h4>
                  <p className="text-sm font-bold text-[var(--admin-accent)] mt-1">
                    {product.price.toLocaleString('ru-RU')} ₽
                  </p>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
