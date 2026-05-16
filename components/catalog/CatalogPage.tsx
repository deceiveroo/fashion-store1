import { Suspense } from 'react';
import { getCatalogProducts, type CatalogProduct } from '@/lib/catalog-products';
import { getCatalogConfig, type CatalogTabId } from '@/lib/catalog-config';
import CatalogShell from '@/components/catalog/CatalogShell';
import ProductGrid from '@/components/catalog/ProductGrid';
import ProductGridSkeleton from '@/components/ProductGridSkeleton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function loadProducts(tabId: CatalogTabId): Promise<CatalogProduct[]> {
  const config = getCatalogConfig(tabId);
  return getCatalogProducts(config.query);
}

function ProductSection({
  products,
  emptyTitle,
  emptyMessage,
}: {
  products: CatalogProduct[];
  emptyTitle: string;
  emptyMessage?: {
    title: string;
    subtitle: string;
  };
}) {
  return (
    <ProductGrid
      products={products}
      emptyTitle={emptyTitle}
      emptyDescription="Проверьте подключение к базе или выполните migrations/supabase-reset-catalog.sql в Supabase"
      emptyMessage={emptyMessage}
    />
  );
}

type CatalogPageProps = {
  tab: CatalogTabId;
};

export default async function CatalogPage({ tab }: CatalogPageProps) {
  const config = getCatalogConfig(tab);
  const products = await loadProducts(tab);

  // Создаем сообщение для пустого состояния на основе таба
  const emptyMessages: Record<CatalogTabId, { title: string; subtitle: string }> = {
    new: {
      title: 'Новинки скоро появятся',
      subtitle: 'Мы тщательно отбираем каждую вещь. Следите за обновлениями.',
    },
    collections: {
      title: 'Коллекция формируется',
      subtitle: 'Наши стилисты работают над новыми подборками.',
    },
    men: {
      title: 'Мужская линия обновляется',
      subtitle: 'Новые поступления мужской одежды будут доступны в ближайшее время.',
    },
    women: {
      title: 'Женская линия обновляется',
      subtitle: 'Новые поступления женской одежды будут доступны в ближайшее время.',
    },
  };

  return (
    <CatalogShell active={tab} productCount={products.length}>
      <Suspense fallback={<ProductGridSkeleton count={8} />}>
        <ProductSection 
          products={products} 
          emptyTitle={`${config.title} — пока пусто`} 
          emptyMessage={emptyMessages[tab]}
        />
      </Suspense>
    </CatalogShell>
  );
}
