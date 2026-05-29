import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import { AuthModalProvider } from '@/context/AuthModalContext';
import AuthModal from '@/components/auth/AuthModal';
import ClientLayoutWrapper from '@/components/ClientLayoutWrapper';
import { Providers } from '@/components/providers/Providers';
import SupportChatMinimalist from '@/components/SupportChatMinimalist';
import QuickViewProvider from '@/components/QuickViewProvider';
import MaintenanceCheck from '@/components/MaintenanceCheck';
import AchievementNotification from '@/components/gamification/AchievementNotification';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';

// Базовый URL сайта — для абсолютных canonical/OG-ссылок (иначе соцсети и Google
// не резолвят относительные пути). Берём прод-домен, c фолбэком на Vercel-превью/localhost.
const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
  'https://e1evate.vercel.app';

const SITE_DESCRIPTION =
  'Переосмысливая роскошную моду с инновационным дизайном и устойчивыми практиками';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'ELEVATE',
    template: '%s — ELEVATE',
  },
  description: SITE_DESCRIPTION,
  applicationName: 'ELEVATE',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    siteName: 'ELEVATE',
    locale: 'ru_RU',
    url: SITE_URL,
    title: 'ELEVATE',
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ELEVATE',
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const enableVercelInsights = process.env.NEXT_PUBLIC_VERCEL_INSIGHTS === '1';

  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="font-sans antialiased text-gray-900 dark:text-gray-100">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const stored = localStorage.getItem('theme');
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const dark = stored === 'dark' || (stored !== 'light' && stored !== 'dark' && prefersDark);
                  document.documentElement.classList.toggle('dark', dark);
                } catch (e) {}
              })();
            `,
          }}
        />
        <Providers>
          <AuthProvider>
            <AuthModalProvider>
              <CartProvider>
                <MaintenanceCheck>
                  <div className="flex min-h-screen flex-col bg-white dark:bg-[#191926] transition-colors duration-300">
                    <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
                    <SupportChatMinimalist />
                    <QuickViewProvider />
                    <AchievementNotification />
                  </div>
                  <AuthModal />
                </MaintenanceCheck>
              </CartProvider>
            </AuthModalProvider>
          </AuthProvider>
        </Providers>
        {enableVercelInsights ? <Analytics /> : null}
        {enableVercelInsights ? <SpeedInsights /> : null}
      </body>
    </html>
  );
}
