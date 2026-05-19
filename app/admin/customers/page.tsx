'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, User, Trash2, Edit3, Camera, X, Save, RefreshCw, Users, TrendingUp, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';
import AdminShell from '@/components/admin/AdminShell';

interface Customer {
  id: string; email: string; name?: string; firstName?: string; lastName?: string;
  phone?: string; role: string; image?: string; avatar?: string;
  status?: string; createdAt: string; emailVerified?: string | null;
  lastSignIn?: string | null;
}

const ROLE_STYLE: Record<string, string> = {
  admin: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  manager: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  support: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  customer: 'bg-white/5 text-white/40 border-white/10',
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<(Customer & { password?: string }) | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/customers', { credentials: 'include' });
      if (!res.ok) { toast.error('Не удалось загрузить клиентов'); return; }
      const data = await res.json();
      // Handle both array and paginated response
      setCustomers(Array.isArray(data) ? data : (data.customers || []));
    } catch { toast.error('Ошибка загрузки'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const deleteCustomer = async (id: string) => {
    if (!confirm('Удалить клиента?')) return;
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) { setCustomers(c => c.filter(x => x.id !== id)); toast.success('Удалён'); if (editing?.id === id) setEditing(null); }
      else { const d = await res.json(); toast.error(d.error || 'Ошибка'); }
    } catch { toast.error('Ошибка'); }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Выберите изображение'); return; }
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
      toast.error(errorMessage || 'Ошибка загрузки'); 
    }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const save = async () => {
    if (!editing?.id) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ userId: editing.id, updates: {
          firstName: editing.firstName, lastName: editing.lastName, phone: editing.phone,
          role: editing.role, image: editing.avatar || editing.image, avatar: editing.avatar || editing.image,
          ...(editing.password && { password: editing.password }),
        }}),
      });
      if (res.ok) { toast.success('Сохранено'); load(); setEditing(null); }
      else { const d = await res.json(); toast.error(d.error || 'Ошибка'); }
    } catch { toast.error('Ошибка'); }
    finally { setSaving(false); }
  };

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return !q || c.email.toLowerCase().includes(q) || (c.firstName||'').toLowerCase().includes(q) || (c.lastName||'').toLowerCase().includes(q);
  });

  const avatar = (c: Customer) => c.avatar || c.image;
  const displayName = (c: Customer) => `${c.firstName||''} ${c.lastName||''}`.trim() || c.name || '—';

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
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="h-7 w-7 text-violet-600 dark:text-violet-400" />
              Клиенты
            </h1>
            <p className="text-sm text-gray-500 dark:text-white/40 mt-1">Управление клиентами магазина</p>
          </div>
          <button onClick={load} className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-2.5 text-sm text-gray-700 dark:text-white/60 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Обновить
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Всего клиентов', value: customers.length, icon: Users, color: 'bg-gradient-to-br from-violet-500 to-purple-600 dark:from-violet-500/20 dark:to-purple-600/20 text-white dark:text-violet-400', trend: '+8%' },
            { label: 'Администраторы', value: customers.filter(c => c.role === 'admin').length, icon: User, color: 'bg-gradient-to-br from-blue-500 to-cyan-600 dark:from-blue-500/20 dark:to-cyan-600/20 text-white dark:text-blue-400' },
            { label: 'С менеджерами', value: customers.filter(c => c.phone).length, icon: Phone, color: 'bg-gradient-to-br from-emerald-500 to-teal-600 dark:from-emerald-500/20 dark:to-teal-600/20 text-white dark:text-emerald-400' },
            { label: 'Верифицированы', value: customers.filter(c => c.emailVerified).length, icon: Mail, color: 'bg-gradient-to-br from-amber-500 to-orange-600 dark:from-amber-500/20 dark:to-orange-600/20 text-white dark:text-amber-400' },
          ].map(({ label, value, icon: Icon, color, trend }) => (
            <div key={label} className="group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-gradient-to-br from-gray-50 to-white dark:bg-gradient-to-br dark:from-white/[0.05] dark:to-white/[0.02] p-5 hover:from-gray-100 hover:to-gray-50 dark:hover:bg-white/[0.08] transition-all backdrop-blur-sm shadow-sm hover:shadow-md">
              {trend && (
                <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-500/10 px-2 py-1 shadow-sm">
                  <TrendingUp className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{trend}</span>
                </div>
              )}
              <div className="relative z-10">
                <p className="text-xs font-medium text-gray-500 dark:text-white/50 uppercase tracking-wider mb-3">{label}</p>
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color} backdrop-blur-sm shadow-lg`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-white/20" />
          <input type="text" placeholder="Поиск по имени, фамилии или email..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 py-2.5 pl-9 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/20 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30" />
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-white/[0.03] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 dark:text-white/20">
              <User className="h-10 w-10 mb-2 opacity-40" />
              <p className="text-sm">Клиентов не найдено</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-white/5">
                    {['Клиент','Email','Роль','Последний вход','Дата регистрации',''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wider last:text-right">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id} className="border-b border-gray-200 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {avatar(c) ? (
                            <img src={avatar(c)} alt="" className="h-10 w-10 rounded-xl object-cover ring-2 ring-gray-200 dark:ring-white/10" />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-500/10 text-sm font-bold text-violet-600 dark:text-violet-400">
                              {(c.firstName||c.email||'?')[0].toUpperCase()}
                            </div>
                          )}
                          <span className="text-xs font-semibold text-gray-900 dark:text-white">{displayName(c)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-gray-600 dark:text-white/60 flex items-center gap-1">
                          <Mail className="h-3 w-3 text-gray-400 dark:text-white/20" />
                          {c.email}
                        </p>
                        {c.phone && (
                          <p className="text-[10px] text-gray-500 dark:text-white/30 flex items-center gap-1 mt-0.5">
                            <Phone className="h-2.5 w-2.5" />
                            {c.phone}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${ROLE_STYLE[c.role] || ROLE_STYLE.customer}`}>
                          {c.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-gray-600 dark:text-white/60 whitespace-nowrap">
                          {formatLastSignIn(c.lastSignIn)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-white/30 whitespace-nowrap">
                        {new Date(c.createdAt).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setEditing({ ...c })}
                            className="rounded-lg p-1.5 text-gray-400 dark:text-white/30 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-500/10 transition-all">
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => deleteCustomer(c.id)}
                            className="rounded-lg p-1.5 text-gray-400 dark:text-white/30 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/10 transition-all">
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
          <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h2 className="text-sm font-bold text-white">Редактировать клиента</h2>
              <button onClick={() => setEditing(null)} className="text-white/30 hover:text-white transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  {avatar(editing) ? (
                    <img src={avatar(editing)} alt="" className="h-14 w-14 rounded-full object-cover ring-2 ring-violet-500/30" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-500/10 text-lg font-bold text-violet-400">
                      {(editing.firstName||editing.email||'?')[0].toUpperCase()}
                    </div>
                  )}
                  <button onClick={() => fileRef.current?.click()} disabled={uploading}
                    className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-white hover:bg-violet-500 transition-colors disabled:opacity-50">
                    <Camera className="h-3 w-3" />
                  </button>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{displayName(editing)}</p>
                  <p className="text-xs text-white/30">{editing.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[['Имя','firstName'],['Фамилия','lastName'],['Телефон','phone']].map(([label, field]) => (
                  <div key={field} className={field === 'phone' ? 'col-span-2' : ''}>
                    <label className="block text-[10px] font-semibold text-white/30 uppercase mb-1.5">{label}</label>
                    <input type="text" value={(editing[field as keyof typeof editing] as string) || ''}
                      onChange={e => setEditing(prev => prev ? { ...prev, [field]: e.target.value } : prev)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50" />
                  </div>
                ))}
                <div>
                  <label className="block text-[10px] font-semibold text-white/30 uppercase mb-1.5">Роль</label>
                  <select value={editing.role} onChange={e => setEditing(prev => prev ? { ...prev, role: e.target.value } : prev)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50">
                    {['customer','admin','manager','support'].map(r => <option key={r} value={r} className="bg-[#0f0f1a]">{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-white/30 uppercase mb-1.5">Новый пароль</label>
                  <input type="password" placeholder="Оставьте пустым" value={editing.password || ''}
                    onChange={e => setEditing(prev => prev ? { ...prev, password: e.target.value } : prev)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-white/5">
              <button onClick={save} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50 transition-colors">
                <Save className="h-4 w-4" />
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button onClick={() => deleteCustomer(editing.id)}
                className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition-colors">
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
