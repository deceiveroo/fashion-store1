import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import ClientLayoutWrapper from '@/components/ClientLayoutWrapper';
import { Providers } from '@/components/providers/Providers';
import SupportChat from '@/components/SupportChat';
import { SpeedInsights } from '@vercel/speed-insights/next';

const inter = Inter({ subsets: ['latin'] });

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
      <body className={inter.className}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else if (theme === 'light') {
                    document.documentElement.classList.remove('dark');
                  }
                  // Если темы нет в localStorage, оставляем светлую по умолчанию
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
                <SupportChat />
              </div>
            </CartProvider>
          </AuthProvider>
        </Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}