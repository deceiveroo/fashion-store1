'use client';

import { Tag, Mail, ShoppingCart } from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';

export default function AdminMarketingPage() {
  return (
    <AdminShell>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-white">Маркетинг</h1>
          <p className="text-sm text-white/40">Купоны, брошенные корзины, email</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: Tag, title: 'Купоны', desc: 'Управление кодами скидок (таблица coupons в БД)', color: 'text-violet-400 bg-violet-500/10' },
            { icon: ShoppingCart, title: 'Брошенные корзины', desc: 'Напоминание по email — подключите SMTP в настройках', color: 'text-amber-400 bg-amber-500/10' },
            { icon: Mail, title: 'Email шаблоны', desc: 'HTML с плейсхолдерами — храните в settings', color: 'text-blue-400 bg-blue-500/10' },
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
