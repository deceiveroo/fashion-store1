'use client';

import { useState } from 'react';
import { Save, Store, DollarSign, Percent } from 'lucide-react';
import { toast } from 'sonner';
import AdminShell from '@/components/admin/AdminShell';

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
      <div className="max-w-xl space-y-5">
        <div>
          <h1 className="text-xl font-bold text-white">Настройки</h1>
          <p className="text-sm text-white/40">Общие параметры магазина</p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 space-y-4">
          {[
            { label: 'Название магазина', value: storeName, onChange: setStoreName, icon: Store, type: 'text' },
            { label: 'Валюта', value: currency, onChange: setCurrency, icon: DollarSign, type: 'text' },
            { label: 'НДС %', value: tax, onChange: setTax, icon: Percent, type: 'number' },
          ].map(({ label, value, onChange, icon: Icon, type }) => (
            <div key={label}>
              <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1.5">{label}</label>
              <div className="relative">
                <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
                <input type={type} value={value} onChange={e => onChange(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white focus:border-violet-500/50 focus:outline-none" />
              </div>
            </div>
          ))}

          <button onClick={save}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 transition-colors">
            <Save className="h-4 w-4" />
            Сохранить
          </button>
        </div>

        <p className="text-xs text-white/20">
          Для production подключите API /api/site-config и сохраняйте настройки в БД.
        </p>
      </div>
    </AdminShell>
  );
}
