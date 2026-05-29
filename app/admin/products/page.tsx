'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  Package,
  RefreshCw,
  Eye,
  ExternalLink,
  Copy,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import AdminShell from '@/components/admin/AdminShell';
import ProxyImage from '@/components/ProxyImage';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  inStock: boolean;
  featured: boolean;
  isNew?: boolean;
  mainImage?: string;
  isActive?: boolean;
  createdAt: string;
}

export default function AdminProductsPage() {
  const router = useRouter();
  const { showConfirm } = useConfirm();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/products?limit=200', { credentials: 'include', cache: 'no-store' });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setProducts(data);
      } else {
        toast.error(data.error || 'Не удалось загрузить товары');
      }
    } catch {
      toast.error('Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const patchProduct = async (id: string, patch: Record<string, unknown>) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Ошибка обновления');
        return false;
      }
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...patch } as Product : p))
      );
      // Обновляем кэш сервера
      router.refresh();
      return true;
    } catch {
      toast.error('Ошибка сети');
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const deleteProduct = async (id: string, hard = false) => {
    const confirmed = await showConfirm({
      title: hard ? 'Удаление товара' : 'Скрытие товара',
      message: hard 
        ? 'Удалить товар навсегда? Это действие нельзя отменить.'
        : 'Скрыть товар из каталога?',
      confirmText: hard ? 'Удалить навсегда' : 'Скрыть',
      cancelText: 'Отмена',
      variant: hard ? 'danger' : 'warning',
    });
    
    if (!confirmed) return;
    
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/products/${id}?hard=${hard}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        // Перезагружаем список товаров с сервера
        await load();
        toast.success(data.message || 'Готово');
      } else {
        toast.error(data.error || 'Ошибка удаления');
      }
    } catch {
      toast.error('Ошибка сети');
    } finally {
      setBusyId(null);
    }
  };

  const duplicateProduct = async (product: Product) => {
    setBusyId(product.id);
    try {
      const detailRes = await fetch(`/api/admin/products/${product.id}`, {
        credentials: 'include',
      });
      if (!detailRes.ok) {
        toast.error('Не удалось прочитать товар');
        return;
      }
      const detail = await detailRes.json();
      const res = await fetch('/api/products', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${detail.name} (копия)`,
          description: detail.description,
          price: detail.price,
          inStock: detail.inStock,
          featured: false,
          isNew: false,
          categories: detail.categories?.length ? detail.categories : ['collections'],
          images: detail.images?.length ? detail.images : ['/placeholder-image.jpg'],
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Дубликат создан');
        await load();
        if (data.id) router.push(`/admin/products/${data.id}`);
      } else {
        toast.error(data.error || 'Ошибка копирования');
      }
    } catch {
      toast.error('Ошибка сети');
    } finally {
      setBusyId(null);
    }
  };

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    
    const confirmed = await showConfirm({
      title: 'Массовое удаление',
      message: `Удалить ${selected.size} товар(ов) навсегда? Это действие нельзя отменить.`,
      confirmText: 'Удалить навсегда',
      cancelText: 'Отмена',
      variant: 'danger',
    });
    
    if (!confirmed) return;
    
    for (const id of selected) {
      await fetch(`/api/admin/products/${id}?hard=true`, { method: 'DELETE', credentials: 'include' });
    }
    setSelected(new Set());
    toast.success('Выбранные товары удалены');
    // Перезагружаем список
    await load();
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return products.filter((p) => {
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q);
      const matchStock =
        stockFilter === 'all' ||
        (stockFilter === 'in' ? p.inStock : !p.inStock);
      return matchSearch && matchStock;
    });
  }, [products, search, stockFilter]);

  const fmt = (n: number) =>
    new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(n);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-[var(--admin-text)] flex items-center gap-2">
              <Sparkles className="h-7 w-7 text-[var(--admin-accent)]" />
              Товары
            </h1>
            <p className="text-sm text-[var(--admin-text-muted)] mt-1">
              Быстрое редактирование, дубликаты и превью на витрине
            </p>
          </div>
          <motion.div className="flex flex-wrap gap-2">
            {selected.size > 0 && (
              <button
                onClick={() => void bulkDelete()}
                className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-500 dark:text-rose-400 hover:bg-rose-500/20 transition-colors"
              >
                Скрыть ({selected.size})
              </button>
            )}
            <button
              onClick={() => void load()}
              className="flex items-center gap-2 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] px-4 py-2.5 text-sm text-[var(--admin-text-muted)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-card-hover)] transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Обновить
            </button>
            <button
              onClick={() => router.push('/admin/products/new')}
              className="flex items-center gap-2 rounded-xl bg-[var(--admin-accent)] px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-[var(--admin-glow)] hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" />
              Новый товар
            </button>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Всего', value: products.length, icon: Package, c: 'bg-gradient-to-br from-violet-500 to-purple-600 dark:from-violet-500/20 dark:to-purple-600/20 text-white dark:text-violet-400' },
            { label: 'В наличии', value: products.filter((p) => p.inStock).length, icon: ToggleRight, c: 'bg-gradient-to-br from-emerald-500 to-teal-600 dark:from-emerald-500/20 dark:to-teal-600/20 text-white dark:text-emerald-400' },
            { label: 'Нет в наличии', value: products.filter((p) => !p.inStock).length, icon: ToggleLeft, c: 'bg-gradient-to-br from-red-500 to-pink-600 dark:from-red-500/20 dark:to-pink-600/20 text-white dark:text-red-400' },
            { label: 'Хиты', value: products.filter((p) => p.featured).length, icon: Eye, c: 'bg-gradient-to-br from-blue-500 to-cyan-600 dark:from-blue-500/20 dark:to-cyan-600/20 text-white dark:text-blue-400' },
          ].map(({ label, value, icon: Icon, c }) => (
            <div key={label} className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[var(--admin-text-muted)]">{label}</p>
                  <p className="mt-1 text-2xl font-bold text-[var(--admin-text)]">{value}</p>
                </div>
                <motion.div className={`flex h-10 w-10 items-center justify-center rounded-xl ${c} shadow-lg`}>
                  <Icon className="h-5 w-5" />
                </motion.div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-text-faint)]" />
            <input
              type="search"
              placeholder="Поиск по названию, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg-muted)] py-2.5 pl-9 pr-4 text-sm text-[var(--admin-text)] placeholder-[var(--admin-text-faint)] outline-none focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/40"
            />
          </div>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg-muted)] px-4 py-2.5 text-sm text-[var(--admin-text)] outline-none focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/40"
          >
            <option value="all" className="bg-[var(--admin-bg-elevated)] text-[var(--admin-text)]">Все</option>
            <option value="in" className="bg-[var(--admin-bg-elevated)] text-[var(--admin-text)]">В наличии</option>
            <option value="out" className="bg-[var(--admin-bg-elevated)] text-[var(--admin-text)]">Нет в наличии</option>
          </select>
        </div>

        <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] overflow-hidden">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--admin-accent)] border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-[var(--admin-text-faint)]">
              <Package className="h-10 w-10 mb-2 opacity-40" />
              <p className="text-sm">Ничего не найдено</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--admin-border)] text-left">
                    <th className="px-3 py-3 w-8" />
                    <th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--admin-text-faint)]">Товар</th>
                    <th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--admin-text-faint)]">Цена</th>
                    <th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--admin-text-faint)]">Наличие</th>
                    <th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--admin-text-faint)]">Флаги</th>
                    <th className="px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--admin-text-faint)]">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filtered.map((p) => (
                      <motion.tr
                        key={p.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`border-b border-[var(--admin-border-subtle)] hover:bg-[var(--admin-card-hover)] transition-colors ${busyId === p.id ? 'opacity-50' : ''}`}
                      >
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            checked={selected.has(p.id)}
                            onChange={() => toggleSelect(p.id)}
                            className="rounded border-[var(--admin-border)] bg-[var(--admin-bg-muted)] accent-[var(--admin-accent)]"
                            aria-label={`Выбрать ${p.name}`}
                          />
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3 min-w-[200px]">
                            {p.mainImage ? (
                              <ProxyImage src={p.mainImage} alt="" className="h-11 w-11 rounded-lg object-cover border border-[var(--admin-border)]" proxyWidth={96} />
                            ) : (
                              <div className="h-11 w-11 rounded-lg bg-[var(--admin-bg-muted)] flex items-center justify-center">
                                <Package className="h-4 w-4 text-[var(--admin-text-faint)]" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-[var(--admin-text)] truncate">{p.name}</p>
                              <p className="text-[10px] text-[var(--admin-text-muted)] font-mono truncate">{p.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 font-semibold text-[var(--admin-text)] whitespace-nowrap">{fmt(p.price)}</td>
                        <td className="px-3 py-3">
                          <button
                            type="button"
                            disabled={busyId === p.id}
                            onClick={async () => {
                              const ok = await patchProduct(p.id, { inStock: !p.inStock });
                              if (ok) toast.success(p.inStock ? 'Снято с продажи' : 'Снова в наличии');
                            }}
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium border transition-colors ${
                              p.inStock
                                ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/25'
                                : 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-300 dark:border-red-500/25'
                            }`}
                          >
                            {p.inStock ? <ToggleRight className="h-3 w-3" /> : <ToggleLeft className="h-3 w-3" />}
                            {p.inStock ? 'В наличии' : 'Нет'}
                          </button>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-1">
                            <FlagToggle
                              label="Хит"
                              active={p.featured}
                              disabled={busyId === p.id}
                              onToggle={() => void patchProduct(p.id, { featured: !p.featured })}
                            />
                            <FlagToggle
                              label="New"
                              active={Boolean(p.isNew)}
                              disabled={busyId === p.id}
                              onToggle={() => void patchProduct(p.id, { isNew: !p.isNew })}
                            />
                            {p.isActive === false && (
                              <span className="rounded-md px-2 py-0.5 text-[10px] font-medium border border-amber-500/30 bg-amber-500/10 text-amber-400">
                                Скрыт
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-0.5">
                            <ActionBtn
                              title={p.isActive === false ? 'Вернуть в каталог' : 'Скрыть из каталога'}
                              onClick={() => void patchProduct(p.id, { isActive: p.isActive === false })}
                              icon={p.isActive === false ? Eye : ToggleLeft}
                            />
                            <ActionBtn
                              title="На сайте"
                              onClick={() => window.open(`/products/${p.id}`, '_blank')}
                              icon={ExternalLink}
                            />
                            <ActionBtn title="Редактировать" onClick={() => router.push(`/admin/products/${p.id}`)} icon={Edit3} />
                            <ActionBtn title="Дубликат" onClick={() => void duplicateProduct(p)} icon={Copy} />
                            <ActionBtn title="Удалить навсегда" onClick={() => void deleteProduct(p.id, true)} icon={Trash2} danger />
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}

function ActionBtn({
  title,
  onClick,
  icon: Icon,
  danger,
}: {
  title: string;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded-lg p-1.5 transition-colors ${
        danger
          ? 'text-[var(--admin-text-faint)] hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/10'
          : 'text-[var(--admin-text-faint)] hover:text-[var(--admin-accent)] hover:bg-[var(--admin-accent-soft)]'
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function FlagToggle({
  label,
  active,
  disabled,
  onToggle,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className={`rounded-md px-2 py-0.5 text-[10px] font-medium border transition-all ${
        active
          ? 'border-[var(--admin-accent)]/40 bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]'
          : 'border-[var(--admin-border)] bg-[var(--admin-bg-muted)] text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]'
      }`}
    >
      {label}
    </button>
  );
}
