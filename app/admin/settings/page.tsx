'use client';

import { useState, useEffect } from 'react';
import { Save, Store, DollarSign, Percent, Mail, Phone, Boxes, Trophy, Star, MessageCircle, Trash2, RefreshCw, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import AdminShell from '@/components/admin/AdminShell';
import MaintenanceSettings from '@/components/admin/MaintenanceSettings';

interface GeneralSettings {
  storeName: string;
  currency: string;
  tax: string;
  contactEmail: string;
  contactPhone: string;
  lowStock: string;
  featGamification: boolean;
  featReviews: boolean;
  featChat: boolean;
}

const DEFAULTS: GeneralSettings = {
  storeName: 'ELEVATE', currency: '₽', tax: '20',
  contactEmail: 'ELEVATE111@yandex.com', contactPhone: '+7 (495) 123-45-67', lowStock: '10',
  featGamification: true, featReviews: true, featChat: true,
};

function Toggle({ checked, onChange, label, desc, icon: Icon }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; desc: string; icon: LucideIcon;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg-muted)] p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-[var(--admin-text)]">{label}</p>
          <p className="text-xs text-[var(--admin-text-muted)]">{desc}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? '' : 'bg-[var(--admin-border)]'}`}
        style={checked ? { backgroundImage: 'var(--admin-accent-gradient)' } : undefined}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

export default function AdminSettingsPage() {
  const [form, setForm] = useState<GeneralSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings/general', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : DEFAULTS))
      .then((d) => setForm({ ...DEFAULTS, ...d }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (k: keyof GeneralSettings, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch('/api/admin/settings/general', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(form),
      });
      if (r.ok) toast.success('Настройки сохранены');
      else toast.error('Не удалось сохранить');
    } catch { toast.error('Ошибка'); }
    setSaving(false);
  };

  const clearCache = async () => {
    setClearing(true);
    try {
      const r = await fetch('/api/admin/settings/cache/clear', { method: 'POST', credentials: 'include' });
      const d = await r.json().catch(() => ({}));
      if (r.ok) toast.success(`Кэш очищен (записей: ${d.cleared ?? 0})`);
      else toast.error(d.error || 'Не удалось очистить кэш');
    } catch { toast.error('Ошибка'); }
    setClearing(false);
  };

  const fields = [
    { label: 'Название магазина', key: 'storeName' as const, icon: Store, type: 'text' },
    { label: 'Валюта', key: 'currency' as const, icon: DollarSign, type: 'text' },
    { label: 'НДС %', key: 'tax' as const, icon: Percent, type: 'number' },
    { label: 'Контактный email', key: 'contactEmail' as const, icon: Mail, type: 'email' },
    { label: 'Контактный телефон', key: 'contactPhone' as const, icon: Phone, type: 'text' },
    { label: 'Порог низкого остатка', key: 'lowStock' as const, icon: Boxes, type: 'number' },
  ];

  return (
    <AdminShell>
      <div className="max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--admin-text)]">Настройки</h1>
          <p className="text-sm text-[var(--admin-text-muted)]">Параметры магазина, модули, режим обслуживания</p>
        </div>

        {/* General */}
        <div className="admin-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[var(--admin-text)]">Общие настройки</h2>
          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-[var(--admin-bg-muted)]" />)}</div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {fields.map(({ label, key, icon: Icon, type }) => (
                <div key={key}>
                  <label className="block text-[10px] font-semibold text-[var(--admin-text-faint)] uppercase tracking-wider mb-1.5">{label}</label>
                  <div className="relative">
                    <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-text-faint)]" />
                    <input
                      type={type}
                      value={form[key] as string}
                      onChange={(e) => set(key, e.target.value)}
                      className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg-muted)] py-2.5 pl-10 pr-4 text-sm text-[var(--admin-text)] outline-none focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/40 transition-colors"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Feature Flags */}
        <div className="admin-card p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--admin-text)]">Модули сайта</h2>
            <p className="text-sm text-[var(--admin-text-muted)]">Включайте/выключайте функции магазина</p>
          </div>
          <div className="space-y-3">
            <Toggle icon={Trophy} label="Геймификация" desc="Уровни, достижения, монеты, бейдж в шапке" checked={form.featGamification} onChange={(v) => set('featGamification', v)} />
            <Toggle icon={Star} label="Отзывы" desc="Отзывы и рейтинги товаров" checked={form.featReviews} onChange={(v) => set('featReviews', v)} />
            <Toggle icon={MessageCircle} label="Чат поддержки" desc="Виджет чата и ассистент" checked={form.featChat} onChange={(v) => set('featChat', v)} />
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving || loading}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundImage: 'var(--admin-accent-gradient)' }}
        >
          <Save className="h-4 w-4" />
          {saving ? 'Сохранение…' : 'Сохранить настройки'}
        </button>

        {/* Maintenance */}
        <MaintenanceSettings />

        {/* Danger zone */}
        <div className="rounded-2xl border border-red-300/60 dark:border-red-500/30 bg-red-50/60 dark:bg-red-500/5 p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">Опасная зона</h2>
            <p className="text-sm text-[var(--admin-text-muted)]">Сброс серверного кэша (товары, категории, аналитика, конфиг)</p>
          </div>
          <button
            onClick={clearCache}
            disabled={clearing}
            className="flex items-center gap-2 rounded-xl border border-red-300 dark:border-red-500/40 bg-white dark:bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors disabled:opacity-50"
          >
            {clearing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Очистить кэш
          </button>
        </div>
      </div>
    </AdminShell>
  );
}
