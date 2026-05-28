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
  Play,
  Image as ImageIcon,
  Ruler,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import AdminShell from '@/components/admin/AdminShell';
import ProxyImage from '@/components/ProxyImage';

type MediaItem = {
  id?: string;
  url: string;
  type: 'image' | 'video';
  thumbnailUrl?: string;
  duration?: number;
  color?: string;
};

export type CategoryOption = { id: string; name: string; slug: string };

export type ProductFormValues = {
  name: string;
  description: string;
  price: string;
  inStock: boolean;
  featured: boolean;
  isNew: boolean;
  // Дополнительные поля
  brand?: string;
  country?: string;
  composition?: string;
  compositionSecondary?: string;
  color?: string;
  articleNumber?: string;
  productCode?: string;
  modelParams?: string;
};

type AdminProductFormProps = {
  mode: 'create' | 'edit';
  productId?: string;
};

export default function AdminProductForm({ mode, productId }: AdminProductFormProps) {
  const router = useRouter();
  const { showConfirm } = useConfirm();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ProductFormValues>({
    name: '',
    description: '',
    price: '',
    inStock: true,
    featured: false,
    isNew: false,
    brand: '',
    country: '',
    composition: '',
    compositionSecondary: '',
    color: '',
    articleNumber: '',
    productCode: '',
    modelParams: '',
  });
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState<'image' | 'video'>('image');
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  
  // Размеры товара
  type ProductSize = {
    id?: string;
    sizeName: string;
    sizeType: 'international' | 'ru' | 'eu' | 'us';
    inStock: boolean;
    stockCount: number;
  };
  const [sizes, setSizes] = useState<ProductSize[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

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
        brand: data.brand ?? '',
        country: data.country ?? '',
        composition: data.composition ?? '',
        compositionSecondary: data.compositionSecondary ?? '',
        color: data.color ?? '',
        articleNumber: data.articleNumber ?? '',
        productCode: data.productCode ?? '',
        modelParams: data.modelParams ?? '',
      });
      setSelectedCategories(data.categories ?? []);
      // Load media (images and videos)
      const initialMedia: MediaItem[] = [];
      if (data.images && data.images.length > 0) {
        console.log('[AdminProductForm] Raw images from API:', data.images);
        data.images.forEach((img: any) => {
          const mediaItem: MediaItem = {
            id: img.id,
            url: img.url,
            type: (img.mediaType as 'image' | 'video') || 'image',
            thumbnailUrl: img.thumbnailUrl,
            duration: img.duration,
            color: img.color ?? '',
          };
          console.log('[AdminProductForm] Processing media item:', mediaItem);
          initialMedia.push(mediaItem);
        });
      } else if (data.mainImage) {
        console.log('[AdminProductForm] Using mainImage fallback:', data.mainImage);
        initialMedia.push({ url: data.mainImage, type: 'image' });
      }
      console.log('[AdminProductForm] Final media array:', initialMedia);
      setMedia(initialMedia);
      
      // Load sizes
      if (data.sizes && Array.isArray(data.sizes)) {
        setSizes(data.sizes.map((s: any) => ({
          id: s.id,
          sizeName: s.sizeName || s.size_name,
          sizeType: s.sizeType || s.size_type || 'international',
          inStock: s.inStock !== undefined ? s.inStock : s.in_stock !== undefined ? s.in_stock : true,
          stockCount: s.stockCount || s.stock_count || 0,
        })));
      }
    } catch {
      toast.error('Ошибка загрузки');
      router.push('/admin/products');
    } finally {
      setLoading(false);
    }
  };

  // Общая загрузка списка файлов (из input, drag&drop или буфера обмена)
  const uploadFiles = async (files: File[]) => {
    if (!files || files.length === 0) return;

    if (!productId) {
      toast.error('Сначала сохраните товар, затем добавляйте фото/видео');
      return;
    }

    setUploading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Загружаем файлы последовательно
      for (const file of files) {
        const isVideo = file.type.startsWith('video/');
        const isImage = file.type.startsWith('image/');

        if (!isVideo && !isImage) {
          toast.error(`Файл "${file.name}" не является изображением или видео`);
          errorCount++;
          continue;
        }

        try {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('productId', productId);
          fd.append('mediaType', isVideo ? 'video' : 'image');

          const res = await fetch(`/api/admin/products/${productId}/media`, {
            method: 'POST',
            credentials: 'include',
            body: fd,
          });
          const data = await res.json();

          if (res.ok && data.media) {
            setMedia((prev) => [...prev, {
              id: data.media.id,
              url: data.media.url,
              type: data.media.mediaType || (isVideo ? 'video' : 'image'),
              thumbnailUrl: data.media.thumbnailUrl,
              duration: data.media.duration,
            }]);
            successCount++;
          } else {
            console.error(`Ошибка загрузки файла ${file.name}:`, data.error);
            errorCount++;
          }
        } catch (err) {
          console.error(`Ошибка загрузки файла ${file.name}:`, err);
          errorCount++;
        }
      }

      // Показываем результат
      if (successCount > 0 && errorCount === 0) {
        toast.success(`Загружено файлов: ${successCount}`);
      } else if (successCount > 0 && errorCount > 0) {
        toast.warning(`Загружено: ${successCount}, ошибок: ${errorCount}`);
      } else {
        toast.error('Не удалось загрузить файлы');
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) void uploadFiles(Array.from(files));
  };

  // Вставка фото/видео из буфера обмена (Ctrl+V) в любом месте формы.
  // Текстовая вставка в поля не затрагивается — реагируем только на файлы.
  useEffect(() => {
    if (loading) return;
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      for (const item of Array.from(items)) {
        if (item.kind === 'file' && (item.type.startsWith('image/') || item.type.startsWith('video/'))) {
          const blob = item.getAsFile();
          if (blob) files.push(pastedToFile(blob));
        }
      }
      if (files.length === 0) return; // нет медиа — не мешаем обычной вставке текста
      e.preventDefault();
      if (!productId) {
        toast.error('Сначала сохраните товар, затем вставляйте медиа из буфера');
        return;
      }
      toast.message(`Вставка из буфера: ${files.length} файл(ов)…`);
      void uploadFiles(files);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
    // uploadFiles стабильна по productId; пересоздаём слушатель при смене id/loading
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, productId]);

  // Drag & Drop для фото
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    // Меняем местами элементы
    const newMedia = [...media];
    const draggedItem = newMedia[draggedIndex];
    newMedia.splice(draggedIndex, 1);
    newMedia.splice(index, 0, draggedItem);
    setMedia(newMedia);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Управление размерами
  const addSize = () => {
    setSizes([...sizes, {
      sizeName: 'M',
      sizeType: 'international',
      inStock: true,
      stockCount: 0,
    }]);
  };

  const updateSize = (index: number, field: keyof ProductSize, value: any) => {
    const newSizes = [...sizes];
    newSizes[index] = { ...newSizes[index], [field]: value };
    setSizes(newSizes);
  };

  const removeSize = (index: number) => {
    setSizes(sizes.filter((_, i) => i !== index));
  };

  // Авто-заполнение размеров готовыми наборами (RU / INT / EU и т.д.)
  const [bulkQty, setBulkQty] = useState(10);
  const applySizePreset = (preset: { type: ProductSize['sizeType']; names: string[] }) => {
    setSizes((prev) => {
      const existing = new Set(prev.map((s) => `${s.sizeType}:${s.sizeName.trim().toUpperCase()}`));
      const additions = preset.names
        .filter((n) => !existing.has(`${preset.type}:${n.toUpperCase()}`))
        .map((n) => ({
          sizeName: n,
          sizeType: preset.type,
          inStock: true,
          stockCount: bulkQty,
        }));
      if (additions.length === 0) {
        toast.info('Эти размеры уже добавлены');
        return prev;
      }
      toast.success(`Добавлено размеров: ${additions.length}`);
      return [...prev, ...additions];
    });
  };

  // Массовое управление наличием
  const setAllInStock = (val: boolean) => {
    setSizes((prev) => prev.map((s) => ({ ...s, inStock: val })));
  };
  const applyQtyToAll = () => {
    setSizes((prev) => prev.map((s) => ({ ...s, stockCount: bulkQty, inStock: bulkQty > 0 })));
    toast.success(`Количество ${bulkQty} задано всем размерам`);
  };

  // Привязка фото к цвету
  const updateMediaColor = (index: number, color: string) => {
    setMedia((prev) => prev.map((m, i) => (i === index ? { ...m, color } : m)));
  };
  const usedColors = Array.from(
    new Set(media.map((m) => m.color?.trim()).filter((c): c is string => Boolean(c)))
  );

  const payload = () => {
    const data = {
      ...form,
      price: parseFloat(form.price),
      categories: selectedCategories,
      images:
        media.length > 0
          ? media.map((m) => ({
              url: m.url,
              mediaType: m.type,
              duration: m.duration,
              thumbnailUrl: m.thumbnailUrl,
              color: m.color?.trim() || null,
            }))
          : [{ url: '/placeholder-image.jpg', mediaType: 'image' }],
      sizes: sizes.map((s, index) => ({
        ...s,
        sortOrder: index,
      })),
    };
    console.log('[AdminProductForm] Sending payload:', JSON.stringify(data, null, 2));
    return data;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (uploading) {
      toast.error('Дождитесь окончания загрузки фото');
      return;
    }
    
    if (!form.name.trim() || !form.description.trim() || !form.price) {
      toast.error('Заполните обязательные поля');
      return;
    }
    if (selectedCategories.length === 0) {
      toast.error('Выберите категорию');
      return;
    }

    console.log('[AdminProductForm] Current media state before save:', media);

    setSaving(true);
    try {
      const url =
        mode === 'edit' && productId
          ? `/api/admin/products/${productId}`
          : '/api/products';
      const method = mode === 'edit' ? 'PUT' : 'POST';

      const payloadData = payload();
      console.log('[AdminProductForm] Payload created:', JSON.stringify(payloadData.images, null, 2));

      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadData),
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
    if (!productId) return;
    
    const confirmed = await showConfirm({
      title: 'Удаление товара',
      message: 'Скрыть товар из каталога? (мягкое удаление)',
      confirmText: 'Скрыть',
      cancelText: 'Отмена',
      variant: 'warning',
    });
    
    if (!confirmed) return;
    
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

            <Section title="Медиа (Фото и Видео)">
              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                {/* Type selector */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setUploadType('image')}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      uploadType === 'image'
                        ? 'bg-violet-600 text-white'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    <ImageIcon className="h-4 w-4 inline mr-2" />
                    Фото
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadType('video')}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      uploadType === 'video'
                        ? 'bg-violet-600 text-white'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    <Play className="h-4 w-4 inline mr-2" />
                    Видео
                  </button>
                </div>
              </div>
              
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
                      setMedia((p) => [...p, { url: newImageUrl.trim(), type: uploadType }]);
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
                  {uploading ? '...' : (uploadType === 'video' ? 'Видео' : 'Файлы')}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={uploadType === 'video' ? 'video/*' : 'image/*'}
                    multiple={uploadType === 'image'}
                    className="hidden"
                    onChange={handleUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
              
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/45">
                <kbd className="rounded border border-white/15 bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-white/80">Ctrl</kbd>
                <span>+</span>
                <kbd className="rounded border border-white/15 bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-white/80">V</kbd>
                <span>— вставит скриншот / фото / видео прямо из буфера обмена ПК</span>
              </div>

              {media.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {media.map((item, i) => (
                    <div key={`${item.url}-${i}`} className="flex flex-col gap-1.5">
                    <div
                      draggable
                      onDragStart={() => handleDragStart(i)}
                      onDragOver={(e) => handleDragOver(e, i)}
                      onDragEnd={handleDragEnd}
                      className={`group relative aspect-[3/4] overflow-hidden rounded-xl border bg-gray-800 cursor-move transition-all ${
                        draggedIndex === i ? 'opacity-50 scale-95' : 'border-white/10 hover:border-violet-500/50'
                      }`}
                    >
                      {item.type === 'video' ? (
                        <>
                          {item.thumbnailUrl ? (
                            <ProxyImage 
                              src={item.thumbnailUrl} 
                              alt="" 
                              className="h-full w-full object-cover"
                              proxyWidth={384}
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-violet-600/20 to-purple-600/20">
                              <Play className="h-12 w-12 text-white/50" />
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                              <Play className="w-5 h-5 text-gray-900 ml-0.5" fill="currentColor" />
                            </div>
                          </div>
                          {item.duration && (
                            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 text-white text-[10px] rounded font-medium">
                              {Math.floor(item.duration / 60)}:{String(item.duration % 60).padStart(2, '0')}
                            </span>
                          )}
                        </>
                      ) : (
                        <ProxyImage 
                          src={item.url} 
                          alt="" 
                          className="h-full w-full object-cover"
                          proxyWidth={384}
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => setMedia((p) => p.filter((_, idx) => idx !== i))}
                        className="absolute top-2 right-2 rounded-full bg-red-500 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      {i === 0 && (
                        <span className="absolute bottom-2 left-2 rounded bg-violet-600 px-1.5 py-0.5 text-[10px] text-white">
                          Главное
                        </span>
                      )}
                      {item.type === 'video' && (
                        <span className="absolute top-2 left-2 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] text-white">
                          Видео
                        </span>
                      )}
                      {item.color?.trim() && (
                        <span className="absolute bottom-2 right-2 max-w-[80%] truncate rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
                          {item.color.trim()}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      list="media-colors"
                      value={item.color ?? ''}
                      onChange={(e) => updateMediaColor(i, e.target.value)}
                      placeholder="Цвет (напр. Чёрный)"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white placeholder-white/25 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
                    />
                    </div>
                  ))}
                  <datalist id="media-colors">
                    {usedColors.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
              )}
              <p className="mt-3 text-xs text-white/40">
                Укажите цвет у фото, чтобы на странице товара покупатель мог переключать
                цвета — галерея покажет фото только выбранного цвета. Оставьте пустым,
                если у товара один цвет.
              </p>
            </Section>

            <Section title="Размеры и наличие">
              <div className="space-y-4">
                {/* Size list */}
                {sizes.length > 0 ? (
                  <div className="space-y-2">
                    {sizes.map((size, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col sm:flex-row gap-3 p-4 rounded-xl border border-white/10 bg-white/[0.02]"
                      >
                        {/* Size name */}
                        <div className="flex-1">
                          <label className="text-xs text-white/50 mb-1 block">Размер</label>
                          <input
                            type="text"
                            value={size.sizeName}
                            onChange={(e) => updateSize(index, 'sizeName', e.target.value)}
                            className={`${inputCls} font-medium`}
                            placeholder="M, 42RU, S, L..."
                          />
                        </div>

                        {/* Size type */}
                        <div className="flex-1">
                          <label className="text-xs text-white/50 mb-1 block">Тип размера</label>
                          <select
                            value={size.sizeType}
                            onChange={(e) => updateSize(index, 'sizeType', e.target.value)}
                            className={inputCls}
                          >
                            <option value="international">International (XS/S/M/L)</option>
                            <option value="ru">Russian (42/44/46)</option>
                            <option value="eu">European (36/38/40)</option>
                            <option value="us">US (2/4/6/8)</option>
                          </select>
                        </div>

                        {/* Stock count */}
                        <div className="flex-1">
                          <label className="text-xs text-white/50 mb-1 block">Количество</label>
                          <input
                            type="number"
                            min="0"
                            value={size.stockCount}
                            onChange={(e) => updateSize(index, 'stockCount', parseInt(e.target.value) || 0)}
                            className={inputCls}
                            placeholder="0"
                          />
                        </div>

                        {/* In stock toggle */}
                        <div className="flex items-end">
                          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
                            <input
                              type="checkbox"
                              checked={size.inStock}
                              onChange={(e) => updateSize(index, 'inStock', e.target.checked)}
                              className="h-4 w-4 rounded border-white/20 bg-white/5 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-sm text-white/80">В наличии</span>
                          </label>
                        </div>

                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => removeSize(index)}
                          className="p-2.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 rounded-xl border border-dashed border-white/10 bg-white/[0.02]">
                    <Ruler className="h-12 w-12 mx-auto text-white/20 mb-3" />
                    <p className="text-sm text-white/40">Нет размеров. Добавьте первый размер.</p>
                  </div>
                )}

                {/* Add size button */}
                <button
                  type="button"
                  onClick={addSize}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-violet-500/30 bg-violet-500/5 px-4 py-3 text-sm text-violet-400 hover:bg-violet-500/10 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Добавить размер
                </button>

                {/* Авто-заполнение готовыми наборами размеров */}
                <div className="pt-1">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-white/40">Авто-заполнение набором (одним кликом):</p>
                    <label className="flex items-center gap-2 text-xs text-white/40">
                      Кол-во на размер
                      <input
                        type="number"
                        min="0"
                        value={bulkQty}
                        onChange={(e) => setBulkQty(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-20 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white focus:border-violet-500/50 focus:outline-none"
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SIZE_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => applySizePreset(preset)}
                        className="px-3 py-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 text-xs font-medium text-violet-300 hover:bg-violet-500/20 transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Массовое управление наличием — когда размеры уже есть */}
                {sizes.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 border-t border-white/5 pt-3">
                    <span className="text-xs text-white/40">Применить ко всем:</span>
                    <button
                      type="button"
                      onClick={applyQtyToAll}
                      className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-white/70 hover:bg-white/10 transition-colors"
                    >
                      Количество = {bulkQty}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAllInStock(true)}
                      className="px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                    >
                      Все в наличии
                    </button>
                    <button
                      type="button"
                      onClick={() => setAllInStock(false)}
                      className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-white/60 hover:bg-white/10 transition-colors"
                    >
                      Снять наличие
                    </button>
                  </div>
                )}
              </div>
            </Section>

            <Section title="Детали товара">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Бренд">
                  <input
                    value={form.brand || ''}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    className={inputCls}
                    placeholder="ZIMMERMANN"
                  />
                </Field>
                <Field label="Страна производства">
                  <input
                    value={form.country || ''}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className={inputCls}
                    placeholder="КИТАЙ"
                  />
                </Field>
                <Field label="Основной состав">
                  <input
                    value={form.composition || ''}
                    onChange={(e) => setForm({ ...form, composition: e.target.value })}
                    className={inputCls}
                    placeholder="100% вискоза"
                  />
                </Field>
                <Field label="Дополнительный состав">
                  <input
                    value={form.compositionSecondary || ''}
                    onChange={(e) => setForm({ ...form, compositionSecondary: e.target.value })}
                    className={inputCls}
                    placeholder="86% полиэстер, 14% эластан"
                  />
                </Field>
                <Field label="Цвет">
                  <input
                    value={form.color || ''}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className={inputCls}
                    placeholder="Мультиколор, Цветочный принт"
                  />
                </Field>
                <Field label="Артикул">
                  <input
                    value={form.articleNumber || ''}
                    onChange={(e) => setForm({ ...form, articleNumber: e.target.value })}
                    className={inputCls}
                    placeholder="0991TC261"
                  />
                </Field>
                <Field label="Код товара">
                  <input
                    value={form.productCode || ''}
                    onChange={(e) => setForm({ ...form, productCode: e.target.value })}
                    className={inputCls}
                    placeholder="4741819"
                  />
                </Field>
                <Field label="Параметры модели">
                  <input
                    value={form.modelParams || ''}
                    onChange={(e) => setForm({ ...form, modelParams: e.target.value })}
                    className={inputCls}
                    placeholder="165/86/63/89, размер на модели – 40RU"
                  />
                </Field>
              </div>
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
                disabled={saving || uploading}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 py-3 text-sm font-medium text-white shadow-lg shadow-violet-500/25 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Загрузка фото...
                  </>
                ) : saving ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {mode === 'edit' ? 'Сохранить' : 'Создать товар'}
                  </>
                )}
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

// Буфер обмена отдаёт картинку как Blob без имени — даём корректное имя/расширение,
// чтобы серверный аплоад верно определил тип и сохранил файл.
const MIME_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
};
function pastedToFile(blob: File): File {
  if (blob.name && blob.name.includes('.')) return blob;
  const ext = MIME_EXT[blob.type] || 'png';
  return new File([blob], `pasted-${Date.now()}.${ext}`, {
    type: blob.type || 'image/png',
  });
}

// Готовые наборы размеров для авто-заполнения
const SIZE_PRESETS: {
  label: string;
  type: 'international' | 'ru' | 'eu' | 'us';
  names: string[];
}[] = [
  { label: 'INT · XS–XL', type: 'international', names: ['XS', 'S', 'M', 'L', 'XL'] },
  { label: 'INT · XS–XXL', type: 'international', names: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
  { label: 'RU · 42–52', type: 'ru', names: ['42', '44', '46', '48', '50', '52'] },
  { label: 'RU · 40–56', type: 'ru', names: ['40', '42', '44', '46', '48', '50', '52', '54', '56'] },
  { label: 'EU · 34–44', type: 'eu', names: ['34', '36', '38', '40', '42', '44'] },
  { label: 'US · 2–12', type: 'us', names: ['2', '4', '6', '8', '10', '12'] },
  { label: 'Один размер', type: 'international', names: ['One Size'] },
];
