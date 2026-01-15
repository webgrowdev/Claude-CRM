'use client'

import React from 'react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

interface AppShellProps {
  children: React.ReactNode
  hideNav?: boolean
}

export function AppShell({ children, hideNav = false }: AppShellProps) {
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
    </div>
  )
}
