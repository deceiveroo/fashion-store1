'use client';

import { ImageIcon, FileText, BookOpen } from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';

export default function AdminContentPage() {
  return (
    <AdminShell>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-white">Контент</h1>
          <p className="text-sm text-white/40">Слайдер, страницы, блог</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: ImageIcon, title: 'Слайдер главной', desc: 'JSON в ключе homepage_slides таблицы settings', color: 'text-violet-400 bg-violet-500/10' },
            { icon: FileText, title: 'Статические страницы', desc: 'О компании, контакты — markdown в settings', color: 'text-blue-400 bg-blue-500/10' },
            { icon: BookOpen, title: 'Блог', desc: 'Добавьте таблицу blog_posts и drizzle push', color: 'text-emerald-400 bg-emerald-500/10' },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color} mb-4`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-white">{title}</h3>
              <p className="mt-1 text-xs text-white/30">{desc}</p>
              <div className="mt-4 rounded-lg border border-dashed border-white/10 px-3 py-2 text-[10px] text-white/20 text-center">
                В разработке
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
