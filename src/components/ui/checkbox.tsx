import React from 'react';
import { cn } from '@/utils';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, id, ...props }, ref) => {
    const checkboxId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex items-start gap-2.5">
        <input
          type="checkbox"
          ref={ref}
          id={checkboxId}
          className={cn(
            'w-4 h-4 mt-0.5 text-blue-600 rounded-md border-slate-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition cursor-pointer',
            className
          )}
          {...props}
        />
        {(label || description) && (
          <div className="select-none">
            {label && (
              <label htmlFor={checkboxId} className="text-xs font-semibold text-slate-700 cursor-pointer">
                {label}
              </label>
            )}
            {description && <p className="text-[11px] text-slate-400">{description}</p>}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
