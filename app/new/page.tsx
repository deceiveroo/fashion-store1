import CatalogPage from '@/components/catalog/CatalogPage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function NewPage() {
  return <CatalogPage tab="new" />;
}
