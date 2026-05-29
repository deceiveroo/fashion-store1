import { Suspense } from 'react';
import AuthShell from '@/components/auth/AuthShell';

export const metadata = { title: 'Восстановление пароля' };

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <AuthShell initialMode="forgot" />
    </Suspense>
  );
}
