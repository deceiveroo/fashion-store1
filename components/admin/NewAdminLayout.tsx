'use client';

import { ReactNode, useState, useEffect, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  MessageCircle,
  Shield,
  Tag,
  LineChart,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  ChevronUp,
  Search,
  Bell,
  Moon,
  Sun,
} from 'lucide-react';
import { useTheme } from 'next-themes';

// Sidebar Context
type SidebarContextType = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextType | null>(null);

function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebarContext must be used within SidebarProvider');
  }
  return context;
}

function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  function toggleSidebar() {
    setIsOpen((prev) => !prev);
  }

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen, isMobile, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

// Navigation Data
const NAV_DATA = [
  {
    label: 'MAIN MENU',
    items: [
      { title: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'support'] },
      { title: 'Products', href: '/admin/products', icon: Package, roles: ['admin', 'manager'] },
      { title: 'Orders', href: '/admin/orders', icon: ShoppingCart, roles: ['admin', 'manager', 'support'] },
      { title: 'Customers', href: '/admin/customers', icon: Users, roles: ['admin', 'manager', 'support'] },
      { title: 'Support Chats', href: '/admin/support-chats', icon: MessageCircle, roles: ['admin', 'manager', 'support'] },
    ],
  },
  {
    label: 'ANALYTICS',
    items: [
      { title: 'Analytics', href: '/admin/analytics', icon: LineChart, roles: ['admin', 'manager'] },
      { title: 'Reports', href: '/admin/reports', icon: BarChart3, roles: ['admin', 'manager'] },
      { title: 'Stats', href: '/admin/stats', icon: BarChart3, roles: ['admin', 'manager'] },
    ],
  },
  {
    label: 'SETTINGS',
    items: [
      { title: 'Team', href: '/admin/users', icon: Shield, roles: ['admin'] },
      { title: 'Categories', href: '/admin/categories', icon: Tag, roles: ['admin', 'manager'] },
      { title: 'Settings', href: '/admin/settings', icon: Settings, roles: ['admin'] },
    ],
  },
];

