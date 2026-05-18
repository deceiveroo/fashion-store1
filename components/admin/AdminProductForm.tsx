'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  X,
  Upload,
  Save,
  Trash2,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import AdminShell from '@/components/admin/AdminShell';

export type CategoryOption = { id: string; name: string; slug: string };

export type ProductFormValues = {
  name: string;
  description: string;
  price: string;
  inStock: boolean;
  featured: boolean;
  isNew: boolean;
};

type AdminProductFormProps = {
  mode: 'create' | 'edit';
  productId?: string;
};

export default function AdminProductForm({ mode, productId }: AdminProductFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ProductFormValues>({
    name: '',
    description: '',
    price: '',
    inStock: true,
    featured: false,
    isNew: false,
  });
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    void loadCategories();
    if (mode === 'edit' && productId) void loadProduct(productId);
  }, [mode, productId]);

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/categories', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
      }
    } catch {
      toast.error('Не удалось загрузить категории');
    }
  };

  const loadProduct = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${id}`, { credentials: 'include', cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Товар не найден');
        router.push('/admin/products');
        return;
      }
      setForm({
        name: data.name ?? '',
        description: data.description ?? '',
        price: String(data.price ?? ''),
        inStock: Boolean(data.inStock),
        featured: Boolean(data.featured),
        isNew: Boolean(data.isNew),
      });
      setSelectedCategories(data.categories ?? []);
      const initialImages = data.images?.length ? data.images : data.mainImage ? [data.mainImage] : [];
      console.log('[AdminProductForm] Loaded product images:', initialImages);
      setImages(initialImages);
    } catch {
      toast.error('Ошибка загрузки');
      router.push('/admin/products');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Нужен файл изображения');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', credentials: 'include', body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        console.log('[AdminProductForm] Upload successful, URL:', data.url);
        setImages((prev) => {
          const newImages = [...prev, data.url];
          console.log('[AdminProductForm] Updated images state:', newImages);
          return newImages;
        });
        toast.success('Фото загружено');
      } else {
        toast.error(data.error || 'Ошибка загрузки');
      }
    } catch {
      toast.error('Ошибка загрузки');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const payload = () => {
    const data = {
      ...form,
      price: parseFloat(form.price),
      categories: selectedCategories,
      images: images.length > 0 ? images : ['/placeholder-image.jpg'],
    };
    console.log('[AdminProductForm] Sending payload:', JSON.stringify(data, null, 2));
    return data;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.description.trim() || !form.price) {
      toast.error('Заполните обязательные поля');
      return;
    }
    if (selectedCategories.length === 0) {
      toast.error('Выберите категорию');
      return;
    }

    setSaving(true);
    try {
      const url =
        mode === 'edit' && productId
          ? `/api/admin/products/${productId}`
          : '/api/products';
      const method = mode === 'edit' ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload()),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(mode === 'edit' ? 'Товар сохранён' : 'Товар создан');
        // Принудительно обновляем кэш перед переходом
        router.refresh();
        router.push('/admin/products');
      } else {
        toast.error(data.error || 'Ошибка сохранения');
      }
    } catch {
      toast.error('Ошибка сети');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!productId || !confirm('Скрыть товар из каталога? (мягкое удаление)')) return;
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Удалено');
        router.push('/admin/products');
      } else {
        toast.error(data.error || 'Ошибка');
      }
    } catch {
      toast.error('Ошибка сети');
    }
  };

  const title = mode === 'edit' ? 'Редактировать товар' : 'Новый товар';

  return (
    <AdminShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <motion.div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/admin/products')}
              className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-400" />
                {title}
              </h1>
              {productId && (
                <p className="text-xs text-white/40 mt-0.5 font-mono">{productId}</p>
              )}
            </div>
          </motion.div>

          <motion.div className="flex flex-wrap gap-2">
            {mode === 'edit' && productId && (
              <>
                <a
                  href={`/products/${productId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/10"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  На сайте
                </a>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400 hover:bg-red-500/20"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Удалить
                </button>
              </>
            )}
          </motion.div>
        </motion.div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <motion.div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">
            <Section title="Основное">
              <Field label="Название *">
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputCls}
                  placeholder="Платье миди Aurora"
                  required
                />
              </Field>
              <Field label="Описание *">
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  className={inputCls}
                  placeholder="Состав, крой, уход..."
                  required
                />
              </Field>
              <Field label="Цена, ₽ *">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className={inputCls}
                  placeholder="5990"
                  required
                />
              </Field>
            </Section>

            <Section title="Категории *">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {categories.map((cat) => {
                  const checked = selectedCategories.includes(cat.id);
                  return (
                    <label
                      key={cat.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-all ${
                        checked
                          ? 'border-violet-500/50 bg-violet-500/15 text-white'
                          : 'border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={() => {
                          setSelectedCategories((prev) =>
                            checked ? prev.filter((id) => id !== cat.id) : [...prev, cat.id]
                          );
                        }}
                      />
                      <span className="text-xs font-medium">{cat.name}</span>
                    </label>
                  );
                })}
              </div>
            </Section>

            <Section title="Фотографии">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://..."
                  className={`${inputCls} flex-1`}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newImageUrl.trim()) {
                      setImages((p) => [...p, newImageUrl.trim()]);
                      setNewImageUrl('');
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm text-white hover:bg-violet-500"
                >
                  <Plus className="h-4 w-4" />
                  URL
                </button>
                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-400 hover:bg-emerald-500/20">
                  <Upload className="h-4 w-4" />
                  {uploading ? '...' : 'Файл'}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {images.map((url, i) => (
                    <div key={`${url}-${i}`} className="group relative aspect-[3/4] overflow-hidden rounded-xl border border-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImages((p) => p.filter((_, idx) => idx !== i))}
                        className="absolute top-2 right-2 rounded-full bg-red-500 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      {i === 0 && (
                        <span className="absolute bottom-2 left-2 rounded bg-violet-600 px-1.5 py-0.5 text-[10px] text-white">
                          Главное
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Section>

            <Section title="Статусы">
              <div className="flex flex-wrap gap-4">
                {[
                  { key: 'inStock' as const, label: 'В наличии' },
                  { key: 'featured' as const, label: 'Хит / рекомендуемый' },
                  { key: 'isNew' as const, label: 'Новинка' },
                ].map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5"
                  >
                    <input
                      type="checkbox"
                      checked={form[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                      className="h-4 w-4 rounded border-white/20 bg-white/5 text-violet-600 focus:ring-violet-500"
                    />
                    <span className="text-sm text-white/80">{label}</span>
                  </label>
                ))}
              </div>
            </Section>

            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push('/admin/products')}
                className="flex-1 rounded-xl border border-white/10 py-3 text-sm text-white/60 hover:bg-white/5"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 py-3 text-sm font-medium text-white shadow-lg shadow-violet-500/25 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Сохранение...' : mode === 'edit' ? 'Сохранить' : 'Создать товар'}
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm space-y-4">
      <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wider">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-white/50">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/25 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30';
