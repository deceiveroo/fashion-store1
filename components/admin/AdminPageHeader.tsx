'use client';

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
}

export default function AdminPageHeader({ title, description, icon: Icon, actions }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-center gap-3.5">
        {Icon && (
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg"
            style={{ backgroundImage: 'var(--admin-accent-gradient)', boxShadow: '0 10px 24px -8px var(--admin-glow)' }}
          >
            <Icon className="h-5 w-5" />
          </span>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--admin-text)]">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-[var(--admin-text-muted)]">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
