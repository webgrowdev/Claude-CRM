'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, UserRound, Kanban, CalendarDays, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/i18n'

export function BottomNav() {
  const pathname = usePathname()
  const { t } = useLanguage()

  const navItems = [
    { href: '/dashboard', label: t.nav.home, icon: LayoutDashboard },
    { href: '/pacientes', label: t.nav.patients, icon: UserRound },
    { href: '/kanban', label: t.nav.pipeline, icon: Kanban },
    { href: '/calendar', label: t.nav.calendar, icon: CalendarDays },
    { href: '/settings', label: t.nav.settings, icon: Settings },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-lg border-t border-slate-200/50 safe-area-bottom lg:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full py-2 transition-all',
                isActive ? 'text-primary-600' : 'text-slate-400'
              )}
            >
              <div className={cn(
                'p-1.5 rounded-xl transition-all',
                isActive && 'bg-primary-100'
              )}>
                <Icon
                  className="w-5 h-5"
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
