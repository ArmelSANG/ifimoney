'use client';

import React from 'react';
import Image from 'next/image';
import { cn, getInitials } from '@/utils';

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

const imageSizes = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
};

export function Avatar({ src, alt = '', name = '', size = 'md', className }: AvatarProps) {
  const initials = getInitials(name || alt || 'U');

  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-full overflow-hidden',
        'bg-gradient-to-br from-primary-500 to-secondary-500 text-white font-semibold',
        sizes[size],
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt || name || 'Avatar'}
          width={imageSizes[size]}
          height={imageSizes[size]}
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

export default Avatar;
