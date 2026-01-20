'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Trash2,
  Calendar,
  MessageCircle,
  CreditCard,
  AlertCircle,
  UserPlus,
  Star,
  Settings,
  ChevronRight,
  Clock,
  Filter,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, Badge, Modal, Avatar } from '@/components/ui'
import { useLanguage } from '@/i18n/LanguageContext'
import { formatTimeAgo } from '@/lib/utils'

// Types
export type NotificationType =
  | 'lead_new'
  | 'lead_hot'
  | 'appointment_scheduled'
  | 'appointment_reminder'
  | 'appointment_cancelled'
  | 'payment_received'
  | 'payment_overdue'
  | 'message_received'
  | 'follow_up_due'
  | 'system'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionUrl?: string
  metadata?: {
    leadId?: string
    leadName?: string
    appointmentId?: string
    amount?: number
  }
}

interface NotificationCenterProps {
  notifications: Notification[]
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onDelete: (id: string) => void
  onClearAll: () => void
  onNotificationClick?: (notification: Notification) => void
}

export function NotificationCenter({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClearAll,
  onNotificationClick,
}: NotificationCenterProps) {
  const { language } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const t = {
    notifications: language === 'es' ? 'Notificaciones' : 'Notifications',
    markAllRead: language === 'es' ? 'Marcar todo como leído' : 'Mark all as read',
    clearAll: language === 'es' ? 'Limpiar todo' : 'Clear all',
    noNotifications: language === 'es' ? 'No tienes notificaciones' : 'No notifications',
    noUnread: language === 'es' ? 'No tienes notificaciones sin leer' : 'No unread notifications',
    all: language === 'es' ? 'Todas' : 'All',
    unread: language === 'es' ? 'Sin leer' : 'Unread',
    today: language === 'es' ? 'Hoy' : 'Today',
    yesterday: language === 'es' ? 'Ayer' : 'Yesterday',
    earlier: language === 'es' ? 'Anteriores' : 'Earlier',
    viewAll: language === 'es' ? 'Ver todas' : 'View all',
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') {
      return notifications.filter(n => !n.read)
    }
    return notifications
  }, [notifications, filter])

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    const groups: { label: string; notifications: Notification[] }[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    let todayGroup: Notification[] = []
    let yesterdayGroup: Notification[] = []
    let earlierGroup: Notification[] = []

    filteredNotifications.forEach(notification => {
      const notifDate = new Date(notification.timestamp)
      notifDate.setHours(0, 0, 0, 0)

      if (notifDate.getTime() === today.getTime()) {
        todayGroup.push(notification)
      } else if (notifDate.getTime() === yesterday.getTime()) {
        yesterdayGroup.push(notification)
      } else {
        earlierGroup.push(notification)
      }
    })

    if (todayGroup.length > 0) {
      groups.push({ label: t.today, notifications: todayGroup })
    }
    if (yesterdayGroup.length > 0) {
      groups.push({ label: t.yesterday, notifications: yesterdayGroup })
    }
    if (earlierGroup.length > 0) {
      groups.push({ label: t.earlier, notifications: earlierGroup })
    }

    return groups
  }, [filteredNotifications, t.today, t.yesterday, t.earlier])

  const getNotificationIcon = (type: NotificationType) => {
    const icons: Record<NotificationType, { icon: React.ReactNode; bg: string; color: string }> = {
      lead_new: {
        icon: <UserPlus className="w-4 h-4" />,
        bg: 'bg-blue-100',
        color: 'text-blue-600',
      },
      lead_hot: {
        icon: <Star className="w-4 h-4" />,
        bg: 'bg-orange-100',
        color: 'text-orange-600',
      },
      appointment_scheduled: {
        icon: <Calendar className="w-4 h-4" />,
        bg: 'bg-purple-100',
        color: 'text-purple-600',
      },
      appointment_reminder: {
        icon: <Clock className="w-4 h-4" />,
        bg: 'bg-amber-100',
        color: 'text-amber-600',
      },
      appointment_cancelled: {
        icon: <Calendar className="w-4 h-4" />,
        bg: 'bg-red-100',
        color: 'text-red-600',
      },
      payment_received: {
        icon: <CreditCard className="w-4 h-4" />,
        bg: 'bg-green-100',
        color: 'text-green-600',
      },
      payment_overdue: {
        icon: <CreditCard className="w-4 h-4" />,
        bg: 'bg-red-100',
        color: 'text-red-600',
      },
      message_received: {
        icon: <MessageCircle className="w-4 h-4" />,
        bg: 'bg-green-100',
        color: 'text-green-600',
      },
      follow_up_due: {
        icon: <AlertCircle className="w-4 h-4" />,
        bg: 'bg-amber-100',
        color: 'text-amber-600',
      },
      system: {
        icon: <Settings className="w-4 h-4" />,
        bg: 'bg-slate-100',
        color: 'text-slate-600',
      },
    }
    return icons[type] || icons.system
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      onMarkAsRead(notification.id)
    }
    onNotificationClick?.(notification)
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        aria-label={t.notifications}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={t.notifications}
        size="md"
      >
        <div className="-mx-6 -mb-6">
          {/* Filters and Actions */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
            <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
              <button
                onClick={() => setFilter('all')}
                className={cn(
                  'px-3 py-1 rounded-md text-sm font-medium transition-colors',
                  filter === 'all'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                )}
              >
                {t.all}
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={cn(
                  'px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center gap-1',
                  filter === 'unread'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                )}
              >
                {t.unread}
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  title={t.markAllRead}
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={onClearAll}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title={t.clearAll}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[60vh] overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500">
                  {filter === 'unread' ? t.noUnread : t.noNotifications}
                </p>
              </div>
            ) : (
              <div>
                {groupedNotifications.map(group => (
                  <div key={group.label}>
                    <div className="px-4 py-2 bg-slate-50 border-y border-slate-100">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {group.label}
                      </span>
                    </div>
                    {group.notifications.map(notification => {
                      const iconStyle = getNotificationIcon(notification.type)

                      return (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={cn(
                            'flex items-start gap-3 px-4 py-3 border-b border-slate-50 cursor-pointer transition-colors',
                            !notification.read
                              ? 'bg-primary-50/30 hover:bg-primary-50/50'
                              : 'hover:bg-slate-50'
                          )}
                        >
                          <div className={cn(
                            'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0',
                            iconStyle.bg,
                            iconStyle.color
                          )}>
                            {iconStyle.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={cn(
                                'text-sm',
                                !notification.read ? 'font-medium text-slate-800' : 'text-slate-700'
                              )}>
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1.5" />
                              )}
                            </div>
                            <p className="text-sm text-slate-500 line-clamp-2 mt-0.5">
                              {notification.message}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              {formatTimeAgo(notification.timestamp)}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onDelete(notification.id)
                            }}
                            className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  )
}

// Notification Dropdown (simpler version for header)
interface NotificationDropdownProps {
  notifications: Notification[]
  onMarkAsRead: (id: string) => void
  onNotificationClick?: (notification: Notification) => void
  maxItems?: number
}

export function NotificationDropdown({
  notifications,
  onMarkAsRead,
  onNotificationClick,
  maxItems = 5,
}: NotificationDropdownProps) {
  const { language } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  const t = {
    notifications: language === 'es' ? 'Notificaciones' : 'Notifications',
    noNotifications: language === 'es' ? 'Sin notificaciones nuevas' : 'No new notifications',
    viewAll: language === 'es' ? 'Ver todas' : 'View all',
  }

  const unreadNotifications = notifications.filter(n => !n.read).slice(0, maxItems)

  const getNotificationIcon = (type: NotificationType) => {
    const icons: Record<NotificationType, { icon: React.ReactNode; bg: string; color: string }> = {
      lead_new: { icon: <UserPlus className="w-3.5 h-3.5" />, bg: 'bg-blue-100', color: 'text-blue-600' },
      lead_hot: { icon: <Star className="w-3.5 h-3.5" />, bg: 'bg-orange-100', color: 'text-orange-600' },
      appointment_scheduled: { icon: <Calendar className="w-3.5 h-3.5" />, bg: 'bg-purple-100', color: 'text-purple-600' },
      appointment_reminder: { icon: <Clock className="w-3.5 h-3.5" />, bg: 'bg-amber-100', color: 'text-amber-600' },
      appointment_cancelled: { icon: <Calendar className="w-3.5 h-3.5" />, bg: 'bg-red-100', color: 'text-red-600' },
      payment_received: { icon: <CreditCard className="w-3.5 h-3.5" />, bg: 'bg-green-100', color: 'text-green-600' },
      payment_overdue: { icon: <CreditCard className="w-3.5 h-3.5" />, bg: 'bg-red-100', color: 'text-red-600' },
      message_received: { icon: <MessageCircle className="w-3.5 h-3.5" />, bg: 'bg-green-100', color: 'text-green-600' },
      follow_up_due: { icon: <AlertCircle className="w-3.5 h-3.5" />, bg: 'bg-amber-100', color: 'text-amber-600' },
      system: { icon: <Settings className="w-3.5 h-3.5" />, bg: 'bg-slate-100', color: 'text-slate-600' },
    }
    return icons[type] || icons.system
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        aria-label={t.notifications}
      >
        <Bell className="w-5 h-5" />
        {unreadNotifications.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white animate-pulse">
            {unreadNotifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">{t.notifications}</h3>
            </div>

            {unreadNotifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-slate-500">{t.noNotifications}</p>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {unreadNotifications.map(notification => {
                  const iconStyle = getNotificationIcon(notification.type)

                  return (
                    <div
                      key={notification.id}
                      onClick={() => {
                        onMarkAsRead(notification.id)
                        onNotificationClick?.(notification)
                        setIsOpen(false)
                      }}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-50 last:border-0"
                    >
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                        iconStyle.bg,
                        iconStyle.color
                      )}>
                        {iconStyle.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 line-clamp-1">
                          {notification.title}
                        </p>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {formatTimeAgo(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="px-4 py-2 border-t border-slate-100 bg-slate-50">
              <button className="w-full text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center gap-1 py-1">
                {t.viewAll}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
