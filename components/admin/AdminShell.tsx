'use client';

import { ReactNode, useState, useEffect, createContext, useContext, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  LayoutDashboard, Package, ShoppingCart, Users, MessageCircle,
  Shield, Tag, LineChart, Settings, LogOut, Menu, X, Home,
  Bell, ChevronRight, Zap, Search, Command, BadgeCheck,
  Plus, TrendingUp, AlertCircle, CheckCircle2, Sparkles, Star,
} from 'lucide-react';
import CommandPalette from './CommandPalette';
import AnimatedGradient from './AnimatedGradient';
import { AdminThemeToggle } from './AdminThemeToggle';

// ─── Context ────────────────────────────────────────────────────────────────
type SidebarCtx = { open: boolean; toggle: () => void; mobile: boolean };
const Ctx = createContext<SidebarCtx>({ open: true, toggle: () => {}, mobile: false });
const useSidebar = () => useContext(Ctx);

// ─── Notifications Context ─────────────────────────────────────────────────
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
}

type NotifCtx = {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
};

const NotifContext = createContext<NotifCtx>({
  notifications: [],
  unreadCount: 0,
  addNotification: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  clearAll: () => {},
});

export const useNotifications = () => useContext(NotifContext);

// ─── Nav config ─────────────────────────────────────────────────────────────
const NAV = [
  {
    group: 'Основное',
    items: [
      { label: 'Дашборд',   href: '/admin/dashboard',      icon: LayoutDashboard, roles: ['admin','manager','support'] },
      { label: 'Заказы',    href: '/admin/orders',          icon: ShoppingCart,    roles: ['admin','manager','support'] },
      { label: 'Товары',    href: '/admin/products',        icon: Package,         roles: ['admin','manager'] },
      { label: 'Клиенты',   href: '/admin/customers',       icon: Users,           roles: ['admin','manager','support'] },
      { label: 'Отзывы',    href: '/admin/reviews',         icon: Star,            roles: ['admin','manager','support'] },
      { label: 'Чаты',      href: '/admin/support-chats',   icon: MessageCircle,   roles: ['admin','manager','support'] },
    ],
  },
  {
    group: 'Аналитика',
    items: [
      { label: 'Аналитика', href: '/admin/analytics',       icon: LineChart,       roles: ['admin','manager'] },
    ],
  },
  {
    group: 'Управление',
    items: [
      { label: 'Команда',   href: '/admin/users',           icon: Shield,          roles: ['admin'] },
      { label: 'Верификации', href: '/admin/verification-requests', icon: BadgeCheck, roles: ['admin','manager'] },
      { label: 'Категории', href: '/admin/categories',      icon: Tag,             roles: ['admin','manager'] },
      { label: 'Промокоды', href: '/admin/coupons',         icon: Sparkles,        roles: ['admin','manager'] },
      { label: 'Уведомления', href: '/admin/notifications', icon: Bell,            roles: ['admin','manager'] },
      { label: 'Настройки', href: '/admin/settings',        icon: Settings,        roles: ['admin'] },
    ],
  },
];

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function Sidebar() {
  const { open, toggle, mobile } = useSidebar();
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role ?? '';

  return (
    <>
      {mobile && open && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={toggle} />
      )}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex flex-col bg-[var(--admin-sidebar)] border-r border-[var(--admin-border)]
        transition-all duration-300 ease-in-out
        ${open ? 'w-64' : 'w-0 overflow-hidden'}
        lg:sticky lg:top-0 lg:h-screen
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-[var(--admin-border)]">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight text-[var(--admin-text)]">Fashion Admin</span>
          </Link>
          {mobile && (
            <button onClick={toggle} className="text-[var(--admin-text-muted)] hover:text-[var(--admin-text)] transition-colors">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Back to site */}
        <div className="px-3 py-3 border-b border-[var(--admin-border)]">
          <Link href="/" className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-[var(--admin-text-muted)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-card-hover)] transition-all">
            <Home className="h-4 w-4" />
            На сайт
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {NAV.map(({ group, items }) => {
            const visible = items.filter(i => i.roles.includes(role));
            if (!visible.length) return null;
            return (
              <div key={group}>
                <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--admin-text-faint)]">{group}</p>
                <ul className="space-y-0.5">
                  {visible.map(({ label, href, icon: Icon }) => {
                    const active = pathname === href || pathname.startsWith(href + '/');
                    return (
                      <li key={href}>
                        <Link
                          href={href}
                          onClick={() => mobile && toggle()}
                          style={active ? { backgroundImage: 'var(--admin-accent-gradient)', boxShadow: '0 8px 20px -6px var(--admin-glow)' } : undefined}
                          className={`group/nav relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all admin-spring ${
                            active
                              ? 'text-white'
                              : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-card-hover)]'
                          }`}
                        >
                          <Icon className={`h-4 w-4 shrink-0 transition-colors ${active ? 'text-white' : 'group-hover/nav:text-[var(--admin-accent)]'}`} />
                          {label}
                          {active && <ChevronRight className="ml-auto h-3.5 w-3.5 text-white/70" />}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-[var(--admin-border)] p-3">
          <div className="flex items-center gap-3 rounded-lg bg-[var(--admin-card)] px-3 py-2.5 mb-2">
            {session?.user?.image ? (
              <div className="relative h-8 w-8 rounded-full ring-2 ring-violet-500/30 overflow-hidden">
                <Image
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-bold text-white">
                {session?.user?.name?.[0] || 'A'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-medium text-[var(--admin-text)]">{session?.user?.name || 'Admin'}</p>
              <p className="text-[10px] text-[var(--admin-text-muted)] truncate">{role}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Выйти
          </button>
        </div>
      </aside>
    </>
  );
}

// ─── Header ──────────────────────────────────────────────────────────────────
function Header() {
  const { toggle } = useSidebar();
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { notifications, unreadCount, markAllAsRead, clearAll } = useNotifications();

  const title = NAV.flatMap(s => s.items).find(i => pathname === i.href || pathname.startsWith(i.href + '/'))?.label ?? 'Админ';

  // Keyboard shortcut for search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-[var(--admin-border)] bg-[var(--admin-header)] backdrop-blur-xl px-4 md:px-6">
      <button onClick={toggle} className="text-[var(--admin-text-muted)] hover:text-[var(--admin-text)] transition-colors lg:hidden">
        <Menu className="h-5 w-5" />
      </button>
      <button onClick={toggle} className="hidden lg:flex text-[var(--admin-text-faint)] hover:text-[var(--admin-text)]/60 transition-colors">
        <Menu className="h-4 w-4" />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-md relative">
        <button
          onClick={() => setShowCommandPalette(true)}
          className="w-full flex items-center gap-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] py-1.5 pl-3 pr-16 text-left text-xs text-[var(--admin-text-faint)] hover:border-violet-500/30 hover:bg-white/[0.07] transition-all"
        >
          <Search className="h-4 w-4" />
          <span>Поиск...</span>
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-1 rounded border border-[var(--admin-border)] bg-[var(--admin-card)] px-1.5 py-0.5 text-[10px] font-mono">
            <Command className="h-3 w-3" />K
          </kbd>
        </button>
      </div>

      <h1 className="hidden text-sm font-semibold text-[var(--admin-text)] md:block">{title}</h1>

      <div className="ml-auto flex items-center gap-1.5">
        {/* Quick Actions */}
        <div className="relative">
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--admin-text-muted)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-card-hover)] transition-all"
          >
            <Sparkles className="h-4 w-4" />
          </button>
          {showQuickActions && (
            <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)] shadow-xl py-2">
              <div className="px-3 py-2 text-[10px] font-semibold text-[var(--admin-text-faint)] uppercase">Быстрые действия</div>
              {[
                { label: 'Новый товар', href: '/admin/products/new', icon: Plus },
                { label: 'Новый заказ', href: '/admin/orders', icon: ShoppingCart },
                { label: 'Аналитика', href: '/admin/analytics', icon: TrendingUp },
              ].map(({ label, href, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setShowQuickActions(false)}
                  className="flex items-center gap-3 px-3 py-2 text-xs text-white/60 hover:text-[var(--admin-text)] hover:bg-[var(--admin-card-hover)] transition-colors"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </div>
          )}
        </div>

        <AdminThemeToggle />

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[var(--admin-text-muted)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-card-hover)] transition-all"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-500 px-1 text-[9px] font-bold text-white ring-2 ring-[var(--admin-bg)]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)] shadow-xl">
              <div className="flex items-center justify-between border-b border-[var(--admin-border)] px-4 py-3">
                <span className="text-xs font-semibold text-[var(--admin-text)]">Уведомления</span>
                <div className="flex gap-2">
                  {notifications.length > 0 && (
                    <>
                      <button 
                        onClick={markAllAsRead}
                        className="text-[10px] text-violet-400 hover:text-violet-300 transition-colors"
                      >
                        Все прочитаны
                      </button>
                      <button 
                        onClick={clearAll}
                        className="text-[10px] text-red-400 hover:text-red-300 transition-colors"
                      >
                        Очистить
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[var(--admin-text-faint)]">
                    <Bell className="mx-auto mb-2 h-8 w-8 opacity-20" />
                    Нет уведомлений
                  </div>
                ) : (
                  notifications.slice(0, 10).map((notif) => (
                    <div
                      key={notif.id}
                      className={`border-b border-[var(--admin-border)] px-4 py-3 hover:bg-[var(--admin-card-hover)] transition-colors ${
                        !notif.read ? 'bg-violet-500/5' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {notif.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />}
                        {notif.type === 'warning' && <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />}
                        {notif.type === 'error' && <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />}
                        {notif.type === 'info' && <Bell className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[var(--admin-text)]">{notif.title}</p>
                          <p className="text-[10px] text-[var(--admin-text-muted)] mt-0.5">{notif.message}</p>
                          <p className="text-[9px] text-[var(--admin-text-faint)] mt-1">
                            {notif.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Command Palette */}
      <CommandPalette isOpen={showCommandPalette} onClose={() => setShowCommandPalette(false)} />
    </header>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────
export default function AdminShell({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [mobile, setMobile] = useState(false);
  
  // Notifications state - load from localStorage on mount
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('admin-notifications');
        if (saved) {
          const parsed = JSON.parse(saved);
          return parsed.map((n: any) => ({
            ...n,
            timestamp: new Date(n.timestamp),
          }));
        }
      } catch (e) {
        console.error('Failed to load notifications:', e);
      }
    }
    return [];
  });
  
  useEffect(() => {
    const check = () => {
      const m = window.innerWidth < 1024;
      setMobile(m);
      setOpen(!m);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const role = session?.user?.role ?? '';

  // Notification handlers
  const addNotification = useCallback((n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: Notification = {
      ...n,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false,
    };
    setNotifications(prev => {
      const updated = [newNotif, ...prev].slice(0, 50); // Keep last 50
      // Save to localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('admin-notifications', JSON.stringify(updated));
        } catch (e) {
          console.error('Failed to save notifications:', e);
        }
      }
      return updated;
    });
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      // Save to localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('admin-notifications', JSON.stringify(updated));
        } catch (e) {
          console.error('Failed to save notifications:', e);
        }
      }
      return updated;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      // Save to localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('admin-notifications', JSON.stringify(updated));
        } catch (e) {
          console.error('Failed to save notifications:', e);
        }
      }
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    // Clear from localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('admin-notifications');
      } catch (e) {
        console.error('Failed to clear notifications:', e);
      }
    }
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Show welcome notification on first visit
  useEffect(() => {
    if (status === 'authenticated' && notifications.length === 0) {
      const hasSeenWelcome = localStorage.getItem('admin-welcome-shown');
      if (!hasSeenWelcome) {
        setTimeout(() => {
          addNotification({
            type: 'info',
            title: 'Добро пожаловать!',
            message: 'Это система уведомлений админ-панели. Здесь будут отображаться важные события.',
          });
          localStorage.setItem('admin-welcome-shown', 'true');
        }, 1000);
      }
    }
  }, [status, notifications.length, addNotification]);

  return (
    <Ctx.Provider value={{ open, toggle: () => setOpen(p => !p), mobile }}>
      <NotifContext.Provider value={{ notifications, unreadCount, addNotification, markAsRead, markAllAsRead, clearAll }}>
        <AnimatedGradient />
        <div data-admin-theme className="relative z-[1] flex min-h-screen bg-[var(--admin-bg)] text-[var(--admin-text)]">
          <Sidebar />
          <div className="flex flex-1 flex-col min-w-0 relative z-10">
            <Header />
            <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
          </div>
        </div>
      </NotifContext.Provider>
    </Ctx.Provider>
  );
}
