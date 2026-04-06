'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Megaphone,
  FileText,
  Settings,
  BarChart3,
  Tag,
  LogOut,
  Menu,
  X,
  LineChart,
  Shield,
  Home,
  ChevronLeft,
  MessageCircle,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { ThemeToggle } from '@/components/admin/ThemeToggle';
import { AdminCommandPalette } from '@/components/admin/AdminCommandPalette';
import { AdminKeyboardShortcuts } from '@/components/admin/AdminKeyboardShortcuts';
import { AdminOrderPoller } from '@/components/admin/AdminOrderPoller';

export type AdminPageId =
  | 'dashboard'
  | 'products'
  | 'orders'
  | 'customers'
  | 'users'
  | 'marketing'
  | 'content'
  | 'categories'
  | 'analytics'
  | 'reports'
  | 'settings'
  | 'support-chats';

interface AdminLayoutProps {
  children: ReactNode;
  currentPage: AdminPageId;
}

const nav = [
  { id: 'dashboard' as const, label: 'Дашборд', href: '/admin/dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'support'] },
  { id: 'products' as const, label: 'Товары', href: '/admin/products', icon: Package, roles: ['admin', 'manager', 'support'] },
  { id: 'orders' as const, label: 'Заказы', href: '/admin/orders', icon: ShoppingCart, roles: ['admin', 'manager', 'support'] },
  { id: 'customers' as const, label: 'Клиенты', href: '/admin/customers', icon: Users, roles: ['admin', 'manager', 'support'] },
  { id: 'support-chats' as const, label: 'Чаты', href: '/admin/support-chats', icon: MessageCircle, roles: ['admin', 'manager', 'support'] },
  { id: 'users' as const, label: 'Команда', href: '/admin/users', icon: Shield, roles: ['admin'] },
  { id: 'categories' as const, label: 'Категории', href: '/admin/categories', icon: Tag, roles: ['admin', 'manager'] },
  { id: 'analytics' as const, label: 'Аналитика', href: '/admin/analytics', icon: LineChart, roles: ['admin', 'manager', 'support'] },
  { id: 'reports' as const, label: 'Отчёты', href: '/admin/reports', icon: BarChart3, roles: ['admin', 'manager', 'support'] },
  { id: 'settings' as const, label: 'Настройки', href: '/admin/settings', icon: Settings, roles: ['admin'] },
];

export default function AdminLayout({ children, currentPage }: AdminLayoutProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const role = session?.user?.role ?? '';

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 to-zinc-50 dark:from-zinc-950 dark:to-violet-950">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">Загрузка...</p>
        </div>
      </div>
    );
  }

  const filtered = nav.filter((item) => item.roles.includes(role));

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-zinc-50 to-violet-50/30 text-zinc-900 dark:from-zinc-950 dark:to-violet-950/30 dark:text-zinc-100">
      <AdminKeyboardShortcuts />
      <AdminOrderPoller />

      <div className={cn('fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden', sidebarOpen ? 'block' : 'hidden')} onClick={() => setSidebarOpen(false)} />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 transform border-r border-zinc-200/50 bg-white/95 backdrop-blur-xl transition-transform dark:border-zinc-800/50 dark:bg-zinc-900/95 lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-zinc-200/50 px-6 dark:border-zinc-800/50">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 text-white shadow-lg">
              <LayoutDashboard className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-violet-700 to-purple-700 bg-clip-text text-transparent dark:from-violet-400 dark:to-purple-400">
              Fashion Admin
            </span>
          </Link>
          <button type="button" className="lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Закрыть">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Back to Site Button */}
        <div className="border-b border-zinc-200/50 p-4 dark:border-zinc-800/50">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/40 dark:shadow-violet-500/20"
          >
            <Home className="h-4 w-4" />
            Вернуться на сайт
          </Link>
        </div>

        <nav className="space-y-1 p-4">
          {filtered.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || currentPage === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all',
                  active
                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/30'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/50'
                )}
              >
                <Icon className={cn('h-5 w-5 shrink-0 transition-transform group-hover:scale-110', active && 'drop-shadow-sm')} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-zinc-200/50 bg-white/50 p-4 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/50">
          <div className="mb-3 flex items-center gap-3 rounded-lg bg-zinc-100 p-3 dark:bg-zinc-800/50">
            {session?.user?.image ? (
              <img 
                src={session.user.image} 
                alt="Avatar" 
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-purple-600 text-sm font-bold text-white">
                {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || 'A'}
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <div className="truncate text-sm font-medium">{session?.user?.name || 'Admin'}</div>
              <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">{session?.user?.email}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 transition-all hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/60"
          >
            <LogOut className="h-4 w-4" />
            Выйти
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col lg:pl-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-zinc-200/50 bg-white/80 px-6 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/80">
          <div className="flex items-center gap-4">
            <button type="button" className="lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Меню">
              <Menu className="h-6 w-6" />
            </button>
            <div className="hidden md:block">
              <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {filtered.find((item) => item.id === currentPage)?.label || 'Админ-панель'}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AdminCommandPalette />
            <ThemeToggle />
            <span className="hidden rounded-full bg-gradient-to-r from-violet-100 to-purple-100 px-3 py-1 text-xs font-semibold text-violet-800 dark:from-violet-950 dark:to-purple-950 dark:text-violet-200 md:inline">
              {role}
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
