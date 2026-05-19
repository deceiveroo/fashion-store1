import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { products, productImages, productCategory, categories } from '@/lib/schema';
import { productInStock, productFeatured } from '@/lib/product-query';
import { eq, and, inArray } from 'drizzle-orm';
import ProductClient from '@/components/ProductClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

async function getProduct(id: string) {
  if (!id) {
    console.error('Product ID is empty');
    return null;
  }

  try {
    const productData = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        inStock: productInStock,
        featured: productFeatured,
        isNew: products.isNew,
        createdAt: products.createdAt,
        images: productImages,
        categoryId: categories.id,
        categoryName: categories.name,
        categorySlug: categories.slug,
      })
      .from(products)
      .leftJoin(productImages, eq(productImages.productId, products.id))
      .leftJoin(productCategory, eq(productCategory.productId, products.id))
      .leftJoin(categories, eq(categories.id, productCategory.categoryId))
      .where(eq(products.id, id));

    if (productData.length === 0) {
      return null;
    }

    // Группируем данные
    const firstProduct = productData[0];
    
    // Собираем уникальные категории с названиями
    const categoryNames = Array.from(
      new Set(
        productData
          .filter(item => item.categoryName)
          .map(item => item.categoryName as string)
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
      images: productData
        .filter(item => item.images)
        .map(item => ({
          id: item.images?.id || '',
          url: item.images?.url || '',
          isMain: item.images?.isMain || false,
          mediaType: ((item.images as any)?.mediaType as 'image' | 'video') || 'image',
          duration: (item.images as any)?.duration || undefined,
          thumbnailUrl: (item.images as any)?.thumbnailUrl || undefined,
        })),
      categories: categoryNames.length > 0 ? categoryNames : ['Без категории'],
      mainImage: productData.find(item => item.images?.isMain)?.images?.url || 
                 productData[0]?.images?.url || 
                 '/placeholder-image.jpg'
    };

    return product;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

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

  // Возвращаем клиентский компонент
  return <ProductClient product={product} />;
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

  return {
    title: `${product.name} - ELEVATE`,
    description: product.description,
  };
}

// Генерация статических параметров
export async function generateStaticParams() {
  return [];
}