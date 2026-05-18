'use client';

import { useParams } from 'next/navigation';
import AdminProductForm from '@/components/admin/AdminProductForm';

export default function EditProductPage() {
  const params = useParams();
  const productId = params.id as string;
  return <AdminProductForm mode="edit" productId={productId} />;
}
