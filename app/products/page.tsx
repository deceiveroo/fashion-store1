import CatalogPage from '@/components/catalog/CatalogPage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const metadata = {
  title: 'Все товары',
  description: 'Полный каталог ELEVATE — весь ассортимент одежды и аксессуаров в одном месте.',
};

export default function ProductsPage() {
  return <CatalogPage tab="all" />;
}
