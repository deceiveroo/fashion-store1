'use client';

import AdminLayout from '@/components/AdminLayout';
import { Tag, Mail, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

export default function AdminMarketingPage() {
  return (
    <AdminLayout currentPage="marketing">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Маркетинг</h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">Купоны, брошенные корзины, email</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Link
            href="/api/admin/stats"
            className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-violet-300 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <Tag className="mb-2 h-8 w-8 text-violet-600" />
            <h2 className="font-semibold text-zinc-900 dark:text-white">Купоны</h2>
            <p className="mt-1 text-sm text-zinc-500">Управление кодами в БД (таблица coupons)</p>
          </Link>
          <div className="rounded-xl border border-dashed border-zinc-300 p-6 dark:border-zinc-700">
            <ShoppingCart className="mb-2 h-8 w-8 text-zinc-400" />
            <h2 className="font-semibold text-zinc-900 dark:text-white">Брошенные корзины</h2>
            <p className="mt-1 text-sm text-zinc-500">Напоминание по email (мок — подключите SMTP в настройках)</p>
          </div>
          <div className="rounded-xl border border-dashed border-zinc-300 p-6 dark:border-zinc-700">
            <Mail className="mb-2 h-8 w-8 text-zinc-400" />
            <h2 className="font-semibold text-zinc-900 dark:text-white">Шаблоны писем</h2>
            <p className="mt-1 text-sm text-zinc-500">HTML с плейсхолдерами — храните в settings</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
