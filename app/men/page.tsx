import CatalogPage from '@/components/catalog/CatalogPage';

export const revalidate = 60; // ISR: regenerate every 60 seconds
export const runtime = 'nodejs';

export default function MenPage() {
  return <CatalogPage tab="men" />;
}
