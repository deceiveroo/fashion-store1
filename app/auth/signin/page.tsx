import { Suspense } from 'react';
import AuthShell from '@/components/auth/AuthShell';

export const metadata = { title: 'Вход' };

export default function SignInPage() {
  return (
    <Suspense>
      <AuthShell initialMode="signin" />
    </Suspense>
  );
}
