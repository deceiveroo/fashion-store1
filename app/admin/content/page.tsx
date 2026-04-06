'use client';

import AdminLayout from '@/components/AdminLayout';
import { ImageIcon, FileText, BookOpen } from 'lucide-react';

export default function AdminContentPage() {
  return (
    <AdminLayout currentPage="content">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Контент</h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">Слайдер, страницы, блог</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <ImageIcon className="mb-2 h-8 w-8 text-violet-600" />
            <h2 className="font-semibold">Слайдер главной</h2>
            <p className="mt-2 text-sm text-zinc-500">JSON в ключе `homepage_slides` таблицы settings (редактор в разработке)</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <FileText className="mb-2 h-8 w-8 text-violet-600" />
            <h2 className="font-semibold">Статические страницы</h2>
            <p className="mt-2 text-sm text-zinc-500">О компании, контакты — markdown в settings или отдельные routes</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <BookOpen className="mb-2 h-8 w-8 text-violet-600" />
            <h2 className="font-semibold">Блог</h2>
            <p className="mt-2 text-sm text-zinc-500">При необходимости добавьте таблицу blog_posts и drizzle push</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
