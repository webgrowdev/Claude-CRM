'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Inbox, CalendarDays, Users, MoreHorizontal, MapPin, LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/i18n'
import { useApp } from '@/contexts/AppContext'
type AppointmentLike = {
  date?: string | Date
  status?: string
}
export function BottomNav() {
  const pathname = usePathname()
  const { t, language } = useLanguage()
  const { state } = useApp()
  const [mounted, setMounted] = useState(false)
  const [pressedItem, setPressedItem] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Siempre usar arrays seguros aunque state o las propiedades no estén aún
  const leads = state?.leads ?? []
  const appointments = (state?.appointments ?? []) as AppointmentLike[]

  // Count new leads for badge
  const newLeadsCount = leads.filter(l => l.status === 'new').length

  // Count today's appointments
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const todayAppointmentsCount = appointments.filter((apt) => {
    if (!apt.date) return false // si no hay fecha, no cuenta

    const aptDate = new Date(apt.date)

    return (
      aptDate >= today &&
      aptDate < tomorrow &&
      apt.status !== 'cancelled'
    )
  }).length



  // Count urgent leads (48h+ waiting)
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000)
  const urgentCount = leads.filter(l =>
    l.status === 'new' &&
    l.createdAt &&
    new Date(l.createdAt) < fortyEightHoursAgo
  ).length

  const navItems = [
    {
      href: '/dashboard',
      label: t.nav.home,
      icon: LayoutDashboard,
      badge: undefined,
      accentColor: 'primary'
    },
    {
      href: '/inbox',
      label: t.nav.inbox,
      icon: Inbox,
      badge: newLeadsCount || undefined,
      badgeColor: urgentCount > 0 ? 'bg-red-500' : 'bg-blue-500',
      accentColor: 'blue'
    },
    {
      href: '/appointments',
      label: t.nav.appointments,
      icon: MapPin,
      badge: todayAppointmentsCount || undefined,
      badgeColor: 'bg-purple-500',
      accentColor: 'purple'
    },
    {
      href: '/pacientes',
      label: t.nav.patients,
      icon: Users,
      badge: undefined,
      accentColor: 'green'
    },
    {
      href: '/settings',
      label: t.nav.more,
      icon: MoreHorizontal,
      badge: undefined,
      accentColor: 'slate'
    },
  ]

  const handleTouchStart = (href: string) => {
    setPressedItem(href)
  }

  const handleTouchEnd = () => {
    setPressedItem(null)
  }

  // Define accent colors
  const accentColors: Record<string, { bg: string; text: string; activeGlow: string }> = {
    primary: {
      bg: 'bg-primary-100',
      text: 'text-primary-600',
      activeGlow: 'shadow-primary-200'
    },
    blue: {
      bg: 'bg-blue-100',
      text: 'text-blue-600',
      activeGlow: 'shadow-blue-200'
    },
    purple: {
      bg: 'bg-purple-100',
      text: 'text-purple-600',
      activeGlow: 'shadow-purple-200'
    },
    green: {
      bg: 'bg-green-100',
      text: 'text-green-600',
      activeGlow: 'shadow-green-200'
    },
    slate: {
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      activeGlow: 'shadow-slate-200'
    },
  }

  if (!mounted) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 safe-area-bottom lg:hidden">
        <div className="flex items-center justify-around h-16" />
      </nav>
    )
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-gray-100 safe-area-bottom lg:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const isPressed = pressedItem === item.href
          const Icon = item.icon
          const colors = accentColors[item.accentColor]

          return (
            <Link
              key={item.href}
              href={item.href}
              onTouchStart={() => handleTouchStart(item.href)}
              onTouchEnd={handleTouchEnd}
              onMouseDown={() => handleTouchStart(item.href)}
              onMouseUp={handleTouchEnd}
              onMouseLeave={handleTouchEnd}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full py-2 transition-all duration-200 relative',
                isActive ? colors.text : 'text-slate-400',
                isPressed && 'scale-90'
              )}
            >
              {/* Active indicator line */}
              {isActive && (
                <div className={cn(
                  'absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full',
                  colors.bg.replace('100', '500')
                )} />
              )}

              <div className="relative">
                <div className={cn(
                  'p-1.5 rounded-xl transition-all duration-200',
                  isActive && cn(colors.bg, 'shadow-md', colors.activeGlow)
                )}>
                  <Icon
                    className={cn(
                      'w-5 h-5 transition-all duration-200',
                      isActive && 'scale-110'
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>

                {/* Badge */}
                {item.badge && (
                  <span className={cn(
                    'absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-white text-[10px] font-bold rounded-full border-2 border-white animate-pulse',
                    item.badgeColor || 'bg-blue-500'
                  )}>
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>

              <span className={cn(
                'text-[10px] mt-0.5 font-medium transition-all duration-200',
                isActive && 'font-semibold'
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
