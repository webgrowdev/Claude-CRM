'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Inbox, CalendarDays, Users, MoreHorizontal, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/i18n'
import { useApp } from '@/contexts/AppContext'

export function BottomNav() {
  const pathname = usePathname()
  const { t } = useLanguage()
  const { state } = useApp()

  // Count new leads for badge
  const newLeadsCount = state.leads.filter(l => l.status === 'new').length

  const navItems = [
    {
      href: '/inbox',
      label: t.nav.inbox,
      icon: Inbox,
      badge: newLeadsCount || undefined
    },
    { href: '/appointments', label: t.appointments.title, icon: MapPin },
    { href: '/pacientes', label: t.nav.patients, icon: Users },
    { href: '/settings', label: t.nav.more, icon: MoreHorizontal },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 safe-area-bottom lg:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full py-2 transition-all relative',
                isActive ? 'text-primary-600' : 'text-slate-400'
              )}
            >
              <div className="relative">
                <div className={cn(
                  'p-1.5 rounded-xl transition-all',
                  isActive && 'bg-primary-100'
                )}>
                  <Icon
                    className="w-5 h-5"
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>
                {item.badge && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-blue-500 text-white text-[10px] font-bold rounded-full border-2 border-white">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
