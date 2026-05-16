import { ReactNode } from 'react';
import clsx from 'clsx';

interface AdminCardProps {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function AdminCard({
  children,
  className,
  interactive = false,
  padding = 'md',
}: AdminCardProps) {
  return (
    <div
      className={clsx(
        'admin-card',
        interactive && 'admin-card-interactive',
        paddingMap[padding],
        className
      )}
    >
      {children}
    </div>
  );
}
