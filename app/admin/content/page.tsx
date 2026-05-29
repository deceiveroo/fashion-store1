'use client';

import { useState, useEffect } from 'react';
import { ImageIcon, FileText, BookOpen, Plus, Edit2, Trash2, Save, X, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ui/ConfirmDialog';
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
  const { showConfirm } = useConfirm();
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
    const confirmed = await showConfirm({
      title: 'Удаление контента',
      message: 'Удалить этот контент?',
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      variant: 'danger',
    });
    
    if (!confirmed) return;
    
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
            <h1 className="text-xl font-bold text-[var(--admin-text)]">Контент</h1>
            <p className="text-sm text-[var(--admin-text-muted)]">Слайдер, страницы, блог</p>
          </div>
          <button
            onClick={() => { setEditingItem({ id: '', type: 'page', title: '', content: '', published: false, createdAt: '' }); setShowForm(true); }}
            className="flex items-center gap-2 rounded-lg bg-[var(--admin-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            Добавить
          </button>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-bg-muted)] animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 rounded-2xl border border-dashed border-[var(--admin-border)]">
            <FileText className="h-12 w-12 text-[var(--admin-text-faint)] mb-4" />
            <p className="text-sm text-[var(--admin-text-muted)]">Нет контента</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-xs text-[var(--admin-accent)] hover:opacity-80"
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
                <div key={item.id} className="group rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5 hover:border-[var(--admin-accent)]/30 hover:bg-[var(--admin-card-hover)] transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      item.type === 'slider' ? 'bg-[var(--admin-accent)]/10 text-[var(--admin-accent)]' :
                      item.type === 'blog' ? 'bg-emerald-500/10 text-emerald-400' :
                      'bg-blue-500/10 text-blue-400'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditingItem(item); setShowForm(true); }}
                        className="rounded-lg p-1.5 text-[var(--admin-text-faint)] hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="rounded-lg p-1.5 text-[var(--admin-text-faint)] hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-[var(--admin-text)] mb-2 line-clamp-2">{item.title}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[var(--admin-text-faint)]">{typeLabel}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      item.published ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[var(--admin-bg-muted)] text-[var(--admin-text-muted)]'
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
            <div className="bg-[var(--admin-bg-elevated)] border border-[var(--admin-border)] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-[var(--admin-border)]">
                <h2 className="text-sm font-bold text-[var(--admin-text)]">
                  {editingItem.id ? 'Редактировать' : 'Новый контент'}
                </h2>
                <button onClick={() => { setShowForm(false); setEditingItem(null); }} className="text-[var(--admin-text-faint)] hover:text-[var(--admin-text)] transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold text-[var(--admin-text-muted)] uppercase mb-1.5">Тип</label>
                  <select
                    value={editingItem.type}
                    onChange={e => setEditingItem({ ...editingItem, type: e.target.value as ContentItem['type'] })}
                    className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg-muted)] px-3 py-2.5 text-sm text-[var(--admin-text)] outline-none focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/40"
                  >
                    <option value="slider" className="bg-[var(--admin-bg-elevated)]">Слайдер</option>
                    <option value="page" className="bg-[var(--admin-bg-elevated)]">Страница</option>
                    <option value="blog" className="bg-[var(--admin-bg-elevated)]">Блог</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[var(--admin-text-muted)] uppercase mb-1.5">Заголовок</label>
                  <input
                    type="text"
                    value={editingItem.title}
                    onChange={e => setEditingItem({ ...editingItem, title: e.target.value })}
                    className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg-muted)] px-3 py-2.5 text-sm text-[var(--admin-text)] placeholder-[var(--admin-text-faint)] outline-none focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/40"
                    placeholder="Введите заголовок"
                  />
                </div>
                {editingItem.type !== 'slider' && (
                  <div>
                    <label className="block text-[10px] font-semibold text-[var(--admin-text-muted)] uppercase mb-1.5">Содержание (Markdown)</label>
                    <textarea
                      value={editingItem.content || ''}
                      onChange={e => setEditingItem({ ...editingItem, content: e.target.value })}
                      rows={8}
                      className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg-muted)] px-3 py-2.5 text-sm text-[var(--admin-text)] placeholder-[var(--admin-text-faint)] outline-none focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/40 resize-none font-mono"
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
                    className="rounded border-[var(--admin-border)] bg-[var(--admin-bg-muted)] text-[var(--admin-accent)] focus:ring-[var(--admin-accent)]/40"
                  />
                  <label htmlFor="published" className="text-sm text-[var(--admin-text-muted)]">Опубликовано</label>
                </div>
              </div>
              <div className="flex gap-3 p-5 border-t border-[var(--admin-border)]">
                <button
                  onClick={handleSave}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[var(--admin-accent)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                >
                  <Save className="h-4 w-4" />
                  Сохранить
                </button>
                <button
                  onClick={() => { setShowForm(false); setEditingItem(null); }}
                  className="flex items-center gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] px-4 py-2.5 text-sm font-semibold text-[var(--admin-text)] hover:bg-[var(--admin-card-hover)] transition-colors"
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
