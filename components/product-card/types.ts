export type ProductCardVariant = 'new' | 'collections' | 'men' | 'women' | 'default';

export interface ProductCardProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  categories: string[];
  inStock: boolean;
  featured: boolean;
  isNew?: boolean;
  mainImage?: string;
  images?: { id: string; url: string; isMain: boolean }[];
}

export interface ProductCardProps {
  product: ProductCardProduct;
  variant?: ProductCardVariant;
}
