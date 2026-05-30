'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, User, Trash2, Edit3, Camera, X, Save, RefreshCw,
  Users, Mail, Phone, ShieldCheck, BadgeCheck, ChevronRight, ChevronDown, Calendar, Link2, Unlink,
} from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import AdminShell from '@/components/admin/AdminShell';

interface Customer {
  id: string; email: string; name?: string; firstName?: string; lastName?: string;
  phone?: string; role: string; image?: string; avatar?: string;
  status?: string; createdAt: string; emailVerified?: string | null;
  lastSignIn?: string | null;
}

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30',
  manager: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30',
  support: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
  customer: 'bg-[var(--admin-bg-muted)] text-[var(--admin-text-muted)] border-[var(--admin-border)]',
};

export default function CustomersPage() {
  const { showConfirm } = useConfirm();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<(Customer & { password?: string }) | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [connections, setConnections] = useState<Record<string, { provider: string; label: string }[]>>({});
  const [connLoading, setConnLoading] = useState<string | null>(null);

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

  // Привязки пользователя подгружаем при раскрытии его карточки.
  useEffect(() => {
    if (expandedId && !connections[expandedId]) loadConnections(expandedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedId]);

  const loadConnections = async (userId: string) => {
    setConnLoading(userId);
    try {
      const res = await fetch(`/api/admin/customers/${userId}/connections`, { credentials: 'include' });
      const data = res.ok ? await res.json() : { connections: [] };
      setConnections(prev => ({ ...prev, [userId]: data.connections || [] }));
    } catch {
      setConnections(prev => ({ ...prev, [userId]: [] }));
    } finally {
      setConnLoading(null);
    }
  };

  const unlinkConnection = async (userId: string, provider: string) => {
    const confirmed = await showConfirm({
      title: 'Отвязать аккаунт',
      message: `Отвязать ${provider === 'google' ? 'Google' : 'Telegram'} от пользователя? Он больше не сможет входить этим способом.`,
      confirmText: 'Отвязать',
      cancelText: 'Отмена',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/admin/customers/${userId}/connections?provider=${provider}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) { toast.success('Аккаунт отвязан'); loadConnections(userId); }
      else { const d = await res.json().catch(() => ({})); toast.error(d.error || 'Не удалось отвязать'); }
    } catch { toast.error('Ошибка'); }
  };

  const deleteCustomer = async (id: string) => {
    const confirmed = await showConfirm({
      title: 'Удаление клиента',
      message: 'Удалить клиента? Это действие нельзя отменить.',
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      variant: 'danger',
    });
    
    if (!confirmed) return;
    
    try {
      console.log('[DELETE] Attempting to delete customer:', id);
      const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      
      console.log('[DELETE] Response:', res.status, data);
      
      if (res.ok) { 
        setCustomers(c => c.filter(x => x.id !== id)); 
        toast.success('Клиент удален'); 
        if (editing?.id === id) setEditing(null); 
      } else { 
        const errorMsg = data.details || data.error || 'Ошибка удаления';
        console.error('[DELETE] Error:', errorMsg);
        toast.error(errorMsg); 
      }
    } catch (err) { 
      console.error('[DELETE] Exception:', err);
      toast.error('Произошла ошибка при удалении'); 
    }
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
          email: editing.email,
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
  const displayName = (c: Customer) => {
    const fullName = `${c.firstName||''} ${c.lastName||''}`.trim();
    if (fullName) return fullName;
    if (c.name) return c.name;
    // Fallback: show email username part (before @)
    return c.email.split('@')[0];
  };

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
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--admin-text)] flex items-center gap-2">
              <Users className="h-7 w-7 text-[var(--admin-accent)]" />
              Клиенты
            </h1>
            <p className="text-sm text-[var(--admin-text-muted)] mt-1">Управление клиентами магазина</p>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-2 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] px-4 py-2.5 text-sm text-[var(--admin-text-muted)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-card-hover)] transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Обновить
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-text-faint)]" />
          <input
            type="text"
            placeholder="Поиск по имени, фамилии или email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg-muted)] py-2.5 pl-9 pr-4 text-sm text-[var(--admin-text)] placeholder-[var(--admin-text-faint)] outline-none focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/40"
          />
        </div>

        {/* Stats — gradient cards in the notifications style */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5">
            <p className="text-xs font-medium text-[var(--admin-text-muted)] uppercase tracking-wider mb-2">Всего клиентов</p>
            <p className="text-2xl font-bold text-[var(--admin-text)]">{customers.length}</p>
          </div>
          <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5">
            <p className="text-xs font-medium text-[var(--admin-text-muted)] uppercase tracking-wider mb-2">Администраторы</p>
            <p className="text-2xl font-bold text-[var(--admin-text)]">
              {customers.filter((c) => c.role === 'admin').length}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5">
            <p className="text-xs font-medium text-[var(--admin-text-muted)] uppercase tracking-wider mb-2">С телефоном</p>
            <p className="text-2xl font-bold text-[var(--admin-text)]">
              {customers.filter((c) => c.phone).length}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5">
            <p className="text-xs font-medium text-[var(--admin-text-muted)] uppercase tracking-wider mb-2">Верифицированы</p>
            <p className="text-2xl font-bold text-[var(--admin-text)]">
              {customers.filter((c) => c.emailVerified).length}
            </p>
          </div>
        </div>

        {/* Customers list — expandable cards like /admin/notifications */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-[var(--admin-bg-muted)]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <User className="h-16 w-16 mx-auto text-[var(--admin-text-faint)] mb-4" />
            <p className="text-[var(--admin-text-muted)] text-lg">Клиентов не найдено</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((c) => {
                const isOpen = expandedId === c.id;
                return (
                  <motion.div
                    key={c.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedId(isOpen ? null : c.id)}
                      className="w-full px-6 py-4 flex items-center gap-4 hover:bg-[var(--admin-card-hover)] transition-colors"
                    >
                      {avatar(c) ? (
                        <img
                          src={avatar(c)}
                          alt=""
                          className="h-12 w-12 rounded-xl object-cover ring-2 ring-[var(--admin-accent)]/30"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                          {(c.firstName || c.email)[0].toUpperCase()}
                        </div>
                      )}

                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-[var(--admin-text)] truncate">
                            {displayName(c)}
                          </p>
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                              ROLE_BADGE[c.role] || ROLE_BADGE.customer
                            }`}
                          >
                            {c.role}
                          </span>
                          {c.emailVerified && (
                            <span
                              title="Email подтверждён"
                              className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                            >
                              <BadgeCheck className="h-3 w-3" />
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[var(--admin-text-muted)] truncate">{c.email}</p>
                      </div>

                      <div className="hidden sm:flex flex-col items-end text-right">
                        <p className="text-xs text-[var(--admin-text-muted)]">
                          {formatLastSignIn(c.lastSignIn)}
                        </p>
                        <p className="text-[10px] text-[var(--admin-text-faint)]">
                          {new Date(c.createdAt).toLocaleDateString('ru-RU')}
                        </p>
                      </div>

                      {isOpen ? (
                        <ChevronDown className="h-5 w-5 text-[var(--admin-text-faint)] shrink-0" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-[var(--admin-text-faint)] shrink-0" />
                      )}
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-[var(--admin-border)]"
                        >
                          <div className="p-6 grid sm:grid-cols-2 gap-4">
                            <div className="rounded-xl border border-[var(--admin-border)] p-4 bg-[var(--admin-bg-muted)]">
                              <p className="text-[10px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wider mb-2">
                                Контакты
                              </p>
                              <div className="space-y-1.5 text-sm">
                                <p className="flex items-center gap-2 text-[var(--admin-text)]">
                                  <Mail className="h-3.5 w-3.5 text-[var(--admin-text-faint)]" />
                                  {c.email}
                                </p>
                                {c.phone && (
                                  <p className="flex items-center gap-2 text-[var(--admin-text)]">
                                    <Phone className="h-3.5 w-3.5 text-[var(--admin-text-faint)]" />
                                    {c.phone}
                                  </p>
                                )}
                                {!c.phone && (
                                  <p className="text-[var(--admin-text-faint)] text-xs">Телефон не указан</p>
                                )}
                              </div>
                            </div>

                            <div className="rounded-xl border border-[var(--admin-border)] p-4 bg-[var(--admin-bg-muted)]">
                              <p className="text-[10px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wider mb-2">
                                Активность
                              </p>
                              <div className="space-y-1.5 text-sm">
                                <p className="flex items-center gap-2 text-[var(--admin-text)]">
                                  <ShieldCheck className="h-3.5 w-3.5 text-[var(--admin-text-faint)]" />
                                  Последний вход: {formatLastSignIn(c.lastSignIn)}
                                </p>
                                <p className="flex items-center gap-2 text-[var(--admin-text)]">
                                  <Calendar className="h-3.5 w-3.5 text-[var(--admin-text-faint)]" />
                                  Зарегистрирован: {new Date(c.createdAt).toLocaleDateString('ru-RU')}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Привязанные аккаунты */}
                          <div className="px-6 pb-2">
                            <div className="rounded-xl border border-[var(--admin-border)] p-4 bg-[var(--admin-bg-muted)]">
                              <p className="text-[10px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <Link2 className="h-3.5 w-3.5" /> Привязанные аккаунты
                              </p>
                              {connLoading === c.id && !connections[c.id] ? (
                                <div className="flex items-center gap-2 text-xs text-[var(--admin-text-faint)]">
                                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--admin-accent)] border-t-transparent" />
                                  Загрузка...
                                </div>
                              ) : (connections[c.id]?.length ?? 0) > 0 ? (
                                <div className="space-y-2">
                                  {connections[c.id].map((conn) => (
                                    <div key={conn.provider} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] p-2.5">
                                      <div className="min-w-0">
                                        <p className="text-xs font-semibold text-[var(--admin-text)]">{conn.provider === 'google' ? 'Google' : 'Telegram'}</p>
                                        <p className="text-xs text-[var(--admin-text-faint)] truncate">{conn.label}</p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => unlinkConnection(c.id, conn.provider)}
                                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                                      >
                                        <Unlink className="h-3.5 w-3.5" /> Отвязать
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-[var(--admin-text-faint)]">Нет привязанных аккаунтов (Google / Telegram)</p>
                              )}
                            </div>
                          </div>

                          <div className="px-6 pb-5 flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditing({ ...c })}
                              className="inline-flex items-center gap-2 rounded-xl bg-[var(--admin-accent)] px-3.5 py-2 text-sm font-medium text-white hover:opacity-90 transition-colors"
                            >
                              <Edit3 className="h-4 w-4" />
                              Редактировать
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteCustomer(c.id)}
                              className="inline-flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-3.5 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                              Удалить
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[var(--admin-bg-elevated)] border border-[var(--admin-border)] rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--admin-border)]">
              <h2 className="text-sm font-bold text-[var(--admin-text)]">Редактировать клиента</h2>
              <button onClick={() => setEditing(null)} className="text-[var(--admin-text-faint)] hover:text-[var(--admin-text)] transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  {avatar(editing) ? (
                    <img src={avatar(editing)} alt="" className="h-14 w-14 rounded-full object-cover ring-2 ring-[var(--admin-accent)]/30" />
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
                  <p className="text-sm font-medium text-[var(--admin-text)]">{displayName(editing)}</p>
                  <p className="text-xs text-[var(--admin-text-faint)]">{editing.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] font-semibold text-[var(--admin-text-muted)] uppercase mb-1.5">Email</label>
                  <input type="email" value={editing.email || ''}
                    onChange={e => setEditing(prev => prev ? { ...prev, email: e.target.value } : prev)}
                    className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg-muted)] px-3 py-2.5 text-sm text-[var(--admin-text)] placeholder-[var(--admin-text-faint)] outline-none focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/40" />
                </div>
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
                    {['customer','admin','manager','support'].map(r => <option key={r} value={r} className="bg-[var(--admin-bg-elevated)]">{r}</option>)}
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
