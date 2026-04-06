'use client';

import { TrendingUp, Package } from 'lucide-react';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  sales: number;
  revenue: number;
  image?: string;
  trend: number;
}

interface TopProductsWidgetProps {
  products: Product[];
}

export function TopProductsWidget({ products }: TopProductsWidgetProps) {
  // Проверяем, что products это массив
  const productList = Array.isArray(products) ? products : [];

  if (productList.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Топ товары</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Самые продаваемые</p>
          </div>
          <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
            <TrendingUp className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
        </div>
        <div className="text-center py-8">
          <Package className="h-12 w-12 text-zinc-400 mx-auto mb-2" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Нет данных о продажах</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Топ товары</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Самые продаваемые</p>
        </div>
        <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
          <TrendingUp className="h-5 w-5 text-violet-600 dark:text-violet-400" />
        </div>
      </div>

      <div className="space-y-4">
        {productList.map((product, index) => (
          <div 
            key={product.id}
            className="flex items-center gap-4 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white text-sm font-bold">
              {index + 1}
            </div>
            
            {product.image ? (
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <Package className="h-6 w-6 text-zinc-400" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                {product.name}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {product.sales} продаж
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {product.revenue.toLocaleString('ru-RU')} ₽
              </p>
              <div className="flex items-center justify-end gap-1 mt-1">
                <span className={`text-xs font-medium ${product.trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {product.trend >= 0 ? '↑' : '↓'} {Math.abs(product.trend)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
