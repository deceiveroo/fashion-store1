import CatalogPage from '@/components/catalog/CatalogPage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export default function CollectionsPage() {
  return <CatalogPage tab="collections" />;
}
