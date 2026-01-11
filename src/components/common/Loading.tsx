'use client';

import React from 'react';
import { cn } from '@/utils';

export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'dots' | 'pulse';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

const sizes = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

export function Loading({ size = 'md', variant = 'spinner', text, fullScreen = false, className }: LoadingProps) {
  const content = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      {variant === 'spinner' && (
        <div className={cn('border-2 border-dark-200 dark:border-dark-700 border-t-primary-500 rounded-full animate-spin', sizes[size])} />
      )}
      {variant === 'dots' && (
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className={cn('rounded-full bg-primary-500 animate-bounce', size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2 h-2' : 'w-3 h-3')} style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      )}
      {variant === 'pulse' && (
        <div className="relative">
          <div className={cn('rounded-full bg-primary-500/30 animate-ping absolute inset-0', sizes[size])} />
          <div className={cn('rounded-full bg-primary-500 relative', sizes[size])} />
        </div>
      )}
      {text && <p className="text-sm text-dark-500 dark:text-dark-400 animate-pulse">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-dark-900/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
}

export function LoadingSkeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse bg-dark-200 dark:bg-dark-700 rounded', className)} />;
}

export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <LoadingSkeleton className="h-4 w-24 mb-3" />
          <LoadingSkeleton className="h-8 w-32" />
          <LoadingSkeleton className="h-4 w-20 mt-3" />
        </div>
        <LoadingSkeleton className="w-12 h-12 rounded-xl" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr className="border-b border-dark-100 dark:border-dark-700">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <LoadingSkeleton className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}

export default Loading;
