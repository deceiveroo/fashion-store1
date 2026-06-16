import CatalogPage from '@/components/catalog/CatalogPage';

export const revalidate = 120;
export const runtime = 'nodejs';

export default function NewPage() {
  return <CatalogPage tab="new" />;
}
