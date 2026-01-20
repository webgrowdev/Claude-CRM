'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-slate-200', className)}
      {...props}
    />
  )
}

export function SkeletonText({
  className,
  lines = 1,
  ...props
}: SkeletonProps & { lines?: number }) {
  return (
    <div className={cn('space-y-2', className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('p-4 bg-white rounded-xl shadow-card', className)}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Skeleton className="h-3 w-20 mb-2" />
          <Skeleton className="h-7 w-16" />
        </div>
        <Skeleton className="w-10 h-10 rounded-lg" />
      </div>
    </div>
  )
}

export function SkeletonListItem({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('flex items-center gap-3 p-3', className)}
      {...props}
    >
      <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="w-16 h-6 rounded-full" />
    </div>
  )
}

export function SkeletonChart({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('p-4 bg-white rounded-xl shadow-card', className)}
      {...props}
    >
      <Skeleton className="h-5 w-40 mb-4" />
      <div className="flex items-end gap-2 h-40">
        {[40, 65, 45, 80, 55, 70, 50].map((height, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-t"
            style={{ height: `${height}%` }} // ahora permitido
          />
        ))}
      </div>
    </div>
  )
}

export function SkeletonTable({
  rows = 5,
  className,
  ...props
}: SkeletonProps & { rows?: number }) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl shadow-card overflow-hidden',
        className
      )}
      {...props}
    >
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-slate-100">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16 ml-auto" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 border-b border-slate-50 last:border-0"
        >
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-16 rounded-full ml-auto" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonAvatar({
  size = 'md',
  className,
  ...props
}: SkeletonProps & { size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizes: Record<typeof size, string> = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }

  return (
    <Skeleton
      className={cn('rounded-full', sizes[size], className)}
      {...props}
    />
  )
}

// Page-level skeleton loaders
export function DashboardSkeleton(props: SkeletonProps) {
  return (
    <div className="space-y-4 p-4" {...props}>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* Insights */}
      <div className="p-4 bg-white rounded-xl shadow-card">
        <Skeleton className="h-5 w-48 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SkeletonListItem />
          <SkeletonListItem />
          <SkeletonListItem />
          <SkeletonListItem />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SkeletonChart />
        <SkeletonChart />
      </div>
    </div>
  )
}

export function InboxSkeleton(props: SkeletonProps) {
  return (
    <div className="space-y-3 p-4" {...props}>
      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton
            key={i}
            className="h-8 w-20 rounded-full flex-shrink-0"
          />
        ))}
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-card divide-y divide-slate-100">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <SkeletonListItem key={i} />
        ))}
      </div>
    </div>
  )
}

export function PatientDetailSkeleton(props: SkeletonProps) {
  return (
    <div className="space-y-4 p-4" {...props}>
      {/* Profile */}
      <div className="p-6 bg-white rounded-xl shadow-card text-center">
        <Skeleton className="w-20 h-20 rounded-full mx-auto mb-4" />
        <Skeleton className="h-6 w-40 mx-auto mb-2" />
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-3 bg-white rounded-xl shadow-card flex flex-col items-center"
          >
            <Skeleton className="w-10 h-10 rounded-lg mb-2" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>

      {/* Info cards */}
      <SkeletonCard />
      <SkeletonCard />
    </div>
  )
}
