import { Suspense } from 'react';
import { db } from '@/lib/db';
import { products, productImages } from '@/lib/schema';
import { like, eq } from 'drizzle-orm';
import ProductCard from '@/components/ProductCard';
import LoadingSpinner from '@/components/LoadingSpinner';

async function SearchResults({ query }: { query: string }) {
  if (!query) {
    return <p className="text-center text-gray-500">Введите поисковый запрос</p>;
  }

  // Поиск продуктов по названию
  const searchResults = await db
    .select({
      id: products.id,
      name: products.name,
      description: products.description,
      price: products.price,
      inStock: products.inStock,
      featured: products.featured,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      imageId: productImages.id,
      imageUrl: productImages.url,
      imageIsMain: productImages.isMain,
      imageOrder: productImages.order,
    })
    .from(products)
    .leftJoin(productImages, eq(productImages.productId, products.id))
    .where(like(products.name, `%${query}%`));

  // Группировка изображений по продуктам
  const groupedProducts = searchResults.reduce((acc, item) => {
    if (!acc[item.id]) {
      acc[item.id] = {
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        inStock: item.inStock,
        featured: item.featured,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        images: [],
      };
    }

    if (item.imageId) {
      acc[item.id].images.push({
        id: item.imageId,
        url: item.imageUrl,
        isMain: item.imageIsMain,
        order: item.imageOrder,
      });
    }

    return acc;
  }, {} as Record<string, {
    id: string;
    name: string;
    description: string | null;
    price: string;
    inStock: boolean | null;
    featured: boolean | null;
    createdAt: Date;
    updatedAt: Date;
    images: Array<{
      id: string;
      url: string;
      isMain: boolean | null;
      order: number | null;
    }>;
  }>);

  // Преобразование в массив и удаление дубликатов
  const productsArray = Object.values(groupedProducts);

  // Удаление дубликатов по ID
  const uniqueProducts = productsArray.filter((product, index, self) =>
    index === self.findIndex(p => p.id === product.id)
  );

  // Формирование главного изображения
  const productsWithMainImages = uniqueProducts.map((product) => {
    const priceNum = parseFloat(String(product.price ?? '0'));
    return {
      ...product,
      categories: [] as string[],
      price: Number.isFinite(priceNum) ? priceNum : 0,
      mainImage:
        product.images.find((img) => img.isMain)?.url ||
        product.images[0]?.url ||
        '/placeholder-image.jpg',
    };
  });

  if (productsWithMainImages.length === 0) {
    return <p className="text-center text-gray-500">По запросу "{query}" ничего не найдено</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {productsWithMainImages.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q || '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Результаты поиска
        </h1>
        {query && (
          <p className="text-xl text-gray-600 mb-8">
            По запросу: <span className="font-semibold">"{query}"</span>
          </p>
        )}
        
        <Suspense fallback={<LoadingSpinner />}>
          <SearchResults query={query} />
        </Suspense>
      </div>
    </div>
  );
}