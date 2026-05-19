'use client';

import AdminSessionsManager from '@/components/admin/AdminSessionsManager';
import AdminShell from '@/components/admin/AdminShell';

export default function AdminSessionsPage() {
  return (
    <AdminShell>
      <AdminSessionsManager />
    </AdminShell>
  );
}
