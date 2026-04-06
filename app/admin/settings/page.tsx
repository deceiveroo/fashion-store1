'use client';

import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

export default function AdminSettingsPage() {
  const [storeName, setStoreName] = useState('ELEVATE');
  const [currency, setCurrency] = useState('₽');
  const [tax, setTax] = useState('20');

  const save = () => {
    localStorage.setItem('admin_store_prefs', JSON.stringify({ storeName, currency, tax }));
    toast.success('Сохранено локально (подключите API settings для продакшена)');
  };

  return (
    <AdminLayout currentPage="settings">
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Настройки магазина</h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">Общие параметры (демо: localStorage)</p>
        </div>
        <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <label className="block text-sm font-medium">Название магазина</label>
          <input
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
          />
          <label className="block text-sm font-medium">Валюта</label>
          <input
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          />
          <label className="block text-sm font-medium">НДФЛ / налог %</label>
          <input
            type="number"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            value={tax}
            onChange={(e) => setTax(e.target.value)}
          />
          <button
            type="button"
            onClick={save}
            className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-white hover:bg-violet-700"
          >
            <Save className="h-4 w-4" />
            Сохранить
          </button>
        </div>
        <p className="text-xs text-zinc-500">
          Stripe / SMTP: задайте переменные окружения и расширьте API `/api/site-config` при необходимости.
        </p>
      </div>
    </AdminLayout>
  );
}
