import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import ClientLayoutWrapper from '@/components/ClientLayoutWrapper';
import { Providers } from '@/components/providers/Providers';
import SupportChatMinimalist from '@/components/SupportChatMinimalist';
import QuickViewProvider from '@/components/QuickViewProvider';
import { SpeedInsights } from '@vercel/speed-insights/next';

// Основной шрифт для текста - более современный и читаемый
const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
});

// Шрифт для заголовков - более стильный
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-jakarta',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
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
      <body className={`${inter.variable} ${jakarta.variable} font-sans antialiased text-gray-900 dark:text-gray-100`}>
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