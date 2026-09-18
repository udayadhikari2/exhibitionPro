import React from 'react';
import { cn } from '@/utils';

export interface PageHeaderProps {
  badge?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ badge, title, description, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2',
        className
      )}
    >
      <div className="space-y-1">
        {badge && (
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
            {badge}
          </span>
        )}
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {title}
        </h1>
        {description && <p className="text-xs sm:text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2.5 self-start sm:self-auto">{actions}</div>}
    </div>
  );
}
