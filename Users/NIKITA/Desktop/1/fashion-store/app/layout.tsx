// 修改 layout.tsx 中的 main 区域结构
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <AuthProvider>
          <CartProvider>
            <div className="min-h-screen flex flex-col">
              <Header />
              <div className="flex flex-1">
                {/* 左侧边栏 */}
                <aside className="w-20 md:w-64 bg-gray-900 text-white p-4 hidden md:block">
                  {/* 导航菜单 */}
                </aside>
                {/* 主内容区 */}
                <main className="flex-1 overflow-auto">
                  {children}
                </main>
              </div>
              <Footer />
              <Toaster />
            </div>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}