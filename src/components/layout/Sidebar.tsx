'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Users,
  Columns3,
  Calendar,
  BarChart3,
  Settings,
  ListTree,
  LogOut,
  Plus,
  Bell,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui'
import { useApp } from '@/contexts/AppContext'

const mainNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/kanban', label: 'Pipeline', icon: Columns3 },
  { href: '/calendar', label: 'Agenda', icon: Calendar },
  { href: '/reports', label: 'Reportes', icon: BarChart3 },
]

const secondaryNavItems = [
  { href: '/treatments', label: 'Tratamientos', icon: ListTree },
  { href: '/settings', label: 'Configuración', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { state } = useApp()

  const handleLogout = () => {
    localStorage.removeItem('clinic_logged_in')
    window.location.href = '/login'
  }

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-slate-200">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-slate-100">
        <Link href="/dashboard" className="flex items-center gap-2">
          <h1 className="text-2xl font-display font-bold text-slate-800 tracking-tight">
            Clin
            <span className="relative">
              i
              <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-secondary-400 rounded-full" />
            </span>
            c
          </h1>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-4">
        <Link
          href="/leads?action=new"
          className="flex items-center justify-center gap-2 w-full h-10 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Lead
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <p className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Principal
        </p>
        {mainNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive && 'text-primary-600')} />
              {item.label}
            </Link>
          )
        })}

        <div className="pt-4">
          <p className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Configuración
          </p>
          {secondaryNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <Icon className={cn('w-5 h-5', isActive && 'text-primary-600')} />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <Avatar name={state.user.name} size="md" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">
              {state.user.name}
            </p>
            <p className="text-xs text-slate-500 truncate">{state.user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-error-600 hover:bg-error-50 rounded-lg transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
