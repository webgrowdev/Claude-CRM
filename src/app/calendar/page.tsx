'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
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
} from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ChevronLeft,
  ChevronRight,
  Phone,
  MessageCircle,
  Calendar as CalendarIcon,
  Plus,
  CheckCircle
} from 'lucide-react'
import { Header, PageContainer, AppShell } from '@/components/layout'
import { Card, Avatar, Button, EmptyState } from '@/components/ui'
import { useApp } from '@/contexts/AppContext'
import { formatRelativeDate } from '@/lib/utils'

export default function CalendarPage() {
  const { state, getUpcomingFollowUps, completeFollowUp } = useApp()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())

  const allFollowUps = useMemo(() => getUpcomingFollowUps(), [getUpcomingFollowUps, state.leads])

  // Get days with follow-ups
  const daysWithFollowUps = useMemo(() => {
    const days = new Set<string>()
    allFollowUps.forEach(({ followUp }) => {
      days.add(format(new Date(followUp.scheduledAt), 'yyyy-MM-dd'))
    })
    return days
  }, [allFollowUps])

  // Get follow-ups for selected date
  const selectedDateFollowUps = useMemo(() => {
    return allFollowUps.filter(({ followUp }) =>
      isSameDay(new Date(followUp.scheduledAt), selectedDate)
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

  const getFollowUpIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="w-4 h-4 text-primary-500" />
      case 'message':
        return <MessageCircle className="w-4 h-4 text-success-500" />
      default:
        return <CalendarIcon className="w-4 h-4 text-purple-500" />
    }
  }

  const handleCompleteFollowUp = (leadId: string, followUpId: string) => {
    completeFollowUp(leadId, followUpId)
  }

  return (
    <AppShell>
      <Header title="Agenda" />

      <PageContainer>
        {/* Desktop: Side-by-side layout */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-6">
          {/* Calendar - Takes 5 columns on desktop */}
          <div className="lg:col-span-5">
            <Card padding="none">
              {/* Month Navigation */}
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-600" />
                </button>
                <h2 className="text-lg font-semibold text-slate-800 capitalize">
                  {format(currentMonth, 'MMMM yyyy', { locale: es })}
                </h2>
                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              {/* Weekday Headers */}
              <div className="grid grid-cols-7 border-b border-slate-100">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                  <div
                    key={day}
                    className="py-2 text-center text-xs font-medium text-slate-500"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7">
                {calendarDays.map((day, index) => {
                  const dateKey = format(day, 'yyyy-MM-dd')
                  const hasFollowUp = daysWithFollowUps.has(dateKey)
                  const isSelected = isSameDay(day, selectedDate)
                  const isCurrentMonth = isSameMonth(day, currentMonth)
                  const isDayToday = isToday(day)

                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedDate(day)}
                      className={`relative h-12 lg:h-14 flex flex-col items-center justify-center transition-colors ${
                        !isCurrentMonth ? 'text-slate-300' : 'text-slate-700'
                      } ${isSelected ? 'bg-primary-500 text-white rounded-lg' : 'hover:bg-slate-50'}`}
                    >
                      <span
                        className={`text-sm font-medium ${
                          isDayToday && !isSelected ? 'text-primary-600' : ''
                        }`}
                      >
                        {format(day, 'd')}
                      </span>
                      {hasFollowUp && (
                        <span
                          className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${
                            isSelected ? 'bg-white' : 'bg-primary-500'
                          }`}
                        />
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
                  Ir a hoy
                </Button>
              </div>
            )}
          </div>

          {/* Follow-ups Panel - Takes 7 columns on desktop */}
          <div className="lg:col-span-7">
            {/* Selected Date Follow-ups */}
            <div className="mt-6 lg:mt-0">
              <h3 className="text-base lg:text-lg font-semibold text-slate-800 mb-3 capitalize">
                {isToday(selectedDate)
                  ? 'Hoy'
                  : format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
              </h3>

              {selectedDateFollowUps.length === 0 ? (
                <Card>
                  <EmptyState
                    icon={<CalendarIcon className="w-8 h-8" />}
                    title="Sin seguimientos"
                    description="No hay seguimientos programados para este día"
                  />
                </Card>
              ) : (
                <Card padding="none">
                  <div className="divide-y divide-slate-100">
                    {selectedDateFollowUps.map(({ lead, followUp }) => (
                      <div
                        key={followUp.id}
                        className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-semibold text-slate-800">
                            {format(new Date(followUp.scheduledAt), 'HH:mm')}
                          </span>
                        </div>

                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                          {getFollowUpIcon(followUp.type)}
                        </div>

                        <Link href={`/leads/${lead.id}`} className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 truncate">
                            {lead.name}
                          </p>
                          <p className="text-sm text-slate-500">
                            {followUp.type === 'call'
                              ? 'Llamada'
                              : followUp.type === 'message'
                              ? 'Mensaje'
                              : 'Reunión'}
                            {followUp.notes && ` - ${followUp.notes}`}
                          </p>
                        </Link>

                        <button
                          onClick={() => handleCompleteFollowUp(lead.id, followUp.id)}
                          className="p-2 rounded-lg hover:bg-success-50 text-slate-400 hover:text-success-600 transition-colors"
                          title="Marcar como completado"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* All Upcoming Follow-ups */}
            {allFollowUps.length > 0 && (
              <div className="mt-6 mb-4">
                <h3 className="text-base lg:text-lg font-semibold text-slate-800 mb-3">
                  Todos los Seguimientos Pendientes
                </h3>
                <Card padding="none">
                  <div className="divide-y divide-slate-100">
                    {allFollowUps.slice(0, 10).map(({ lead, followUp }) => (
                      <Link
                        key={followUp.id}
                        href={`/leads/${lead.id}`}
                        className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                          {getFollowUpIcon(followUp.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 truncate">
                            {lead.name}
                          </p>
                          <p className="text-sm text-slate-500">
                            {followUp.type === 'call'
                              ? 'Llamada'
                              : followUp.type === 'message'
                              ? 'Mensaje'
                              : 'Reunión'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-800">
                            {formatRelativeDate(new Date(followUp.scheduledAt))}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </PageContainer>
    </AppShell>
  )
}
