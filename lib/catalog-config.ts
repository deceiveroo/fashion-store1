import type { CatalogOptions } from './catalog-products';

export type CatalogTabId = 'new' | 'collections' | 'men' | 'women';

export type CatalogPageConfig = {
  id: CatalogTabId;
  path: string;
  label: string;
  title: string;
  subtitle: string;
  badge: string;
  query: CatalogOptions;
};

export const CATALOG_TABS: CatalogPageConfig[] = [
  {
    id: 'new',
    path: '/new',
    label: 'НОВИНКИ',
    title: 'Новая Коллекция',
    subtitle: 'Откройте для себя последние поступления сезона',
    badge: 'NEW SEASON',
    query: {
      categorySlugs: ['new', 'novinki'],
      categoryIds: ['new'],
      newOnly: false,
      limit: 48,
      fallbackToAll: true,
    },
  },
  {
    id: 'collections',
    path: '/collections',
    label: 'КОЛЛЕКЦИИ',
    title: 'Курируемые Подборки',
    subtitle: 'Изысканные капсулы от наших стилистов',
    badge: 'CURATED',
    query: {
      categorySlugs: ['collections', 'kollektsii'],
      categoryIds: ['collections'],
      featuredOnly: false,
      limit: 48,
      fallbackToAll: true,
    },
  },
  {
    id: 'men',
    path: '/men',
    label: 'МУЖСКОЕ',
    title: 'Мужская Линия',
    subtitle: 'Совершенство кроя и безупречный стиль',
    badge: 'MEN',
    query: {
      categorySlugs: ['men', 'muzhskoe'],
      categoryIds: ['men'],
      limit: 48,
      fallbackToAll: true,
    },
  },
  {
    id: 'women',
    path: '/women',
    label: 'ЖЕНСКОЕ',
    title: 'Женская Линия',
    subtitle: 'Элегантность и утончённость в каждой детали',
    badge: 'WOMEN',
    query: {
      categorySlugs: ['women', 'zhenskoe'],
      categoryIds: ['women'],
      limit: 48,
      fallbackToAll: true,
    },
  },
];

export function getCatalogConfig(id: CatalogTabId): CatalogPageConfig {
  return CATALOG_TABS.find((t) => t.id === id)!;
}
