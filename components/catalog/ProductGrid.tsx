import ProductCard from '@/components/ProductCard';
import type { CatalogProduct } from '@/lib/catalog-products';

type ProductGridProps = {
  products: CatalogProduct[];
  emptyTitle?: string;
  emptyDescription?: string;
  emptyMessage?: {
    title: string;
    subtitle: string;
  };
};

export default function ProductGrid({
  products,
  emptyTitle = 'Товары не найдены',
  emptyDescription = 'Скоро появятся новые позиции в каталоге',
  emptyMessage,
}: ProductGridProps) {
  if (!products.length) {
    const message = emptyMessage || {
      title: emptyTitle,
      subtitle: emptyDescription,
    };

    return (
      <div className="text-center py-24 px-8">
        <div className="max-w-md mx-auto">
          <h3 className="text-xl font-light text-gray-900 dark:text-white mb-3 tracking-wide">
            {message.title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-neutral-400 leading-relaxed">
            {message.subtitle}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
