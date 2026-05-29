'use client';

import { useState } from 'react';
import { Save, Store, DollarSign, Percent } from 'lucide-react';
import { toast } from 'sonner';
import AdminShell from '@/components/admin/AdminShell';
import MaintenanceSettings from '@/components/admin/MaintenanceSettings';

export default function AdminSettingsPage() {
  const [storeName, setStoreName] = useState('ELEVATE');
  const [currency, setCurrency] = useState('₽');
  const [tax, setTax] = useState('20');

  const save = () => {
    localStorage.setItem('admin_store_prefs', JSON.stringify({ storeName, currency, tax }));
    toast.success('Сохранено');
  };

  return (
    <AdminShell>
      <div className="max-w-4xl space-y-8">
        <div>
          <h1 className="text-xl font-bold text-[var(--admin-text)]">Настройки</h1>
          <p className="text-sm text-[var(--admin-text-muted)]">Общие параметры магазина и режим обслуживания</p>
        </div>

        {/* General Settings */}
        <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5 space-y-4 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--admin-text)] mb-4">Общие настройки</h2>
          {[
            { label: 'Название магазина', value: storeName, onChange: setStoreName, icon: Store, type: 'text' },
            { label: 'Валюта', value: currency, onChange: setCurrency, icon: DollarSign, type: 'text' },
            { label: 'НДС %', value: tax, onChange: setTax, icon: Percent, type: 'number' },
          ].map(({ label, value, onChange, icon: Icon, type }) => (
            <div key={label}>
              <label className="block text-[10px] font-semibold text-[var(--admin-text-faint)] uppercase tracking-wider mb-1.5">{label}</label>
              <div className="relative">
                <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-text-faint)]" />
                <input type={type} value={value} onChange={e => onChange(e.target.value)}
                  className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg-muted)] py-2.5 pl-10 pr-4 text-sm text-[var(--admin-text)] outline-none focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/40 transition-colors" />
              </div>
            </div>
          ))}

          <button onClick={save}
            className="flex items-center gap-2 rounded-lg bg-[var(--admin-accent)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity">
            <Save className="h-4 w-4" />
            Сохранить
          </button>
        </div>

        {/* Maintenance Mode Settings */}
        <MaintenanceSettings />

        <p className="text-xs text-[var(--admin-text-faint)]">
          Для production подключите API /api/site-config и сохраняйте настройки в БД.
        </p>
      </div>
    </AdminShell>
  );
}
