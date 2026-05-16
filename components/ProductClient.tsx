'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import AddToCartButton from './AddToCartButton';
import FavoriteButton from './FavoriteButton';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categories: string[];
  inStock: boolean;
  featured: boolean;
  images: { id: string; url: string; isMain: boolean }[];
}

interface ProductClientProps {
  product: Product;
}

const getPlaceholderImage = (productId: string, width: number = 800, height: number = 800): string => {
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    const char = productId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & 0xFFFFFFFF;
  }
  const seed = Math.abs(hash) % 10000;
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
};

export default function ProductClient({ product }: ProductClientProps) {
  const [selectedImage, setSelectedImage] = useState(0);

  const mainImage = product.images.find(img => img.isMain) || product.images[0];
  const allImages = product.images.length > 0 ? product.images : [
    { id: '1', url: getPlaceholderImage(product.id, 800, 800), isMain: true }
  ];
  
  const cartItemData = {
    id: product.id,
    name: product.name,
    price: product.price,
    image: allImages[selectedImage]?.url || getPlaceholderImage(product.id, 800, 800)
  };

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 pt-24 pb-16 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link 
            href="/collections"
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Назад к коллекциям</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Image Gallery */}
          <div className="space-y-6">
            {/* Main Image */}
            <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-neutral-900">
              <img
                src={allImages[selectedImage]?.url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              
              {/* Featured badge */}
              {product.featured && (
                <div className="absolute top-4 left-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 text-xs font-medium tracking-wider uppercase">
                  Хит
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {allImages.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square overflow-hidden bg-gray-100 dark:bg-neutral-900 ${
                      selectedImage === index
                        ? 'ring-2 ring-gray-900 dark:ring-white'
                        : 'ring-1 ring-gray-200 dark:ring-neutral-800 hover:ring-gray-400 dark:hover:ring-neutral-600'
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={`${product.name} view ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="space-y-8">
              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-light text-gray-900 dark:text-white tracking-wide">
                {product.name}
              </h1>

              {/* Price */}
              <div className="text-2xl font-light text-gray-900 dark:text-white">
                {product.price.toLocaleString('ru-RU')} ₽
              </div>

              {/* Description */}
              <p className="text-base text-gray-600 dark:text-neutral-400 leading-relaxed">
                {product.description}
              </p>

              {/* Categories & Stock */}
              <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-gray-200 dark:border-neutral-800">
                <div>
                  <span className="text-sm text-gray-500 dark:text-neutral-500 block mb-1">Категории</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {product.categories.join(', ')}
                  </span>
                </div>
                
                <div>
                  <span className="text-sm text-gray-500 dark:text-neutral-500 block mb-1">Наличие</span>
                  <span className={`text-sm font-medium ${
                    product.inStock 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {product.inStock ? 'В наличии' : 'Нет в наличии'}
                  </span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex gap-4 pt-6">
                {product.inStock && (
                  <div className="flex-1">
                    <AddToCartButton 
                      product={cartItemData} 
                      disabled={!product.inStock}
                    />
                  </div>
                )}
                
                <FavoriteButton productId={product.id} size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
