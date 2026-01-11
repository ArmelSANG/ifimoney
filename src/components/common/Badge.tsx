'use client';

import React from 'react';
import { cn } from '@/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

const variants = {
  default: 'bg-dark-100 text-dark-700 dark:bg-dark-700 dark:text-dark-300',
  primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
  secondary: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-400',
  success: 'bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-400',
  warning: 'bg-warning-50 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
  danger: 'bg-danger-50 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400',
  outline: 'bg-transparent border border-dark-300 text-dark-600 dark:border-dark-600 dark:text-dark-400',
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export function Badge({ className, variant = 'default', size = 'md', children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export default Badge;
