import React from 'react';
import { cn } from '@/utils';

export interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = 'Loading...', className }: LoadingStateProps) {
  return (
    <div className={cn('p-12 text-center space-y-3', className)}>
      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-xs text-slate-400 font-medium">{message}</p>
    </div>
  );
}