// MenuItem Component
function MenuItem({
  href,
  isActive,
  icon: Icon,
  children,
  onClick,
}: {
  href?: string;
  isActive: boolean;
  icon: any;
  children: ReactNode;
  onClick?: () => void;
}) {
  const { toggleSidebar, isMobile } = useSidebarContext();

  const className = `
    flex items-center gap-3 rounded-lg px-3.5 py-3 font-medium transition-all duration-200
    ${
      isActive
        ? 'bg-[rgba(87,80,241,0.07)] text-primary dark:bg-[#FFFFFF1A] dark:text-white'
        : 'text-dark-4 hover:bg-gray-100 hover:text-dark dark:text-dark-6 dark:hover:bg-[#FFFFFF1A] dark:hover:text-white'
    }
  `;

  if (href) {
    return (
      <Link
        href={href}
        onClick={() => isMobile && toggleSidebar()}
        className={className}
      >
        <Icon className="h-6 w-6 shrink-0" />
        <span>{children}</span>
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={className}>
      <Icon className="h-6 w-6 shrink-0" />
      <span>{children}</span>
    </button>
  );
}

// Sidebar Component
function Sidebar() {
  const pathname = usePathname();
  const { isOpen, setIsOpen, isMobile, toggleSidebar } = useSidebarContext();
  const { data: session } = useSession();
  const role = session?.user?.role ?? '';

  const filteredNav = NAV_DATA.map((section) => ({
    ...section,
    items: section.items.filter((item) => item.roles.includes(role)),
  })).filter((section) => section.items.length > 0);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed bottom-0 top-0 z-50 max-w-[290px] overflow-hidden border-r border-gray-200 bg-white transition-[width] duration-200 ease-linear
          dark:border-gray-800 dark:bg-gray-dark lg:sticky lg:h-screen
          ${isOpen ? 'w-full' : 'w-0'}
        `}
      >
        <div className="flex h-full flex-col py-10 pl-[25px] pr-[7px]">
          {/* Logo */}
          <div className="relative pr-4.5">
            <Link
              href="/admin/dashboard"
              onClick={() => isMobile && toggleSidebar()}
              className="flex items-center gap-2 px-0 py-2.5"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#5750F1] to-[#4338CA] text-white shadow-lg">
                <LayoutDashboard className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-[#5750F1] to-[#4338CA] bg-clip-text text-transparent">
                Fashion Admin
              </span>
            </Link>

            {isMobile && (
              <button
                onClick={toggleSidebar}
                className="absolute left-3/4 right-4.5 top-1/2 -translate-y-1/2 text-right"
              >
                <X className="ml-auto h-7 w-7" />
              </button>
            )}
          </div>

          {/* Back to Site Button */}
          <div className="mt-6 pr-4">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#5750F1] to-[#4338CA] px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:shadow-xl"
            >
              <Home className="h-4 w-4" />
              Back to Site
            </Link>
          </div>

          {/* Navigation */}
          <div className="custom-scrollbar mt-6 flex-1 overflow-y-auto pr-3">
            {filteredNav.map((section) => (
              <div key={section.label} className="mb-6">
                <h2 className="mb-5 text-sm font-medium text-dark-4 dark:text-dark-6">
                  {section.label}
                </h2>

                <nav>
                  <ul className="space-y-2">
                    {section.items.map((item) => (
                      <li key={item.title}>
                        <MenuItem
                          href={item.href}
                          isActive={pathname === item.href}
                          icon={item.icon}
                        >
                          {item.title}
                        </MenuItem>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            ))}
          </div>

          {/* User Info */}
          <div className="border-t border-gray-200 bg-white/50 p-4 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-dark/50">
            <div className="mb-3 flex items-center gap-3 rounded-lg bg-gray-100 p-3 dark:bg-gray-800/50">
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt="Avatar"
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#5750F1] to-[#4338CA] text-sm font-bold text-white">
                  {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || 'A'}
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <div className="truncate text-sm font-medium">{session?.user?.name || 'Admin'}</div>
                <div className="truncate text-xs text-gray-500 dark:text-gray-400">{session?.user?.email}</div>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 transition-all hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/60"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

// Header Component
function Header() {
  const { toggleSidebar, isMobile } = useSidebarContext();
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const role = session?.user?.role ?? '';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stroke bg-white px-4 py-5 shadow-1 dark:border-stroke-dark dark:bg-gray-dark md:px-5 2xl:px-10">
      <button
        onClick={toggleSidebar}
        className="rounded-lg border px-1.5 py-1 dark:border-stroke-dark dark:bg-[#020D1A] hover:dark:bg-[#FFFFFF1A] lg:hidden"
      >
        <Menu className="h-6 w-6" />
      </button>

      {isMobile && (
        <Link href="/admin/dashboard" className="ml-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#5750F1] to-[#4338CA] text-white">
            <LayoutDashboard className="h-4 w-4" />
          </div>
        </Link>
      )}

      <div className="max-xl:hidden">
        <h1 className="mb-0.5 text-heading-5 font-bold text-dark dark:text-white">
          Dashboard
        </h1>
        <p className="font-medium text-gray-600 dark:text-gray-400">Fashion Store Admin Panel</p>
      </div>

      <div className="flex flex-1 items-center justify-end gap-2 min-[375px]:gap-4">
        {/* Search */}
        <div className="relative w-full max-w-[300px]">
          <input
            type="search"
            placeholder="Search..."
            className="flex w-full items-center gap-3.5 rounded-full border bg-gray-2 py-3 pl-[53px] pr-5 outline-none transition-colors focus-visible:border-primary dark:border-dark-3 dark:bg-dark-2 dark:hover:border-dark-4 dark:hover:bg-dark-3 dark:focus-visible:border-primary"
          />
          <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Notifications */}
        <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700">
          <Bell className="h-5 w-5" />
          <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-red-500"></span>
        </button>

        {/* Role Badge */}
        <span className="hidden rounded-full bg-gradient-to-r from-[#5750F1]/10 to-[#4338CA]/10 px-3 py-1 text-xs font-semibold text-[#5750F1] dark:from-[#5750F1]/20 dark:to-[#4338CA]/20 md:inline">
          {role}
        </span>
      </div>
    </header>
  );
}

// Main Layout Component
export default function NewAdminLayout({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const role = session?.user?.role ?? '';

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#5750F1] border-t-transparent" />
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || !['admin', 'manager', 'support'].includes(role)) {
    if (typeof window !== 'undefined') {
      router.replace(`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`);
    }
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#5750F1] border-t-transparent" />
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-gray-2 dark:bg-[#020d1a]">
        <Sidebar />

        <div className="w-full">
          <Header />

          <main className="isolate mx-auto w-full max-w-screen-2xl overflow-hidden p-4 md:p-6 2xl:p-10">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
