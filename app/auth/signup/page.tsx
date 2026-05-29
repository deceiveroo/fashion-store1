import { Suspense } from 'react';
import AuthShell from '@/components/auth/AuthShell';

export const metadata = { title: 'Регистрация' };

export default function SignUpPage() {
  return (
    <Suspense>
      <AuthShell initialMode="signup" />
    </Suspense>
  );
}
