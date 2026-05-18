import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import ClientLayoutWrapper from '@/components/ClientLayoutWrapper';
import { Providers } from '@/components/providers/Providers';
import SupportChatMinimalist from '@/components/SupportChatMinimalist';
import QuickViewProvider from '@/components/QuickViewProvider';
import { SpeedInsights } from '@vercel/speed-insights/next';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
});

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
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${inter.variable} ${inter.className} font-sans antialiased`}>
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
              <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950 transition-colors duration-300">
                <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
                <SupportChatMinimalist />
                <QuickViewProvider />
              </div>
            </CartProvider>
          </AuthProvider>
        </Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}