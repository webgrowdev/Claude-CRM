'use client'

import React from 'react'
import { cn, getInitials } from '@/lib/utils'

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  src?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

export function Avatar({ name, src, size = 'md', className, ...props }: AvatarProps) {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  }

  const colors = [
    'bg-primary-100 text-primary-700',
    'bg-secondary-100 text-secondary-700',
    'bg-success-100 text-success-700',
    'bg-warning-100 text-warning-700',
    'bg-purple-100 text-purple-700',
    'bg-cyan-100 text-cyan-700',
  ]

  // Generate consistent color based on name
  const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length

  if (src) {
    return (
      <div
        className={cn(
          'rounded-full overflow-hidden flex-shrink-0',
          sizes[size],
          className
        )}
        {...props}
      >
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold flex-shrink-0',
        sizes[size],
        colors[colorIndex],
        className
      )}
      {...props}
    >
      {getInitials(name)}
    </div>
  )
}
