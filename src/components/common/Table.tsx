'use client';

import React from 'react';
import { cn } from '@/utils';

// Table Root
export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {}

export function Table({ className, children, ...props }: TableProps) {
  return (
    <div className="w-full overflow-auto">
      <table
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

// Table Header
export interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export function TableHeader({ className, children, ...props }: TableHeaderProps) {
  return (
    <thead className={cn('[&_tr]:border-b', className)} {...props}>
      {children}
    </thead>
  );
}

// Table Body
export interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export function TableBody({ className, children, ...props }: TableBodyProps) {
  return (
    <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props}>
      {children}
    </tbody>
  );
}

// Table Row
export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {}

export function TableRow({ className, children, ...props }: TableRowProps) {
  return (
    <tr
      className={cn(
        'border-b border-dark-100 dark:border-dark-700 transition-colors',
        'hover:bg-dark-50 dark:hover:bg-dark-800/50',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

// Table Head Cell
export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {}

export function TableHead({ className, children, ...props }: TableHeadProps) {
  return (
    <th
      className={cn(
        'h-12 px-4 text-left align-middle font-semibold text-dark-500 dark:text-dark-400',
        '[&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
}

// Table Cell
export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {}

export function TableCell({ className, children, ...props }: TableCellProps) {
  return (
    <td
      className={cn(
        'p-4 align-middle text-dark-700 dark:text-dark-300',
        '[&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    >
      {children}
    </td>
  );
}

// Table Caption
export interface TableCaptionProps extends React.HTMLAttributes<HTMLTableCaptionElement> {}

export function TableCaption({ className, children, ...props }: TableCaptionProps) {
  return (
    <caption
      className={cn('mt-4 text-sm text-dark-500 dark:text-dark-400', className)}
      {...props}
    >
      {children}
    </caption>
  );
}

// Empty State
export interface TableEmptyProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function TableEmpty({ icon, title, description, action }: TableEmptyProps) {
  return (
    <TableRow>
      <TableCell colSpan={100} className="h-48">
        <div className="flex flex-col items-center justify-center text-center py-8">
          {icon && <div className="text-dark-300 dark:text-dark-600 mb-4">{icon}</div>}
          <p className="text-lg font-medium text-dark-700 dark:text-dark-300">{title}</p>
          {description && (
            <p className="mt-1 text-sm text-dark-500 dark:text-dark-400">{description}</p>
          )}
          {action && <div className="mt-4">{action}</div>}
        </div>
      </TableCell>
    </TableRow>
  );
}

export default Table;
