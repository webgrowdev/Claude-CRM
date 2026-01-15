'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface PageContainerProps {
  children: React.ReactNode
  className?: string
  withBottomNav?: boolean
  fullHeight?: boolean
  noPadding?: boolean
}

export function PageContainer({
  children,
  className,
  withBottomNav = true,
  fullHeight = false,
  noPadding = false,
}: PageContainerProps) {
  return (
    <main
      className={cn(
        'bg-slate-50',
        fullHeight && 'min-h-screen',
        withBottomNav && 'pb-20',
        !noPadding && 'px-4 py-4',
        className
      )}
    >
      {children}
    </main>
  )
}
