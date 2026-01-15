'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Columns3, Calendar, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  {
    href: '/dashboard',
    label: 'Inicio',
    icon: Home,
  },
  {
    href: '/leads',
    label: 'Leads',
    icon: Users,
  },
  {
    href: '/kanban',
    label: 'Pipeline',
    icon: Columns3,
  },
  {
    href: '/calendar',
    label: 'Agenda',
    icon: Calendar,
  },
  {
    href: '/settings',
    label: 'Ajustes',
    icon: Settings,
  },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full py-2 transition-colors',
                isActive ? 'text-primary-600' : 'text-slate-400'
              )}
            >
              <Icon
                className={cn('w-6 h-6', isActive && 'fill-primary-100')}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
