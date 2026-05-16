'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, Edit3, Trash2, Save, X, Eye, Package, 
  ArrowUp, ArrowDown, CheckCircle, AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner';

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
    if (!confirm('Удалить эту подборку?')) return;

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
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Кураторские подборки</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Создавайте ручные подборки товаров для рекомендаций
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all"
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
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Новая подборка</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Название *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Например: Выбор редакции"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Slug *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  placeholder="editors-choice"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Описание
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  rows={3}
                  placeholder="Описание подборки..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  URL обложки
                </label>
                <input
                  type="url"
                  value={formData.coverImage}
                  onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
                  Активна
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreate}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded-lg font-medium hover:shadow-lg transition-all"
              >
                Создать
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
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
            className={`bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 transition-all ${
              selectedCollection === collection.id
                ? 'border-purple-500 shadow-lg shadow-purple-500/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {collection.name}
                  </h3>
                  {collection.isActive ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Slug: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{collection.slug}</code>
                </p>
                {collection.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{collection.description}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSelectCollection(collection.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                >
                  <Package className="w-4 h-4" />
                  Товары
                </button>
                <button
                  onClick={() => setEditingCollection(collection)}
                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(collection.id)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {collections.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Нет созданных подборок</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-purple-600 hover:text-purple-700 font-medium"
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
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-purple-500 shadow-lg"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Управление товарами</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Выберите товары для этой подборки ({collectionProducts.length} выбрано)
              </p>
            </div>
            <button
              onClick={saveCollectionProducts}
              className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all"
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
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
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
                  
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                    {product.name}
                  </h4>
                  <p className="text-sm font-bold text-purple-600 mt-1">
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
