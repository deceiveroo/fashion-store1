import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import ClientLayoutWrapper from '@/components/ClientLayoutWrapper';
import { Providers } from '@/components/providers/Providers';
import SupportChatMinimalist from '@/components/SupportChatMinimalist';
import QuickViewProvider from '@/components/QuickViewProvider';
import MaintenanceCheck from '@/components/MaintenanceCheck';
import AchievementNotification from '@/components/gamification/AchievementNotification';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';

export const metadata: Metadata = {
  title: 'ELEVATE',
  description: 'Переосмысливая роскошную моду с инновационным дизайном и устойчивыми практиками',
  icons: {
    icon: '/favicon.svg',
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
            <CartProvider>
              <MaintenanceCheck>
                <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950 transition-colors duration-300">
                  <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
                  <SupportChatMinimalist />
                  <QuickViewProvider />
                  <AchievementNotification />
                </div>
              </MaintenanceCheck>
            </CartProvider>
          </AuthProvider>
        </Providers>
        {enableVercelInsights ? <Analytics /> : null}
        {enableVercelInsights ? <SpeedInsights /> : null}
      </body>
    </html>
  );
}
