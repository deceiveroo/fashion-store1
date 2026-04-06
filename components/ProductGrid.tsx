import { db } from '@/lib/db';
import { products, productImages } from '@/lib/schema';
import { desc, eq } from 'drizzle-orm';
import ProductCard from './ProductCard';

interface ProductImage {
  id: string;
  url: string;
  isMain: boolean;
  order: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  inStock: boolean;
  featured: boolean;
  position: number;
  isFeatured: boolean;
  locale: string;
  meta: any;
  createdAt: Date;
  updatedAt: Date;
  images: ProductImage[];
  mainImage?: string;
}

async function getProducts(): Promise<Product[]> {
  // Fetch all products with their images in a single query to avoid N+1
  const productsWithImages = await db
    .select({
      id: products.id,
      name: products.name,
      description: products.description,
      price: products.price,
      inStock: products.inStock,
      featured: products.featured,
      position: products.position,
      isFeatured: products.isFeatured,
      locale: products.locale,
      meta: products.meta,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      imageId: productImages.id,
      imageUrl: productImages.url,
      imageIsMain: productImages.isMain,
      imageOrder: productImages.order,
    })
    .from(products)
    .leftJoin(productImages, eq(productImages.productId, products.id))
    .orderBy(desc(products.createdAt), productImages.order);

  // Process products and group images
  const productMap = new Map<string, Product>();
  
  for (const item of productsWithImages) {
    if (!productMap.has(item.id)) {
      // Create new product
      const product: Product = {
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        inStock: item.inStock,
        featured: item.featured,
        position: item.position,
        isFeatured: item.isFeatured,
        locale: item.locale,
        meta: item.meta,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        images: []
      };
      
      // Add main image if available
      if (item.imageId) {
        product.images.push({
          id: item.imageId,
          url: item.imageUrl,
          isMain: item.imageIsMain,
          order: item.imageOrder
        });
      }
      
      productMap.set(item.id, product);
    } else {
      // Add image to existing product
      const product = productMap.get(item.id)!;
      if (item.imageId) {
        product.images.push({
          id: item.imageId,
          url: item.imageUrl,
          isMain: item.imageIsMain,
          order: item.imageOrder
        });
      }
    }
  }

  // Convert to array and sort by creation date
  const productsArray = Array.from(productMap.values())
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // Calculate main image for each product
  return productsArray.map(product => ({
    ...product,
    mainImage: product.images.find(img => img.isMain)?.url || 
               product.images[0]?.url || 
               '/placeholder-image.jpg'
  }));
}

export default async function ProductGrid() {
  const products = await getProducts();

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Товары пока не добавлены</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}