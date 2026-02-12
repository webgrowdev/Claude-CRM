'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Inbox,
  CalendarDays,
  Users,
  BarChart3,
  Settings,
  Syringe,
  LogOut,
  Plus,
  ChevronDown,
  HelpCircle,
  MapPin,
  LayoutDashboard,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui'
import { useApp } from '@/contexts/AppContext'
import { useLanguage } from '@/i18n'
import { useAuth } from '@/contexts/AuthContext' // <-- nuevo import

export function Sidebar() {
 const pathname = usePathname()
  const { state } = useApp()
  const { t } = useLanguage()
  const [showMore, setShowMore] = useState(false)
  const { logout } = useAuth() // use central logout


  // Main 4-section navigation
  const mainNavItems = [
    {
      href: '/dashboard',
      label: t.nav.home,
      icon: LayoutDashboard,
    },
    {
      href: '/inbox',
      label: t.nav.inbox,
      icon: Inbox,
      badge: state.patients.filter(p => p.status === 'new').length || undefined
    },
    { href: '/appointments', label: t.nav.appointments, icon: MapPin },
    { href: '/calendar', label: t.nav.calendar, icon: CalendarDays },
    { href: '/pacientes', label: t.nav.patients, icon: Users },
    { href: '/reports', label: t.nav.reports, icon: BarChart3 },
  ]

  // Secondary items
  const secondaryNavItems = [
    { href: '/treatments', label: t.nav.treatments, icon: Syringe },
    { href: '/settings', label: t.nav.settings, icon: Settings },
  ]

  const handleLogout = async () => {
    try {
      await logout()
    } catch (err) {
      console.error('Logout failed from Sidebar:', err)
      // fallback: legacy cleanup + redirect
      try {
        localStorage.removeItem('clinic_token')
        localStorage.removeItem('token')
        localStorage.removeItem('clinic_logged_in')
      } catch (_) {}
      window.location.href = '/login'
    }
  }

  // Get role display name
  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      owner: 'Administrador',
      manager: 'Gerente',
      doctor: 'Doctor',
      receptionist: 'Recepcionista',
    }
    return roles[role] || role
  }

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <div>
            <h1 className="text-lg font-display font-bold text-slate-800 tracking-tight">
              Clinic CRM
            </h1>
          </div>
        </Link>
      </div>

      {/* Quick Action */}
      <div className="px-4 py-4">
        <Link
          href="/pacientes?action=new"
          className="flex items-center justify-center gap-2 w-full h-11 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-all shadow-md shadow-primary-500/20 active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          {t.nav.newPatient}
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto scrollbar-thin">
        {mainNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-slate-600 hover:bg-gray-100 hover:text-slate-800'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive && 'text-primary-600')} />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-blue-500 text-white text-xs font-semibold rounded-full">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </Link>
          )
        })}

        {/* More Section */}
        <div className="pt-4 mt-4 border-t border-gray-100">
          <button
            onClick={() => setShowMore(!showMore)}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-slate-500 hover:bg-gray-100 hover:text-slate-700 transition-all"
          >
            <ChevronDown className={cn('w-5 h-5 transition-transform', showMore && 'rotate-180')} />
            <span>{t.nav.more}</span>
          </button>

          {showMore && (
            <div className="mt-1 space-y-1 animate-slide-down">
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
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-slate-600 hover:bg-gray-100 hover:text-slate-800'
                    )}
                  >
                    <Icon className={cn('w-5 h-5', isActive && 'text-primary-600')} />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Help Link */}
      <div className="px-4 py-2 border-t border-gray-100">
        <button
          onClick={() => {
            localStorage.removeItem('clinic_onboarding_completed')
            window.location.reload()
          }}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-xl text-sm text-slate-500 hover:bg-gray-100 hover:text-slate-700 transition-all"
        >
          <HelpCircle className="w-5 h-5" />
          <span>{t.settings.viewTutorial}</span>
        </button>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors">
          <Avatar name={state.user.name} size="md" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">
              {state.user.name}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {getRoleLabel(state.user.role)}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-error-500 hover:bg-error-50 rounded-lg transition-colors"
            title={t.auth.logout}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
