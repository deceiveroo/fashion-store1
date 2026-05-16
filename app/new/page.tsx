import CatalogPage from '@/components/catalog/CatalogPage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export default function NewPage() {
  return <CatalogPage tab="new" />;
}
