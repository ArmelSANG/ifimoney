'use client';

import React from 'react';
import { cn } from '@/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, type = 'text', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={cn(
              'w-full px-4 py-3 rounded-xl border bg-white dark:bg-dark-800 transition-all duration-200',
              'text-dark-900 dark:text-white placeholder:text-dark-400',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error
                ? 'border-danger-500 focus:ring-danger-500'
                : 'border-dark-200 dark:border-dark-700 hover:border-dark-300 dark:hover:border-dark-600',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-sm text-danger-500">{error}</p>}
        {helperText && !error && <p className="mt-1.5 text-sm text-dark-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
