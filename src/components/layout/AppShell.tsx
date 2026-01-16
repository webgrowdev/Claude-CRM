'use client'

import React from 'react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { Onboarding, useOnboarding } from '@/components/ui'

interface AppShellProps {
  children: React.ReactNode
  hideNav?: boolean
}

export function AppShell({ children, hideNav = false }: AppShellProps) {
  const { showOnboarding, isLoaded, completeOnboarding } = useOnboarding()

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      {!hideNav && <Sidebar />}

      {/* Main Content */}
      <div className={!hideNav ? 'lg:pl-64' : ''}>
        {children}
      </div>

      {/* Mobile Bottom Navigation */}
      {!hideNav && <BottomNav />}

      {/* Onboarding Tutorial */}
      {isLoaded && showOnboarding && (
        <Onboarding onComplete={completeOnboarding} />
      )}
    </div>
  )
}
