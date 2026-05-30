'use client';

import Image from 'next/image';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Search, Shield, Trash2, Edit3, Camera, X, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import AdminShell from '@/components/admin/AdminShell';

interface StaffUser {
  id: string; email: string; name?: string; firstName?: string; lastName?: string;
  phone?: string; role: string; image?: string; avatar?: string; createdAt: string;
  lastSignIn?: string | null;
}

const ROLE_STYLE: Record<string, string> = {
  admin: 'bg-violet-100 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-500/20',
  manager: 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
  support: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
};

export default function UsersPage() {
  const { showConfirm } = useConfirm();
  const { data: session, update: updateSession } = useSession();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<(StaffUser & { password?: string }) | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', { credentials: 'include' });
      if (!res.ok) { toast.error('Не удалось загрузить команду'); return; }
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch { toast.error('Ошибка загрузки'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const deleteUser = async (id: string) => {
    const confirmed = await showConfirm({
      title: 'Удаление пользователя',
      message: 'Удалить пользователя? Это действие нельзя отменить.',
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      variant: 'danger',
    });
    
    if (!confirmed) return;
    
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) { setUsers(u => u.filter(x => x.id !== id)); toast.success('Удалён'); if (editing?.id === id) setEditing(null); }
      else { const d = await res.json(); toast.error(d.error || 'Ошибка'); }
    } catch { toast.error('Ошибка'); }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) { toast.error('Выберите изображение'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Файл > 5MB'); return; }
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd, credentials: 'include' });
      if (!res.ok) throw new Error((await res.json()).error);
      const { url } = await res.json();
      setEditing(prev => prev ? { ...prev, avatar: url, image: url } : prev);
      toast.success('Аватар загружен');
    } catch (err: unknown) { 
      const errorMessage = err instanceof Error ? err.message : String(err);
      toast.error(errorMessage || 'Ошибка'); 
    }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const save = async () => {
    if (!editing?.id) return;
    setSaving(true);
    try {
      const avatarUrl = editing.avatar || editing.image;
      const res = await fetch('/api/admin/users', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ userId: editing.id, updates: {
          firstName: editing.firstName, lastName: editing.lastName, phone: editing.phone,
          role: editing.role, image: avatarUrl, avatar: avatarUrl,
          ...(editing.password && { password: editing.password }),
        }}),
      });
      if (res.ok) {
        toast.success('Сохранено');
        if (session?.user?.id === editing.id) await updateSession?.();
        load(); setEditing(null);
      } else { const d = await res.json(); toast.error(d.error || 'Ошибка'); }
    } catch { toast.error('Ошибка'); }
    finally { setSaving(false); }
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q || u.email.toLowerCase().includes(q) || (u.firstName||'').toLowerCase().includes(q) || (u.lastName||'').toLowerCase().includes(q);
  });

  const av = (u: StaffUser) => u.avatar || u.image;
  const name = (u: StaffUser) => `${u.firstName||''} ${u.lastName||''}`.trim() || u.name || '—';

  // Форматирование времени последнего входа
  const formatLastSignIn = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'Никогда';
    
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays < 7) return `${diffDays} дн назад`;
    return date.toLocaleDateString('ru-RU');
  };

  return (
    <AdminShell>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[var(--admin-text)]">Команда</h1>
            <p className="text-sm text-[var(--admin-text-muted)]">{users.length} сотрудников</p>
          </div>
          <button onClick={load} className="flex items-center gap-2 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 text-sm text-[var(--admin-text-muted)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-card-hover)] transition-all">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-text-faint)]" />
          <input type="text" placeholder="Поиск по имени или email..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg-muted)] py-2.5 pl-9 pr-4 text-sm text-[var(--admin-text)] placeholder-[var(--admin-text-faint)] outline-none focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/40" />
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--admin-accent)] border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-[var(--admin-text-faint)]">
              <Shield className="h-10 w-10 mb-2 opacity-40" />
              <p className="text-sm">Сотрудников не найдено</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--admin-border)]">
                    {['Сотрудник','Email','Роль','Последний вход','Дата регистрации',''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-[var(--admin-text-faint)] uppercase tracking-wider last:text-right">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => (
                    <tr key={u.id} className="border-b border-[var(--admin-border)] hover:bg-[var(--admin-card-hover)] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {av(u) ? (
                            <img src={av(u)} alt="" className="h-8 w-8 rounded-full object-cover ring-1 ring-[var(--admin-border)]" />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--admin-accent)]/10 text-xs font-bold text-[var(--admin-accent)]">
                              {(u.firstName||u.email||'?')[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-medium text-[var(--admin-text)]">{name(u)}</p>
                            {session?.user?.id === u.id && <p className="text-[10px] text-[var(--admin-accent)]">Это вы</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--admin-text-muted)]">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${ROLE_STYLE[u.role] || 'bg-[var(--admin-bg-muted)] text-[var(--admin-text-muted)] border-[var(--admin-border)]'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-[var(--admin-text-muted)] whitespace-nowrap">
                          {formatLastSignIn(u.lastSignIn)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--admin-text-faint)] whitespace-nowrap">
                        {new Date(u.createdAt).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setEditing({ ...u })}
                            className="rounded-lg p-1.5 text-[var(--admin-text-faint)] hover:text-[var(--admin-accent)] hover:bg-[var(--admin-accent)]/10 transition-all">
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => deleteUser(u.id)} disabled={session?.user?.id === u.id}
                            className="rounded-lg p-1.5 text-[var(--admin-text-faint)] hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed">
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

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[var(--admin-bg-elevated)] border border-[var(--admin-border)] rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--admin-border)]">
              <h2 className="text-sm font-bold text-[var(--admin-text)]">Редактировать сотрудника</h2>
              <button onClick={() => setEditing(null)} className="text-[var(--admin-text-faint)] hover:text-[var(--admin-text)] transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {av(editing) ? (
                    <img src={av(editing)} alt="" className="h-14 w-14 rounded-full object-cover ring-2 ring-[var(--admin-accent)]/30" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--admin-accent)]/10 text-lg font-bold text-[var(--admin-accent)]">
                      {(editing.firstName||editing.email||'?')[0].toUpperCase()}
                    </div>
                  )}
                  <button onClick={() => fileRef.current?.click()} disabled={uploading}
                    className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--admin-accent)] text-white hover:opacity-90 transition-colors disabled:opacity-50">
                    <Camera className="h-3 w-3" />
                  </button>
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--admin-text)]">{name(editing)}</p>
                  <p className="text-xs text-[var(--admin-text-muted)]">{editing.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[['Имя','firstName'],['Фамилия','lastName'],['Телефон','phone']].map(([label, field]) => (
                  <div key={field} className={field === 'phone' ? 'col-span-2' : ''}>
                    <label className="block text-[10px] font-semibold text-[var(--admin-text-muted)] uppercase mb-1.5">{label}</label>
                    <input type="text" value={(editing[field as keyof typeof editing] as string) || ''}
                      onChange={e => setEditing(prev => prev ? { ...prev, [field]: e.target.value } : prev)}
                      className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg-muted)] px-3 py-2.5 text-sm text-[var(--admin-text)] placeholder-[var(--admin-text-faint)] outline-none focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/40" />
                  </div>
                ))}
                <div>
                  <label className="block text-[10px] font-semibold text-[var(--admin-text-muted)] uppercase mb-1.5">Роль</label>
                  <select value={editing.role} onChange={e => setEditing(prev => prev ? { ...prev, role: e.target.value } : prev)}
                    className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg-muted)] px-3 py-2.5 text-sm text-[var(--admin-text)] outline-none focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/40">
                    {['admin','manager','support'].map(r => <option key={r} value={r} className="bg-[var(--admin-bg-elevated)] text-[var(--admin-text)]">{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[var(--admin-text-muted)] uppercase mb-1.5">Новый пароль</label>
                  <input type="password" placeholder="Оставьте пустым" value={editing.password || ''}
                    onChange={e => setEditing(prev => prev ? { ...prev, password: e.target.value } : prev)}
                    className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg-muted)] px-3 py-2.5 text-sm text-[var(--admin-text)] placeholder-[var(--admin-text-faint)] outline-none focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/40" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-[var(--admin-border)]">
              <button onClick={save} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[var(--admin-accent)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-colors">
                <Save className="h-4 w-4" />
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button onClick={() => deleteUser(editing.id)} disabled={session?.user?.id === editing.id}
                className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 disabled:opacity-30 transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
    </AdminShell>
  );
}
