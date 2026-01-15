'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Bell, MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui'
import { useApp } from '@/contexts/AppContext'

export interface HeaderProps {
  title?: string
  showBack?: boolean
  showProfile?: boolean
  showNotifications?: boolean
  showMenu?: boolean
  onMenuClick?: () => void
  rightContent?: React.ReactNode
  greeting?: boolean
  transparent?: boolean
}

export function Header({
  title,
  showBack = false,
  showProfile = false,
  showNotifications = false,
  showMenu = false,
  onMenuClick,
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
        transparent ? 'bg-transparent' : 'bg-white border-b border-slate-100'
      )}
    >
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left */}
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {greeting ? (
            <div>
              <p className="text-lg font-semibold text-slate-800">
                {getGreeting()}, {state.user.name.split(' ')[0]}
              </p>
              <p className="text-sm text-slate-500 capitalize">{formatDate()}</p>
            </div>
          ) : (
            title && <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {rightContent}

          {showNotifications && (
            <Link
              href="/notifications"
              className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
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
            <Link href="/settings" className="ml-1">
              <Avatar name={state.user.name} src={state.user.avatar} size="sm" />
            </Link>
          )}

          {showMenu && (
            <button
              onClick={onMenuClick}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
