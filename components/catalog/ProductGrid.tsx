import CatalogProductGrid from '@/components/catalog/CatalogProductGrid';
import type { ProductCardVariant } from '@/components/product-card/types';
import type { CatalogProduct } from '@/lib/catalog-products';

type ProductGridProps = {
  products: CatalogProduct[];
  variant?: ProductCardVariant;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyMessage?: {
    title: string;
    subtitle: string;
  };
};

export default function ProductGrid({
  products,
  variant = 'default',
  emptyTitle = 'Товары не найдены',
  emptyDescription = 'Скоро появятся новые позиции в каталоге',
  emptyMessage,
}: ProductGridProps) {
  return (
    <CatalogProductGrid
      products={products}
      variant={variant}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      emptyMessage={emptyMessage}
    />
  );
}
