'use client';

import { ReactNode, useState, useEffect, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  LayoutDashboard, Package, ShoppingCart, Users, MessageCircle,
  Shield, Tag, LineChart, Settings, LogOut, Menu, X, Home,
  Bell, Moon, Sun, ChevronRight, Zap,
} from 'lucide-react';
import { useTheme } from 'next-themes';

// ─── Context ────────────────────────────────────────────────────────────────
type SidebarCtx = { open: boolean; toggle: () => void; mobile: boolean };
const Ctx = createContext<SidebarCtx>({ open: true, toggle: () => {}, mobile: false });
const useSidebar = () => useContext(Ctx);

// ─── Nav config ─────────────────────────────────────────────────────────────
const NAV = [
  {
    group: 'Основное',
    items: [
      { label: 'Дашборд',   href: '/admin/dashboard',      icon: LayoutDashboard, roles: ['admin','manager','support'] },
      { label: 'Заказы',    href: '/admin/orders',          icon: ShoppingCart,    roles: ['admin','manager','support'] },
      { label: 'Товары',    href: '/admin/products',        icon: Package,         roles: ['admin','manager'] },
      { label: 'Клиенты',   href: '/admin/customers',       icon: Users,           roles: ['admin','manager','support'] },
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
      { label: 'Категории', href: '/admin/categories',      icon: Tag,             roles: ['admin','manager'] },
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
        fixed inset-y-0 left-0 z-50 flex flex-col bg-[#0f0f1a] border-r border-white/5
        transition-all duration-300 ease-in-out
        ${open ? 'w-64' : 'w-0 overflow-hidden'}
        lg:sticky lg:top-0 lg:h-screen
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/5">
          <Link href="/admin/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-white tracking-tight">Fashion Admin</span>
          </Link>
          {mobile && (
            <button onClick={toggle} className="text-white/40 hover:text-white transition-colors">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Back to site */}
        <div className="px-3 py-3 border-b border-white/5">
          <Link href="/" className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-white/50 hover:text-white hover:bg-white/5 transition-all">
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
                <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/25">{group}</p>
                <ul className="space-y-0.5">
                  {visible.map(({ label, href, icon: Icon }) => {
                    const active = pathname === href || pathname.startsWith(href + '/');
                    return (
                      <li key={href}>
                        <Link
                          href={href}
                          onClick={() => mobile && toggle()}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                            active
                              ? 'bg-violet-500/15 text-violet-300 shadow-sm'
                              : 'text-white/50 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-violet-400' : ''}`} />
                          {label}
                          {active && <ChevronRight className="ml-auto h-3 w-3 text-violet-400/60" />}
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
        <div className="border-t border-white/5 p-3">
          <div className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2.5 mb-2">
            {session?.user?.image ? (
              <img src={session.user.image} alt="" className="h-8 w-8 rounded-full object-cover ring-2 ring-violet-500/30" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-bold text-white">
                {session?.user?.name?.[0] || 'A'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{session?.user?.name || 'Admin'}</p>
              <p className="text-[10px] text-white/40 truncate">{role}</p>
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
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  const title = NAV.flatMap(s => s.items).find(i => pathname === i.href || pathname.startsWith(i.href + '/'))?.label ?? 'Админ';

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-white/5 bg-[#0a0a14]/80 backdrop-blur-xl px-4 md:px-6">
      <button onClick={toggle} className="text-white/40 hover:text-white transition-colors lg:hidden">
        <Menu className="h-5 w-5" />
      </button>
      <button onClick={toggle} className="hidden lg:flex text-white/20 hover:text-white/60 transition-colors">
        <Menu className="h-4 w-4" />
      </button>

      <h1 className="text-sm font-semibold text-white">{title}</h1>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button className="relative flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-violet-500" />
        </button>
      </div>
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

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a14]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (status === 'unauthenticated' || !['admin', 'manager', 'support'].includes(role)) {
    if (typeof window !== 'undefined') router.replace(`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`);
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a14]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <Ctx.Provider value={{ open, toggle: () => setOpen(p => !p), mobile }}>
      <div className="flex min-h-screen bg-[#0a0a14] text-white">
        <Sidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <Header />
          <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </Ctx.Provider>
  );
}
