'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Bell, MoreVertical, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui'
import { useApp } from '@/contexts/AppContext'

export interface HeaderProps {
  title?: string
  subtitle?: string
  showBack?: boolean
  showProfile?: boolean
  showNotifications?: boolean
  showMenu?: boolean
  showSearch?: boolean
  onMenuClick?: () => void
  onSearchClick?: () => void
  rightContent?: React.ReactNode
  greeting?: boolean
  transparent?: boolean
}

export function Header({
  title,
  subtitle,
  showBack = false,
  showProfile = false,
  showNotifications = false,
  showMenu = false,
  showSearch = false,
  onMenuClick,
  onSearchClick,
  rightContent,
  greeting = false,
  transparent = false,
}: HeaderProps) {
  const router = useRouter()
  const { state, getUnreadNotificationsCount } = useApp()
  const unreadCount = getUnreadNotificationsCount()

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Buenos días'
    if (hour < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }

  const formatDate = () => {
    return new Date().toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-30 safe-area-top',
        transparent
          ? 'bg-transparent'
          : 'bg-white border-b border-slate-100 lg:bg-slate-50/80 lg:backdrop-blur-sm lg:border-none'
      )}
    >
      <div className="flex items-center justify-between h-14 lg:h-16 px-4 lg:px-8">
        {/* Left */}
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors lg:hover:bg-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {greeting ? (
            <div>
              <p className="text-lg lg:text-2xl font-semibold text-slate-800">
                {getGreeting()}, {state.user.name.split(' ')[0]}
              </p>
              <p className="text-sm text-slate-500 capitalize">{formatDate()}</p>
            </div>
          ) : (
            <div>
              {title && (
                <h1 className="text-lg lg:text-2xl font-semibold text-slate-800">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-sm text-slate-500">{subtitle}</p>
              )}
            </div>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 lg:gap-3">
          {showSearch && (
            <button
              onClick={onSearchClick}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 lg:hover:bg-white transition-colors lg:hidden"
            >
              <Search className="w-5 h-5" />
            </button>
          )}

          {rightContent}

          {showNotifications && (
            <Link
              href="/notifications"
              className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 lg:hover:bg-white transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-error-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          )}

          {showProfile && (
            <Link href="/settings" className="ml-1 lg:hidden">
              <Avatar name={state.user.name} src={state.user.avatar} size="sm" />
            </Link>
          )}

          {showMenu && (
            <button
              onClick={onMenuClick}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 lg:hover:bg-white transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
