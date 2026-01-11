'use client';

import React from 'react';
import { cn } from '@/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, options, placeholder, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full px-4 py-3 rounded-xl border bg-white dark:bg-dark-800 transition-all duration-200 appearance-none cursor-pointer',
              'text-dark-900 dark:text-white',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              error
                ? 'border-danger-500 focus:ring-danger-500'
                : 'border-dark-200 dark:border-dark-700 hover:border-dark-300 dark:hover:border-dark-600',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 pointer-events-none" />
        </div>
        {error && <p className="mt-1.5 text-sm text-danger-500">{error}</p>}
        {helperText && !error && <p className="mt-1.5 text-sm text-dark-500">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
