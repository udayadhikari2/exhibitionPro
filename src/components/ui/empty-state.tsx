import React from 'react';
import { cn } from '@/utils';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps {
  icon?: React.ReactNode | React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon = <Inbox className="w-6 h-6 text-slate-400" />,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const renderedIcon =
    React.isValidElement(icon)
      ? icon
      : typeof icon === 'function' || (typeof icon === 'object' && icon !== null)
      ? React.createElement(icon as any, { className: 'w-6 h-6 text-slate-400' })
      : <Inbox className="w-6 h-6 text-slate-400" />;

  return (
    <div
      className={cn(
        'bg-white rounded-3xl border border-dashed border-slate-200 p-8 sm:p-12 text-center space-y-3',
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-slate-400">
        {renderedIcon}
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        {description && <p className="text-xs text-slate-500 max-w-sm mx-auto">{description}</p>}
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
