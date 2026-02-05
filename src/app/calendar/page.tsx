'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  addDays,
  isBefore,
  isAfter,
} from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ChevronLeft,
  ChevronRight,
  Phone,
  MessageCircle,
  Calendar as CalendarIcon,
  Video,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
  ExternalLink,
  Users,
  Plus,
} from 'lucide-react'
import { AppShell } from '@/components/layout'
import { Card, Avatar, Button, Badge, Modal } from '@/components/ui'
import { ScheduleFollowUpModal } from '@/components/calendar'
import { useApp } from '@/contexts/AppContext'
import { useLanguage } from '@/i18n'
import { cn, formatRelativeDate } from '@/lib/utils'
import { FollowUp, Lead, FollowUpType } from '@/types'

type ViewMode = 'day' | 'week' | 'month'

// Follow-up with lead info
interface FollowUpWithLead {
  lead: Lead
  followUp: FollowUp
}

export default function CalendarPage() {
  const router = useRouter()
  const { state, getUpcomingFollowUps, completeFollowUp } = useApp()
  const { t } = useLanguage()

  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('day')
  const [showActionModal, setShowActionModal] = useState(false)
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUpWithLead | null>(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)

  const allFollowUps = useMemo(
    () => getUpcomingFollowUps(),
    [getUpcomingFollowUps, state.leads]
  )

  // Get days with follow-ups
  const daysWithFollowUps = useMemo(() => {
    const days = new Map<string, number>()
    allFollowUps.forEach(({ followUp }) => {
      const key = format(new Date(followUp.scheduledAt), 'yyyy-MM-dd')
      days.set(key, (days.get(key) || 0) + 1)
    })
    return days
  }, [allFollowUps])

  // Get follow-ups for selected date
  const selectedDateFollowUps = useMemo(() => {
    return allFollowUps
      .filter(({ followUp }) => isSameDay(new Date(followUp.scheduledAt), selectedDate))
      .sort(
        (a, b) =>
          new Date(a.followUp.scheduledAt).getTime() -
          new Date(b.followUp.scheduledAt).getTime()
      )
  }, [allFollowUps, selectedDate])

  // Get follow-ups for the week
  const weekFollowUps = useMemo(() => {
    const weekStart = startOfWeek(selectedDate, { locale: es })
    const weekEnd = endOfWeek(selectedDate, { locale: es })
    return allFollowUps.filter(
      ({ followUp }) =>
        isAfter(new Date(followUp.scheduledAt), weekStart) &&
        isBefore(new Date(followUp.scheduledAt), weekEnd)
    )
  }, [allFollowUps, selectedDate])

  // Calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calendarStart = startOfWeek(monthStart, { locale: es })
    const calendarEnd = endOfWeek(monthEnd, { locale: es })
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }, [currentMonth])

  // Get follow-up type config
  const getFollowUpTypeConfig = (type: FollowUpType) => {
    const configs: Record<FollowUpType, { icon: typeof Phone; color: string; bgColor: string; label: string }> = {
      call: {
        icon: Phone,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        label: t.followUp.typeCall,
      },
      message: {
        icon: MessageCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        label: t.followUp.typeMessage,
      },
      email: {
        icon: MessageCircle,
        color: 'text-amber-600',
        bgColor: 'bg-amber-100',
        label: t.followUp.typeEmail,
      },
      meeting: {
        icon: Video,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        label: t.followUp.typeMeeting,
      },
      appointment: {
        icon: CalendarIcon,
        color: 'text-teal-600',
        bgColor: 'bg-teal-100',
        label: t.followUp.typeAppointment,
      },
    }
    return configs[type] || configs.call
  }

  const handleCompleteFollowUp = (leadId: string, followUpId: string) => {
    completeFollowUp(leadId, followUpId)
    setShowActionModal(false)
    setSelectedFollowUp(null)
  }

  const handleFollowUpClick = (item: FollowUpWithLead) => {
    setSelectedFollowUp(item)
    setShowActionModal(true)
  }

  const goToPatient = (leadId: string) => {
    router.push(`/pacientes?id=${leadId}`)
  }

  // Today's stats
  const todayStats = useMemo(() => {
    const todayFollowUps = allFollowUps.filter(({ followUp }) =>
      isToday(new Date(followUp.scheduledAt))
    )
    return {
      total: todayFollowUps.length,
      calls: todayFollowUps.filter(({ followUp }) => followUp.type === 'call').length,
      meetings: todayFollowUps.filter(({ followUp }) => followUp.type === 'meeting')
        .length,
    }
  }, [allFollowUps])

  return (
    <AppShell>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4 lg:px-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-display font-bold text-slate-800">
                {t.nav.calendar}
              </h1>
              <p className="text-sm text-slate-500">
                {todayStats.total} {t.dashboard.followUps.toLowerCase()} {t.calendar.today.toLowerCase()}
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowScheduleModal(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              {t.followUp.title}
            </Button>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2">
            {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  viewMode === mode
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                )}
              >
                {mode === 'day' ? t.calendar.today : mode === 'week' ? 'Semana' : 'Mes'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-6">
        {/* Desktop: Side-by-side layout */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-6">
          {/* Calendar - Takes 5 columns on desktop */}
          <div className="lg:col-span-5">
            <Card padding="none" className="overflow-hidden">
              {/* Month Navigation */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-600" />
                </button>
                <h2 className="text-lg font-semibold text-slate-800 capitalize">
                  {format(currentMonth, 'MMMM yyyy', { locale: es })}
                </h2>
                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              {/* Weekday Headers */}
              <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/30">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                  <div
                    key={day}
                    className="py-2 text-center text-xs font-medium text-slate-500 uppercase"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7">
                {calendarDays.map((day, index) => {
                  const dateKey = format(day, 'yyyy-MM-dd')
                  const followUpCount = daysWithFollowUps.get(dateKey) || 0
                  const isSelected = isSameDay(day, selectedDate)
                  const isCurrentMonth = isSameMonth(day, currentMonth)
                  const isDayToday = isToday(day)

                  return (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedDate(day)
                        setCurrentMonth(day)
                      }}
                      className={cn(
                        'relative h-12 lg:h-14 flex flex-col items-center justify-center transition-all',
                        !isCurrentMonth && 'text-slate-300',
                        isCurrentMonth && !isSelected && 'text-slate-700 hover:bg-gray-50',
                        isSelected && 'bg-primary-500 text-white rounded-xl m-0.5',
                        isDayToday && !isSelected && 'font-bold text-primary-600'
                      )}
                    >
                      <span className="text-sm font-medium">{format(day, 'd')}</span>
                      {followUpCount > 0 && (
                        <div className="flex items-center gap-0.5 mt-0.5">
                          {followUpCount <= 3 ? (
                            [...Array(followUpCount)].map((_, i) => (
                              <span
                                key={i}
                                className={cn(
                                  'w-1 h-1 rounded-full',
                                  isSelected ? 'bg-white' : 'bg-primary-500'
                                )}
                              />
                            ))
                          ) : (
                            <span
                              className={cn(
                                'text-[10px] font-bold',
                                isSelected ? 'text-white' : 'text-primary-600'
                              )}
                            >
                              {followUpCount}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </Card>

            {/* Today Button */}
            {!isToday(selectedDate) && (
              <div className="mt-4 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedDate(new Date())
                    setCurrentMonth(new Date())
                  }}
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {t.calendar.today}
                </Button>
              </div>
            )}
          </div>

          {/* Follow-ups Panel - Takes 7 columns on desktop */}
          <div className="lg:col-span-7 mt-6 lg:mt-0">
            {/* Selected Date Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800 capitalize">
                {isToday(selectedDate)
                  ? t.calendar.today
                  : format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
              </h3>
              {selectedDateFollowUps.length > 0 && (
                <Badge variant="primary">
                  {selectedDateFollowUps.length} {t.dashboard.followUps.toLowerCase()}
                </Badge>
              )}
            </div>

            {/* Follow-ups List */}
            {selectedDateFollowUps.length === 0 ? (
              <Card>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <CalendarIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-medium text-slate-700 mb-2">
                    {t.calendar.noEventsToday}
                  </h4>
                  <p className="text-sm text-slate-500 mb-4">
                    {t.dashboard.noFollowUps}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowScheduleModal(true)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    {t.followUp.schedule}
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {selectedDateFollowUps.map(({ lead, followUp }) => {
                  const typeConfig = getFollowUpTypeConfig(followUp.type)
                  const Icon = typeConfig.icon
                  const isPast =
                    new Date(followUp.scheduledAt).getTime() < new Date().getTime()

                  return (
                    <Card
                      key={followUp.id}
                      padding="none"
                      className={cn(
                        'overflow-hidden cursor-pointer transition-all hover:shadow-card-hover',
                        isPast && !followUp.completed && 'border-l-4 border-l-amber-500'
                      )}
                      onClick={() => handleFollowUpClick({ lead, followUp })}
                    >
                      <div className="flex items-start gap-4 p-4">
                        {/* Time */}
                        <div className="flex flex-col items-center min-w-[50px]">
                          <span className="text-lg font-bold text-slate-800">
                            {format(new Date(followUp.scheduledAt), 'HH:mm')}
                          </span>
                          {followUp.duration && (
                            <span className="text-xs text-slate-500">
                              {followUp.duration}min
                            </span>
                          )}
                        </div>

                        {/* Type Icon */}
                        <div
                          className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                            typeConfig.bgColor
                          )}
                        >
                          <Icon className={cn('w-5 h-5', typeConfig.color)} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-800 truncate">
                              {lead.name}
                            </p>
                            {followUp.meetLink && (
                              <Badge variant="secondary" size="sm">
                                <Video className="w-3 h-3 mr-1" />
                                Meet
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-600">
                            {typeConfig.label}
                            {followUp.notes && ` - ${followUp.notes}`}
                          </p>
                          {lead.treatments.length > 0 && (
                            <p className="text-xs text-slate-400 mt-1">
                              {lead.treatments.slice(0, 2).join(', ')}
                            </p>
                          )}
                        </div>

                        {/* Quick Actions */}
                        <div className="flex items-center gap-2">
                          {followUp.meetLink && (
                            <a
                              href={followUp.meetLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCompleteFollowUp(lead.id, followUp.id)
                            }}
                            className="p-2 bg-success-100 text-success-600 rounded-lg hover:bg-success-200 transition-colors"
                            title={t.calendar.markComplete}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}

            {/* All Upcoming */}
            {allFollowUps.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                  {t.calendar.upcomingEvents}
                </h3>
                <Card padding="none">
                  <div className="divide-y divide-gray-100">
                    {allFollowUps.slice(0, 5).map(({ lead, followUp }) => {
                      const typeConfig = getFollowUpTypeConfig(followUp.type)
                      const Icon = typeConfig.icon

                      return (
                        <div
                          key={followUp.id}
                          onClick={() => goToPatient(lead.id)}
                          className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <div
                            className={cn(
                              'w-9 h-9 rounded-lg flex items-center justify-center',
                              typeConfig.bgColor
                            )}
                          >
                            <Icon className={cn('w-4 h-4', typeConfig.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-800 truncate">
                              {lead.name}
                            </p>
                            <p className="text-sm text-slate-500">{typeConfig.label}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-slate-800">
                              {formatRelativeDate(new Date(followUp.scheduledAt))}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spacer for mobile */}
      <div className="h-20 lg:hidden" />

      {/* Action Modal */}
      <Modal
        isOpen={showActionModal}
        onClose={() => {
          setShowActionModal(false)
          setSelectedFollowUp(null)
        }}
        title={selectedFollowUp ? selectedFollowUp.lead.name : ''}
      >
        {selectedFollowUp && (
          <div className="p-4 space-y-4">
            {/* Follow-up Info */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center',
                  getFollowUpTypeConfig(selectedFollowUp.followUp.type).bgColor
                )}
              >
                {(() => {
                  const Icon = getFollowUpTypeConfig(selectedFollowUp.followUp.type).icon
                  return (
                    <Icon
                      className={cn(
                        'w-5 h-5',
                        getFollowUpTypeConfig(selectedFollowUp.followUp.type).color
                      )}
                    />
                  )
                })()}
              </div>
              <div>
                <p className="font-medium text-slate-800">
                  {getFollowUpTypeConfig(selectedFollowUp.followUp.type).label}
                </p>
                <p className="text-sm text-slate-500">
                  {format(
                    new Date(selectedFollowUp.followUp.scheduledAt),
                    "EEEE d 'de' MMMM, HH:mm",
                    { locale: es }
                  )}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="primary"
                onClick={() =>
                  handleCompleteFollowUp(
                    selectedFollowUp.lead.id,
                    selectedFollowUp.followUp.id
                  )
                }
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {t.calendar.markComplete}
              </Button>
              <Button
                variant="outline"
                onClick={() => goToPatient(selectedFollowUp.lead.id)}
              >
                <Users className="w-4 h-4 mr-2" />
                Ver Paciente
              </Button>
            </div>

            {selectedFollowUp.followUp.meetLink && (
              <a
                href={selectedFollowUp.followUp.meetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-purple-100 text-purple-700 rounded-xl font-medium hover:bg-purple-200 transition-colors"
              >
                <Video className="w-5 h-5" />
                {t.calendar.joinMeet}
              </a>
            )}
          </div>
        )}
      </Modal>

      {/* Schedule Follow-up Modal */}
      <ScheduleFollowUpModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        language={language}
      />
    </AppShell>
  )
}
