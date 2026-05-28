import { cache } from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { products, productImages, productCategory, categories, productSizes, reviews } from '@/lib/schema';
import { productInStock, productFeatured } from '@/lib/product-query';
import { eq, and, inArray, avg, count } from 'drizzle-orm';
import ProductClient from '@/components/ProductClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

// Базовый URL — для абсолютных ссылок в JSON-LD (Google требует абсолютные URL).
const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
  'https://e1evate.vercel.app';

// Агрегат рейтинга по одобренным отзывам — для JSON-LD aggregateRating.
async function getProductRating(id: string): Promise<{ value: number; count: number }> {
  try {
    const [row] = await db
      .select({ value: avg(reviews.rating), count: count() })
      .from(reviews)
      .where(and(eq(reviews.productId, id), eq(reviews.isApproved, true)));
    const cnt = Number(row?.count ?? 0);
    const val = row?.value ? Number(row.value) : 0;
    return { value: val, count: cnt };
  } catch (error) {
    console.error('Error fetching product rating:', error);
    return { value: 0, count: 0 };
  }
}

// React.cache дедуплицирует запрос внутри одного рендера: getProduct вызывается
// и в generateMetadata, и в самой странице — без cache это два похода в БД.
const getProduct = cache(async function getProduct(id: string) {
  if (!id) {
    console.error('Product ID is empty');
    return null;
  }

  try {
    // Загружаем основной товар
    const productRows = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        inStock: productInStock,
        featured: productFeatured,
        isNew: products.isNew,
        createdAt: products.createdAt,
        // Новые поля
        brand: products.brand,
        country: products.country,
        composition: products.composition,
        compositionSecondary: products.compositionSecondary,
        color: products.color,
        articleNumber: products.articleNumber,
        productCode: products.productCode,
        modelParams: products.modelParams,
      })
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (productRows.length === 0) {
      return null;
    }

    const firstProduct = productRows[0];

    // Загружаем изображения
    const imageRows = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, id))
      .orderBy(productImages.order);

    // Загружаем категории
    const categoryRows = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      })
      .from(productCategory)
      .leftJoin(categories, eq(categories.id, productCategory.categoryId))
      .where(eq(productCategory.productId, id));

    // Загружаем размеры
    const sizeRows = await db
      .select()
      .from(productSizes)
      .where(eq(productSizes.productId, id))
      .orderBy(productSizes.sortOrder);

    // Собираем уникальные категории с названиями
    const categoryNames = Array.from(
      new Set(
        categoryRows
          .filter(item => item.name)
          .map(item => item.name as string)
      )
    );
    
    const product = {
      id: firstProduct.id,
      name: firstProduct.name,
      description: firstProduct.description,
      inStock: firstProduct.inStock,
      featured: firstProduct.featured,
      isNew: firstProduct.isNew ?? false,
      createdAt: firstProduct.createdAt,
      price: parseFloat(String(firstProduct.price ?? '0')) || 0,
      // Новые поля
      brand: firstProduct.brand,
      country: firstProduct.country,
      composition: firstProduct.composition,
      compositionSecondary: firstProduct.compositionSecondary,
      color: firstProduct.color,
      articleNumber: firstProduct.articleNumber,
      productCode: firstProduct.productCode,
      modelParams: firstProduct.modelParams,
      images: imageRows.map(img => ({
        id: img.id || '',
        url: img.url || '',
        isMain: img.isMain || false,
        mediaType: (img.mediaType as 'image' | 'video') || 'image',
        duration: img.duration || undefined,
        thumbnailUrl: img.thumbnailUrl || undefined,
        color: img.color ?? null,
      })),
      sizes: sizeRows.map(size => ({
        id: size.id,
        sizeName: size.sizeName,
        sizeType: size.sizeType,
        inStock: size.inStock,
        stockCount: size.stockCount,
      })),
      categories: categoryNames.length > 0 ? categoryNames : ['Без категории'],
      mainImage: imageRows.find(img => img.isMain)?.url || 
                 imageRows[0]?.url || 
                 '/placeholder-image.jpg'
    };

    return product;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
});

// Используем правильный тип для params
interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: PageProps) {
  // Ожидаем params
  const { id } = await params;
  
  if (!id) {
    console.error('No product ID provided');
    notFound();
  }

  const product = await getProduct(id);

  if (!product) {
    console.error('Product not found for ID:', id);
    notFound();
  }

  const rating = await getProductRating(id);

  // JSON-LD Product — структурированные данные для Google (rich snippets: цена,
  // наличие, рейтинг). Абсолютные URL обязательны.
  const absoluteImages = product.images
    .map((img) => img.url)
    .filter(Boolean)
    .map((url) => (url.startsWith('http') ? url : `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || product.name,
    image: absoluteImages.length > 0 ? absoluteImages : undefined,
    ...(product.brand ? { brand: { '@type': 'Brand', name: product.brand } } : {}),
    ...(product.articleNumber ? { sku: product.articleNumber } : {}),
    ...(product.productCode ? { mpn: product.productCode } : {}),
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/products/${product.id}`,
      priceCurrency: 'RUB',
      price: product.price,
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
    ...(rating.count > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: Number(rating.value.toFixed(2)),
            reviewCount: rating.count,
          },
        }
      : {}),
  };

  // Возвращаем клиентский компонент
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductClient product={product} />
    </>
  );
}

// Метаданные для SEO
export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  
  if (!id) {
    return {
      title: 'Товар не найден',
    };
  }

  const product = await getProduct(id);

  if (!product) {
    return {
      title: 'Товар не найден',
    };
  }

  const url = `${SITE_URL}/products/${product.id}`;
  const description =
    product.description?.slice(0, 300) ||
    `${product.name} — купить в ELEVATE${product.brand ? `, бренд ${product.brand}` : ''}.`;
  const ogImage = product.mainImage && product.mainImage !== '/placeholder-image.jpg'
    ? product.mainImage
    : undefined;

  return {
    title: product.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title: product.name,
      description,
      siteName: 'ELEVATE',
      ...(ogImage ? { images: [{ url: ogImage, alt: product.name }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

// Генерация статических параметров
export async function generateStaticParams() {
  return [];
}