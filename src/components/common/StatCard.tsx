'use client';

import React from 'react';
import { cn } from '@/utils';
import { Card } from './Card';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  className?: string;
}

const iconBgColors = {
  default: 'bg-dark-100 dark:bg-dark-700',
  primary: 'bg-primary-100 dark:bg-primary-900/30',
  secondary: 'bg-secondary-100 dark:bg-secondary-900/30',
  success: 'bg-success-50 dark:bg-success-900/30',
  warning: 'bg-warning-50 dark:bg-warning-900/30',
  danger: 'bg-danger-50 dark:bg-danger-900/30',
};

const iconColors = {
  default: 'text-dark-600 dark:text-dark-400',
  primary: 'text-primary-600 dark:text-primary-400',
  secondary: 'text-secondary-600 dark:text-secondary-400',
  success: 'text-success-600 dark:text-success-400',
  warning: 'text-warning-600 dark:text-warning-400',
  danger: 'text-danger-600 dark:text-danger-400',
};

export function StatCard({
  title,
  value,
  icon,
  trend,
  description,
  variant = 'default',
  className,
}: StatCardProps) {
  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-dark-500 dark:text-dark-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-dark-900 dark:text-white">{value}</p>
          
          {(trend || description) && (
            <div className="mt-2 flex items-center gap-2">
              {trend && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-sm font-medium',
                    trend.isPositive ? 'text-success-600' : 'text-danger-600'
                  )}
                >
                  {trend.isPositive ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {Math.abs(trend.value)}%
                </span>
              )}
              {description && (
                <span className="text-sm text-dark-500 dark:text-dark-400">
                  {description}
                </span>
              )}
            </div>
          )}
        </div>
        
        {icon && (
          <div
            className={cn(
              'p-3 rounded-xl',
              iconBgColors[variant]
            )}
          >
            <div className={cn('w-6 h-6', iconColors[variant])}>
              {icon}
            </div>
          </div>
        )}
      </div>
      
      {/* Decorative gradient */}
      <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br from-primary-500/10 to-secondary-500/10 rounded-full blur-2xl" />
    </Card>
  );
}

export default StatCard;
