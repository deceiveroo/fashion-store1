import CatalogPage from '@/components/catalog/CatalogPage';

export const revalidate = 120;
export const runtime = 'nodejs';

export default function WomenPage() {
  return <CatalogPage tab="women" />;
}
