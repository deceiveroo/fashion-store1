'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Edit3, Trash2, Package, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import AdminShell from '@/components/admin/AdminShell';

interface Product {
  id: string; name: string; description: string; price: number;
  inStock: boolean; featured: boolean; categories: string[];
  mainImage?: string; createdAt: string;
}

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products?limit=100', { credentials: 'include', cache: 'no-store' });
      if (res.ok) setProducts(await res.json());
      else toast.error('Не удалось загрузить товары');
    } catch { toast.error('Ошибка загрузки'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const deleteProduct = async (id: string) => {
    if (!confirm('Удалить товар?')) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) { setProducts(p => p.filter(x => x.id !== id)); toast.success('Удалён'); }
      else toast.error('Ошибка удаления');
    } catch { toast.error('Ошибка'); }
  };

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q);
    const matchStock = stockFilter === 'all' || (stockFilter === 'in' ? p.inStock : !p.inStock);
    return matchSearch && matchStock;
  });

  const fmt = (n: number) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(n);

  return (
    <AdminShell>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Товары</h1>
            <p className="text-sm text-white/40">{products.length} товаров в каталоге</p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => router.push('/admin/products/new')}
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors">
              <Plus className="h-4 w-4" />
              Добавить
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Всего', value: products.length, color: 'text-white' },
            { label: 'В наличии', value: products.filter(p => p.inStock).length, color: 'text-emerald-400' },
            { label: 'Нет в наличии', value: products.filter(p => !p.inStock).length, color: 'text-red-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border border-white/5 bg-white/[0.03] p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-white/30 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
            <input type="text" placeholder="Поиск товаров..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-4 text-sm text-white placeholder-white/20 focus:border-violet-500/50 focus:outline-none" />
          </div>
          <select value={stockFilter} onChange={e => setStockFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:outline-none">
            <option value="all" className="bg-[#0f0f1a]">Все</option>
            <option value="in" className="bg-[#0f0f1a]">В наличии</option>
            <option value="out" className="bg-[#0f0f1a]">Нет в наличии</option>
          </select>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.03] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-white/20">
              <Package className="h-10 w-10 mb-2 opacity-40" />
              <p className="text-sm">Товаров не найдено</p>
              <button onClick={() => router.push('/admin/products/new')}
                className="mt-3 rounded-xl bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-500 transition-colors">
                Добавить первый товар
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Товар','Цена','Статус','Дата',''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider last:text-right">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {p.mainImage ? (
                            <img src={p.mainImage} alt={p.name} className="h-10 w-10 rounded-lg object-cover bg-white/5"
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center">
                              <Package className="h-4 w-4 text-white/20" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-white truncate max-w-[200px]">{p.name}</p>
                            {p.featured && <span className="text-[10px] text-violet-400">★ Рекомендуемый</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold text-white">{fmt(p.price)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                          p.inStock ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${p.inStock ? 'bg-emerald-400' : 'bg-red-400'}`} />
                          {p.inStock ? 'В наличии' : 'Нет'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-white/30 whitespace-nowrap">
                        {new Date(p.createdAt).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => router.push(`/admin/products/${p.id}`)}
                            className="rounded-lg p-1.5 text-white/30 hover:text-violet-400 hover:bg-violet-500/10 transition-all">
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => deleteProduct(p.id)}
                            className="rounded-lg p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
