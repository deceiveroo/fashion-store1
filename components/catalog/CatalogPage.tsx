import { Suspense } from 'react';
import { getCatalogProducts, type CatalogProduct } from '@/lib/catalog-products';
import { getCatalogConfig, type CatalogTabId } from '@/lib/catalog-config';
import CatalogShell from '@/components/catalog/CatalogShell';
import ProductGrid from '@/components/catalog/ProductGrid';
import CatalogBrowser from '@/components/catalog/CatalogBrowser';
import ProductGridSkeleton from '@/components/ProductGridSkeleton';
import type { ProductCardVariant } from '@/components/product-card/types';

// Конфиг ISR задаётся в самих маршрутах (app/products|men|women|new|collections/page.tsx).
// В этом НЕ-page модуле route-segment экспорты игнорируются Next, поэтому их тут нет.

async function loadProducts(tabId: CatalogTabId): Promise<CatalogProduct[]> {
  const config = getCatalogConfig(tabId);
  return getCatalogProducts(config.query);
}

function ProductSection({
  products,
  variant,
  emptyTitle,
  emptyMessage,
}: {
  products: CatalogProduct[];
  variant: ProductCardVariant;
  emptyTitle: string;
  emptyMessage?: {
    title: string;
    subtitle: string;
  };
}) {
  return (
    <ProductGrid
      products={products}
      variant={variant}
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

  // Карточки типизированы более узким ProductCardVariant (без 'all') —
  // для общего каталога используем нейтральный 'default'.
  const cardVariant: ProductCardVariant = tab === 'all' ? 'default' : tab;

  // Создаем сообщение для пустого состояния на основе таба
  const emptyMessages: Record<CatalogTabId, { title: string; subtitle: string }> = {
    all: {
      title: 'Каталог пока пуст',
      subtitle: 'Мы наполняем витрину товарами. Загляните чуть позже.',
    },
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
        {products.length === 0 ? (
          <ProductSection
            products={products}
            variant={cardVariant}
            emptyTitle={`${config.title} — пока пусто`}
            emptyMessage={emptyMessages[tab]}
          />
        ) : (
          <CatalogBrowser products={products} variant={cardVariant} />
        )}
      </Suspense>
    </CatalogShell>
  );
}
