'use client';

import { useState, useEffect } from 'react';
import { ImageIcon, FileText, BookOpen, Plus, Edit2, Trash2, Save, X, Eye } from 'lucide-react';
import { toast } from 'sonner';
import AdminShell from '@/components/admin/AdminShell';

interface ContentItem {
  id: string;
  type: 'slider' | 'page' | 'blog';
  title: string;
  content?: string;
  imageUrl?: string;
  published: boolean;
  createdAt: string;
}

export default function AdminContentPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/content');
      if (response.ok) {
        const data = await response.json();
        setItems(data.content || []);
      } else {
        toast.error('Ошибка загрузки контента');
      }
    } catch (error) {
      console.error('Error loading content:', error);
      toast.error('Ошибка загрузки контента');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingItem) return;
    
    try {
      const isNew = !editingItem.id;
      const url = isNew ? '/api/admin/content' : `/api/admin/content/${editingItem.id}`;
      const method = isNew ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: editingItem.type,
          title: editingItem.title,
          content: editingItem.content,
          imageUrl: editingItem.imageUrl,
          published: editingItem.published,
        }),
      });

      if (response.ok) {
        setShowForm(false);
        setEditingItem(null);
        await loadContent(); // Reload from API
        toast.success(isNew ? 'Контент создан' : 'Контент обновлён');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Ошибка сохранения');
      }
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error('Ошибка сохранения');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить этот контент?')) return;
    try {
      const response = await fetch(`/api/admin/content/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadContent(); // Reload from API
        toast.success('Удалено');
      } else {
        toast.error('Ошибка удаления');
      }
    } catch (error) {
      console.error('Error deleting content:', error);
      toast.error('Ошибка удаления');
    }
  };

  return (
    <AdminShell>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Контент</h1>
            <p className="text-sm text-white/40">Слайдер, страницы, блог</p>
          </div>
          <button
            onClick={() => { setEditingItem({ id: '', type: 'page', title: '', content: '', published: false, createdAt: '' }); setShowForm(true); }}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Добавить
          </button>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 rounded-2xl border border-white/5 bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 rounded-2xl border border-dashed border-white/10">
            <FileText className="h-12 w-12 text-white/10 mb-4" />
            <p className="text-sm text-white/30">Нет контента</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-xs text-violet-400 hover:text-violet-300"
            >
              Создать первый элемент
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map(item => {
              const Icon = item.type === 'slider' ? ImageIcon : item.type === 'blog' ? BookOpen : FileText;
              const typeLabel = item.type === 'slider' ? 'Слайдер' : item.type === 'blog' ? 'Блог' : 'Страница';
              return (
                <div key={item.id} className="group rounded-2xl border border-white/5 bg-white/[0.03] p-5 hover:border-violet-500/30 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      item.type === 'slider' ? 'bg-violet-500/10 text-violet-400' :
                      item.type === 'blog' ? 'bg-emerald-500/10 text-emerald-400' :
                      'bg-blue-500/10 text-blue-400'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditingItem(item); setShowForm(true); }}
                        className="rounded-lg p-1.5 text-white/30 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="rounded-lg p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-2 line-clamp-2">{item.title}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/30">{typeLabel}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      item.published ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-500/10 text-zinc-400'
                    }`}>
                      {item.published ? 'Опубликовано' : 'Черновик'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Edit/Create Modal */}
        {showForm && editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <h2 className="text-sm font-bold text-white">
                  {editingItem.id ? 'Редактировать' : 'Новый контент'}
                </h2>
                <button onClick={() => { setShowForm(false); setEditingItem(null); }} className="text-white/30 hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold text-white/30 uppercase mb-1.5">Тип</label>
                  <select
                    value={editingItem.type}
                    onChange={e => setEditingItem({ ...editingItem, type: e.target.value as ContentItem['type'] })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50"
                  >
                    <option value="slider" className="bg-[#0f0f1a]">Слайдер</option>
                    <option value="page" className="bg-[#0f0f1a]">Страница</option>
                    <option value="blog" className="bg-[#0f0f1a]">Блог</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-white/30 uppercase mb-1.5">Заголовок</label>
                  <input
                    type="text"
                    value={editingItem.title}
                    onChange={e => setEditingItem({ ...editingItem, title: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50"
                    placeholder="Введите заголовок"
                  />
                </div>
                {editingItem.type !== 'slider' && (
                  <div>
                    <label className="block text-[10px] font-semibold text-white/30 uppercase mb-1.5">Содержание (Markdown)</label>
                    <textarea
                      value={editingItem.content || ''}
                      onChange={e => setEditingItem({ ...editingItem, content: e.target.value })}
                      rows={8}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50 resize-none font-mono"
                      placeholder="# Заголовок\n\nТекст содержимого..."
                    />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="published"
                    checked={editingItem.published}
                    onChange={e => setEditingItem({ ...editingItem, published: e.target.checked })}
                    className="rounded border-white/10 bg-white/5 text-violet-500 focus:ring-violet-500/30"
                  />
                  <label htmlFor="published" className="text-sm text-white/60">Опубликовано</label>
                </div>
              </div>
              <div className="flex gap-3 p-5 border-t border-white/5">
                <button
                  onClick={handleSave}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  Сохранить
                </button>
                <button
                  onClick={() => { setShowForm(false); setEditingItem(null); }}
                  className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X className="h-4 w-4" />
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
