'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { Search, LayoutDashboard, Package, ShoppingCart, Users, Megaphone, FileText, Settings, BarChart3, Tag, Shield } from 'lucide-react';
import { cn } from '@/lib/cn';

const links = [
  { id: 'dashboard', label: 'Дашборд', href: '/admin/dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'Товары', href: '/admin/products', icon: Package },
  { id: 'orders', label: 'Заказы', href: '/admin/orders', icon: ShoppingCart },
  { id: 'customers', label: 'Клиенты', href: '/admin/customers', icon: Users },
  { id: 'team', label: 'Команда', href: '/admin/users', icon: Shield },
  { id: 'marketing', label: 'Маркетинг', href: '/admin/marketing', icon: Megaphone },
  { id: 'content', label: 'Контент', href: '/admin/content', icon: FileText },
  { id: 'categories', label: 'Категории', href: '/admin/categories', icon: Tag },
  { id: 'reports', label: 'Отчёты', href: '/admin/reports', icon: BarChart3 },
  { id: 'settings', label: 'Настройки', href: '/admin/settings', icon: Settings },
];

export function AdminCommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const down = useCallback((e: KeyboardEvent) => {
    if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setOpen((o) => !o);
    }
    if (e.key === 'Escape') setOpen(false);
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [down]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-500 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
      >
        <Search className="h-4 w-4" />
        <span>Поиск…</span>
        <kbd className="ml-6 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium dark:bg-zinc-800">⌘K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden />
          <Command className="relative w-full max-w-lg overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-950">
            <div className="flex items-center border-b border-zinc-200 px-3 dark:border-zinc-800">
              <Search className="mr-2 h-4 w-4 shrink-0 text-zinc-400" />
              <Command.Input
                placeholder="Разделы админки…"
                className="flex h-12 w-full bg-transparent py-3 text-sm outline-none placeholder:text-zinc-400"
              />
            </div>
            <Command.List className="max-h-72 overflow-y-auto p-2">
              <Command.Empty className="py-6 text-center text-sm text-zinc-500">Ничего не найдено</Command.Empty>
              {links.map(({ id, label, href, icon: Icon }) => (
                <Command.Item
                  key={id}
                  value={`${label} ${id}`}
                  onSelect={() => {
                    setOpen(false);
                    router.push(href);
                  }}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm',
                    'data-[selected=true]:bg-violet-100 data-[selected=true]:text-violet-900',
                    'dark:data-[selected=true]:bg-violet-900/40 dark:data-[selected=true]:text-violet-100'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-70" />
                  {label}
                </Command.Item>
              ))}
            </Command.List>
          </Command>
        </div>
      )}
    </>
  );
}
