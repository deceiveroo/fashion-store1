import CatalogPage from '@/components/catalog/CatalogPage';

// ISR: данные каталога уже кэшируются в Redis на 120с (lib/catalog-products).
// Совмещаем TTL — Next отдаёт готовый HTML с CDN между перегенерациями.
export const revalidate = 120;
export const runtime = 'nodejs';

export const metadata = {
  title: 'Все товары',
  description: 'Полный каталог ELEVATE — весь ассортимент одежды и аксессуаров в одном месте.',
};

export default function ProductsPage() {
  return <CatalogPage tab="all" />;
}
