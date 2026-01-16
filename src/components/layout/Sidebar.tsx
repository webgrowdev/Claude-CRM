'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  UserRound,
  Kanban,
  CalendarDays,
  TrendingUp,
  Settings,
  Syringe,
  LogOut,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui'
import { useApp } from '@/contexts/AppContext'

const mainNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pacientes', label: 'Pacientes', icon: UserRound },
  { href: '/kanban', label: 'Pipeline', icon: Kanban },
  { href: '/calendar', label: 'Agenda', icon: CalendarDays },
  { href: '/reports', label: 'Reportes', icon: TrendingUp },
]

const secondaryNavItems = [
  { href: '/treatments', label: 'Tratamientos', icon: Syringe },
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
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-slate-900">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-slate-800">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <h1 className="text-xl font-display font-bold text-white tracking-tight">
            Clinic
          </h1>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-4">
        <Link
          href="/pacientes?action=new"
          className="flex items-center justify-center gap-2 w-full h-11 bg-primary-500 hover:bg-primary-400 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary-500/25"
        >
          <Plus className="w-5 h-5" />
          Nuevo Paciente
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <p className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
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
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          )
        })}

        <div className="pt-6">
          <p className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
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
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800 transition-colors">
          <Avatar name={state.user.name} size="md" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {state.user.name}
            </p>
            <p className="text-xs text-slate-500 truncate">{state.user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
