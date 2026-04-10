'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Staff page redirects to users page (same functionality)
export default function StaffPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/admin/users'); }, [router]);
  return null;
}
