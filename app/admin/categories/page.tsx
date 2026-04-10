'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Tag, X, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import AdminShell from '@/components/admin/AdminShell';

interface Category {
  id: string; name: string; slug: string; parentId: string | null;
  isFeatured: boolean; createdAt: string;
}

const toSlug = (s: string) => s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', parentId: '', isFeatured: false });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/categories');
      if (res.ok) setCategories(await res.json());
      else toast.error('Ошибка загрузки');
    } catch { toast.error('Ошибка'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: '', slug: '', parentId: '', isFeatured: false }); setShowModal(true); };
  const openEdit = (c: Category) => { setEditing(c); setForm({ name: c.name, slug: c.slug, parentId: c.parentId || '', isFeatured: c.isFeatured }); setShowModal(true); };

  const handleNameChange = (name: string) => {
    setForm(f => ({ ...f, name, slug: editing ? f.slug : toSlug(name) }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.slug) { toast.error('Заполните название и slug'); return; }
    setSaving(true);
    try {
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `/api/categories/${editing.id}` : '/api/categories';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, slug: form.slug, parentId: form.parentId || null, isFeatured: form.isFeatured }),
      });
      if (res.ok) { toast.success(editing ? 'Обновлено' : 'Создано'); setShowModal(false); load(); }
      else { const d = await res.json(); toast.error(d.error || 'Ошибка'); }
    } catch { toast.error('Ошибка'); }
    finally { setSaving(false); }
  };

  const deleteCategory = async (id: string, name: string) => {
    if (!confirm(`Удалить "${name}"?`)) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Удалено'); load(); }
      else { const d = await res.json(); toast.error(d.error || 'Ошибка'); }
    } catch { toast.error('Ошибка'); }
  };

  const parentName = (id: string | null) => id ? (categories.find(c => c.id === id)?.name || '—') : '—';

  return (
    <AdminShell>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Категории</h1>
            <p className="text-sm text-white/40">{categories.length} категорий</p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={openCreate}
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors">
              <Plus className="h-4 w-4" />
              Добавить
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.03] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
            </div>
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-white/20">
              <Tag className="h-10 w-10 mb-2 opacity-40" />
              <p className="text-sm">Категорий нет</p>
              <button onClick={openCreate} className="mt-3 rounded-xl bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-500 transition-colors">
                Создать первую
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Название','Slug','Родительская','Статус',''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider last:text-right">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {categories.map(c => (
                    <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10">
                            <Tag className="h-3.5 w-3.5 text-violet-400" />
                          </div>
                          <span className="text-xs font-medium text-white">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-white/40 font-mono">{c.slug}</td>
                      <td className="px-4 py-3 text-xs text-white/40">{parentName(c.parentId)}</td>
                      <td className="px-4 py-3">
                        {c.isFeatured && (
                          <span className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                            ★ Рекомендуемая
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(c)}
                            className="rounded-lg p-1.5 text-white/30 hover:text-violet-400 hover:bg-violet-500/10 transition-all">
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => deleteCategory(c.id, c.name)}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h2 className="text-sm font-bold text-white">{editing ? 'Редактировать' : 'Создать'} категорию</h2>
              <button onClick={() => setShowModal(false)} className="text-white/30 hover:text-white transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={submit} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-white/30 uppercase mb-1.5">Название *</label>
                <input type="text" value={form.name} onChange={e => handleNameChange(e.target.value)} required
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-white/30 uppercase mb-1.5">Slug *</label>
                <input type="text" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} required
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white font-mono placeholder-white/20 focus:outline-none focus:border-violet-500/50" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-white/30 uppercase mb-1.5">Родительская</label>
                <select value={form.parentId} onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50">
                  <option value="" className="bg-[#0f0f1a]">Без родительской</option>
                  {categories.filter(c => !editing || c.id !== editing.id).map(c => (
                    <option key={c.id} value={c.id} className="bg-[#0f0f1a]">{c.name}</option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className={`relative h-5 w-9 rounded-full transition-colors ${form.isFeatured ? 'bg-violet-600' : 'bg-white/10'}`}
                  onClick={() => setForm(f => ({ ...f, isFeatured: !f.isFeatured }))}>
                  <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.isFeatured ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm text-white/60">Рекомендуемая категория</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all">
                  Отмена
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50 transition-colors">
                  <Save className="h-4 w-4" />
                  {saving ? 'Сохранение...' : (editing ? 'Сохранить' : 'Создать')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
