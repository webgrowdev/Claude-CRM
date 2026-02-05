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
  isBefore,
  addMinutes,
  addDays,
} from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  MapPin,
  AlertTriangle,
  RotateCcw,
  Phone,
  UserCheck,
  UserX,
  Syringe,
  ChevronDown,
} from 'lucide-react'
import { AppShell } from '@/components/layout'
import { Card, Avatar, Button, Badge, Modal, TimeSlotPicker } from '@/components/ui'
import { QuickBookingBar, AppointmentStatusBadge, PatientSearchModal } from '@/components/appointments'
import { useApp } from '@/contexts/AppContext'
import { useLanguage } from '@/i18n'
import { cn } from '@/lib/utils'
import { FollowUp, Lead, AttendanceStatus, AppointmentStatus } from '@/types'

interface AppointmentWithLead {
  lead: Lead
  followUp: FollowUp
}

export default function AppointmentsPage() {
  const router = useRouter()
  const { state, dispatch } = useApp()
  const { t, language } = useLanguage()
  const locale = language === 'es' ? es : enUS

  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState('')
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [showPatientSearchModal, setShowPatientSearchModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithLead | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'attended' | 'noshow'>('all')
  const [rescheduleDate, setRescheduleDate] = useState<Date | null>(null)
  const [rescheduleTime, setRescheduleTime] = useState<string | null>(null)
  const [showCalendar, setShowCalendar] = useState(true)

  // Get all in-person appointments (type === 'appointment')
  const allAppointments = useMemo(() => {
    const appointments: AppointmentWithLead[] = []
    state.leads.forEach((lead) => {
      lead.followUps
        .filter((fu) => fu.type === 'appointment')
        .forEach((followUp) => {
          appointments.push({ lead, followUp })
        })
    })
    return appointments.sort(
      (a, b) => new Date(a.followUp.scheduledAt).getTime() - new Date(b.followUp.scheduledAt).getTime()
    )
  }, [state.leads])

  // Get all appointments and meetings for conflict checking in reschedule
  const allScheduledEvents = useMemo(() => {
    const events: FollowUp[] = []
    state.leads.forEach((lead) => {
      lead.followUps
        .filter((fu) => (fu.type === 'appointment' || fu.type === 'meeting') && !fu.completed)
        .forEach((fu) => events.push(fu))
    })
    return events
  }, [state.leads])

  // Filter appointments by search (name or DNI)
  const filteredAppointments = useMemo(() => {
    let filtered = allAppointments

    // Filter by search query (name or DNI)
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        ({ lead }) =>
          lead.name.toLowerCase().includes(query) ||
          lead.identificationNumber?.toLowerCase().includes(query) ||
          lead.phone.includes(query)
      )
    }

    // Filter by appointment status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(({ followUp }) => {
        const status = followUp.appointmentStatus || 'pending'
        // Map old filter values to new status
        if (filterStatus === 'attended') return status === 'completed'
        if (filterStatus === 'noshow') return status === 'no-show'
        return status === filterStatus
      })
    }

    return filtered
  }, [allAppointments, searchQuery, filterStatus])

  // Get appointments for selected date
  const selectedDateAppointments = useMemo(() => {
    return filteredAppointments
      .filter(({ followUp }) => isSameDay(new Date(followUp.scheduledAt), selectedDate))
      .sort(
        (a, b) =>
          new Date(a.followUp.scheduledAt).getTime() - new Date(b.followUp.scheduledAt).getTime()
      )
  }, [filteredAppointments, selectedDate])

  // Today's stats
  const todayAppointments = useMemo(() => {
    return allAppointments.filter(({ followUp }) => isSameDay(new Date(followUp.scheduledAt), new Date()))
  }, [allAppointments])

  const todayStats = useMemo(() => {
    const total = todayAppointments.length
    const completed = todayAppointments.filter(a => a.followUp.appointmentStatus === 'completed').length
    const noshow = todayAppointments.filter(a => a.followUp.appointmentStatus === 'no-show').length
    const pending = todayAppointments.filter(a => !a.followUp.appointmentStatus || a.followUp.appointmentStatus === 'pending' || a.followUp.appointmentStatus === 'confirmed').length
    return { total, attended: completed, noshow, pending }
  }, [todayAppointments])

  // Days with appointments
  const daysWithAppointments = useMemo(() => {
    const days = new Map<string, { total: number; pending: number; attended: number; noshow: number }>()
    allAppointments.forEach(({ followUp }) => {
      const key = format(new Date(followUp.scheduledAt), 'yyyy-MM-dd')
      const current = days.get(key) || { total: 0, pending: 0, attended: 0, noshow: 0 }
      current.total++
      const status = followUp.appointmentStatus || 'pending'
      if (status === 'completed') current.attended++
      else if (status === 'no-show') current.noshow++
      else current.pending++
      days.set(key, current)
    })
    return days
  }, [allAppointments])

  // Calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calendarStart = startOfWeek(monthStart, { locale })
    const calendarEnd = endOfWeek(monthEnd, { locale })
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }, [currentMonth, locale])

  // Quick check-in
  const handleQuickCheckIn = (item: AppointmentWithLead, status: AppointmentStatus) => {
    const { lead, followUp } = item
    const updatedFollowUp: FollowUp = {
      ...followUp,
      appointmentStatus: status,
      attendanceMarkedAt: new Date(),
      completed: status === 'completed',
      completedAt: status === 'completed' ? new Date() : undefined,
    }

    const updatedLead: Lead = {
      ...lead,
      followUps: lead.followUps.map((fu) =>
        fu.id === followUp.id ? updatedFollowUp : fu
      ),
    }

    dispatch({ type: 'UPDATE_LEAD', payload: updatedLead })
  }

  const handleMarkAttendance = (status: AppointmentStatus) => {
    if (!selectedAppointment) return

    handleQuickCheckIn(selectedAppointment, status)
    setShowAttendanceModal(false)
    setSelectedAppointment(null)
  }

  const handleReschedule = () => {
    if (!selectedAppointment || !rescheduleDate || !rescheduleTime) return

    const { lead, followUp } = selectedAppointment
    const [hours, minutes] = rescheduleTime.split(':').map(Number)
    const newDate = new Date(rescheduleDate)
    newDate.setHours(hours, minutes, 0, 0)

    const updatedFollowUp: FollowUp = {
      ...followUp,
      scheduledAt: newDate,
      appointmentStatus: 'pending',
      attendanceMarkedAt: undefined,
      completed: false,
      completedAt: undefined,
    }

    const updatedLead: Lead = {
      ...lead,
      followUps: lead.followUps.map((fu) =>
        fu.id === followUp.id ? updatedFollowUp : fu
      ),
    }

    dispatch({ type: 'UPDATE_LEAD', payload: updatedLead })
    setShowRescheduleModal(false)
    setSelectedAppointment(null)
    setRescheduleDate(null)
    setRescheduleTime(null)
  }

  const openAttendanceModal = (item: AppointmentWithLead) => {
    setSelectedAppointment(item)
    setShowAttendanceModal(true)
  }

  const getStatusColor = (status?: AppointmentStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500'
      case 'no-show':
        return 'bg-red-500'
      case 'cancelled':
        return 'bg-slate-400'
      case 'confirmed':
        return 'bg-blue-600'
      default:
        return 'bg-blue-500'
    }
  }

  const getStatusBadge = (status?: AppointmentStatus) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success" size="sm">{t.appointments.attended}</Badge>
      case 'no-show':
        return <Badge variant="error" size="sm">{t.appointments.noshow}</Badge>
      case 'cancelled':
        return <Badge variant="outline" size="sm">{t.appointments.cancelled}</Badge>
      case 'confirmed':
        return <Badge variant="primary" size="sm">{language === 'es' ? 'Confirmada' : 'Confirmed'}</Badge>
      default:
        return <Badge variant="default" size="sm">{t.appointments.pending}</Badge>
    }
  }

  const weekDays = language === 'es'
    ? ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  // Next 7 days for quick selection
  const next7Days = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i))

  return (
    <AppShell>
      <div className="flex flex-col h-[calc(100vh-4rem)] lg:h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-slate-200 shadow-sm">
          <div className="px-4 py-4 lg:px-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-primary-500" />
                  <h1 className="text-xl lg:text-2xl font-bold text-slate-900">{t.appointments.title}</h1>
                </div>
                <p className="text-sm text-slate-500 mt-0.5">
                  {language === 'es'
                    ? `${todayStats.total} citas hoy • ${todayStats.pending} pendientes`
                    : `${todayStats.total} appointments today • ${todayStats.pending} pending`}
                </p>
              </div>
              <button
                onClick={() => setShowPatientSearchModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary-500/25"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">{language === 'es' ? 'Nueva Cita' : 'New Appointment'}</span>
              </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-3 mt-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">{todayStats.total}</p>
                <p className="text-xs text-blue-600/70 font-medium">{t.appointments.total}</p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-amber-600">{todayStats.pending}</p>
                <p className="text-xs text-amber-600/70 font-medium">{t.appointments.pending}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{todayStats.attended}</p>
                <p className="text-xs text-green-600/70 font-medium">{t.appointments.attended}</p>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-red-600">{todayStats.noshow}</p>
                <p className="text-xs text-red-600/70 font-medium">{t.appointments.noshow}</p>
              </div>
            </div>

            {/* Quick Day Selection */}
            <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-hide">
              {next7Days.map((day) => {
                const isSelected = isSameDay(day, selectedDate)
                const dayData = daysWithAppointments.get(format(day, 'yyyy-MM-dd'))

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      'flex flex-col items-center min-w-[60px] py-2 px-3 rounded-xl transition-all',
                      isSelected
                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                        : isToday(day)
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                    )}
                  >
                    <span className={cn('text-xs font-medium', isSelected ? 'text-white/80' : 'text-slate-400')}>
                      {isToday(day) ? (language === 'es' ? 'Hoy' : 'Today') : format(day, 'EEE', { locale })}
                    </span>
                    <span className="text-lg font-bold">{format(day, 'd')}</span>
                    {dayData && dayData.total > 0 && (
                      <span className={cn(
                        'text-[10px] font-medium',
                        isSelected ? 'text-white/80' : 'text-slate-400'
                      )}>
                        {dayData.total} {language === 'es' ? 'citas' : 'apt'}
                      </span>
                    )}
                  </button>
                )
              })}
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className="flex flex-col items-center justify-center min-w-[60px] py-2 px-3 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all"
              >
                <CalendarIcon className="w-5 h-5" />
                <ChevronDown className={cn('w-4 h-4 transition-transform', showCalendar && 'rotate-180')} />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Booking Bar */}
        <div className="flex-shrink-0 px-4 lg:px-6 py-4 bg-slate-50">
          <QuickBookingBar
            onBookingComplete={(leadId, followUp) => {
              // Refresh the view by selecting the appointment date
              setSelectedDate(new Date(followUp.scheduledAt))
            }}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left: Calendar (collapsible on mobile) */}
          {showCalendar && (
            <div className="flex-shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 lg:w-80 overflow-y-auto">
              <div className="p-4">
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-slate-600" />
                  </button>
                  <h3 className="font-semibold text-slate-800 capitalize">
                    {format(currentMonth, 'MMMM yyyy', { locale })}
                  </h3>
                  <button
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-slate-600" />
                  </button>
                </div>

                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekDays.map((day) => (
                    <div key={day} className="text-center text-xs font-medium text-slate-400 py-1">
                      {day.charAt(0)}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day) => {
                    const dateKey = format(day, 'yyyy-MM-dd')
                    const dayData = daysWithAppointments.get(dateKey)
                    const isSelected = isSameDay(day, selectedDate)
                    const isCurrentMonth = isSameMonth(day, currentMonth)

                    return (
                      <button
                        key={dateKey}
                        onClick={() => setSelectedDate(day)}
                        className={cn(
                          'aspect-square p-1 rounded-lg text-sm transition-all relative',
                          isSelected && 'bg-primary-500 text-white shadow-md',
                          !isSelected && isToday(day) && 'bg-primary-100 text-primary-700 font-bold',
                          !isSelected && !isToday(day) && isCurrentMonth && 'hover:bg-slate-100',
                          !isCurrentMonth && 'text-slate-300'
                        )}
                      >
                        <span className="block">{format(day, 'd')}</span>
                        {dayData && dayData.total > 0 && (
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                            {dayData.pending > 0 && (
                              <span className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                isSelected ? "bg-white/70" : "bg-blue-500"
                              )} />
                            )}
                            {dayData.attended > 0 && (
                              <span className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                isSelected ? "bg-white/70" : "bg-green-500"
                              )} />
                            )}
                            {dayData.noshow > 0 && (
                              <span className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                isSelected ? "bg-white/70" : "bg-red-500"
                              )} />
                            )}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    {t.appointments.pending}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    {t.appointments.attended}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    {t.appointments.noshow}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Right: Appointment List */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search and filters */}
            <div className="flex-shrink-0 p-4 bg-white border-b border-slate-200">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder={t.appointments.searchByNameOrId}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white transition-all"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                  className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium"
                >
                  <option value="all">{t.common.all}</option>
                  <option value="pending">{t.appointments.pending}</option>
                  <option value="attended">{t.appointments.attended}</option>
                  <option value="noshow">{t.appointments.noshow}</option>
                </select>
              </div>

              {/* Selected date header */}
              <div className="flex items-center justify-between mt-3">
                <h3 className="font-semibold text-slate-800 capitalize">
                  {format(selectedDate, "EEEE, d 'de' MMMM", { locale })}
                </h3>
                <span className="text-sm text-slate-500">
                  {selectedDateAppointments.length} {language === 'es' ? 'citas' : 'appointments'}
                </span>
              </div>
            </div>

            {/* Appointment List */}
            <div className="flex-1 overflow-y-auto p-4">
              {selectedDateAppointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                    <CalendarIcon className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">{t.appointments.noAppointments}</h3>
                  <p className="text-sm text-slate-500 mt-1 max-w-xs">{t.appointments.noAppointmentsDesc}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateAppointments.map(({ lead, followUp }) => {
                    const isPast = isBefore(new Date(followUp.scheduledAt), new Date())
                    const needsAttention = isPast && !followUp.appointmentStatus
                    const status = followUp.appointmentStatus || 'pending'

                    return (
                      <div
                        key={followUp.id}
                        className={cn(
                          'bg-white rounded-2xl border transition-all overflow-hidden',
                          needsAttention
                            ? 'border-amber-300 shadow-lg shadow-amber-100'
                            : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                        )}
                      >
                        {/* Time indicator */}
                        <div className={cn(
                          'h-1',
                          getStatusColor(followUp.appointmentStatus)
                        )} />

                        <div className="p-4">
                          <div className="flex items-start gap-3">
                            {/* Time Column */}
                            <div className="flex flex-col items-center">
                              <div className={cn(
                                'w-14 h-14 rounded-xl flex flex-col items-center justify-center',
                                status === 'completed' ? 'bg-green-100' :
                                status === 'no-show' ? 'bg-red-100' :
                                'bg-slate-100'
                              )}>
                                <Clock className={cn(
                                  'w-4 h-4',
                                  status === 'completed' ? 'text-green-600' :
                                  status === 'no-show' ? 'text-red-600' :
                                  'text-slate-500'
                                )} />
                                <span className={cn(
                                  'text-sm font-bold',
                                  status === 'completed' ? 'text-green-700' :
                                  status === 'no-show' ? 'text-red-700' :
                                  'text-slate-700'
                                )}>
                                  {format(new Date(followUp.scheduledAt), 'HH:mm')}
                                </span>
                              </div>
                              {followUp.duration && (
                                <span className="text-xs text-slate-400 mt-1">{followUp.duration}min</span>
                              )}
                            </div>

                            {/* Patient Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Avatar name={lead.name} size="sm" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-slate-900 truncate">{lead.name}</p>
                                  {lead.identificationNumber && (
                                    <p className="text-xs text-slate-400 flex items-center gap-1">
                                      <CreditCard className="w-3 h-3" />
                                      {lead.identificationNumber}
                                    </p>
                                  )}
                                </div>
                                <div className="flex flex-col gap-1">
                                  {getStatusBadge(followUp.appointmentStatus)}
                                </div>
                              </div>

                              {followUp.treatmentName && (
                                <div className="mt-2 flex items-center gap-1.5">
                                  <Syringe className="w-3.5 h-3.5 text-primary-500" />
                                  <span className="text-sm text-primary-700 font-medium">
                                    {followUp.treatmentName}
                                  </span>
                                </div>
                              )}

                              {needsAttention && (
                                <div className="flex items-center gap-1 mt-2 px-2 py-1 bg-amber-50 rounded-lg text-xs text-amber-600 font-medium">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  {t.appointments.needsAttendanceConfirmation}
                                </div>
                              )}

                              {/* Quick Actions */}
                              {status === 'pending' && (
                                <div className="flex gap-2 mt-3">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleQuickCheckIn({ lead, followUp }, 'completed')
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-medium transition-colors"
                                  >
                                    <UserCheck className="w-3.5 h-3.5" />
                                    {language === 'es' ? 'Asistió' : 'Attended'}
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleQuickCheckIn({ lead, followUp }, 'no-show')
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition-colors"
                                  >
                                    <UserX className="w-3.5 h-3.5" />
                                    {language === 'es' ? 'No vino' : 'No Show'}
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      openAttendanceModal({ lead, followUp })
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium transition-colors"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    {language === 'es' ? 'Más' : 'More'}
                                  </button>
                                </div>
                              )}

                              {status !== 'pending' && (
                                <div className="flex gap-2 mt-3">
                                  <a
                                    href={`tel:${lead.phone}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs font-medium transition-colors"
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                    {language === 'es' ? 'Llamar' : 'Call'}
                                  </a>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      router.push(`/pacientes?id=${lead.id}`)
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium transition-colors"
                                  >
                                    {language === 'es' ? 'Ver perfil' : 'View profile'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Modal */}
      <Modal
        isOpen={showAttendanceModal}
        onClose={() => setShowAttendanceModal(false)}
        title={t.appointments.markAttendance}
      >
        {selectedAppointment && (
          <div className="space-y-4">
            {/* Patient Info */}
            <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
              <Avatar name={selectedAppointment.lead.name} size="lg" />
              <div>
                <p className="font-semibold text-slate-800">{selectedAppointment.lead.name}</p>
                {selectedAppointment.lead.identificationNumber && (
                  <p className="text-sm text-slate-500">
                    {t.appointments.idNumber}: {selectedAppointment.lead.identificationNumber}
                  </p>
                )}
                <p className="text-sm text-slate-500">
                  {format(new Date(selectedAppointment.followUp.scheduledAt), "d MMM yyyy 'a las' HH:mm", { locale })}
                </p>
              </div>
            </div>

            {/* Treatment */}
            {selectedAppointment.followUp.treatmentName && (
              <div className="p-3 bg-primary-50 rounded-xl flex items-center gap-2">
                <Syringe className="w-4 h-4 text-primary-600" />
                <p className="text-sm font-medium text-primary-800">
                  {selectedAppointment.followUp.treatmentName}
                </p>
              </div>
            )}

            {/* Current Status */}
            <div className="flex items-center justify-between p-3 border border-slate-200 rounded-xl">
              <span className="text-sm text-slate-600">{t.appointments.currentStatus}:</span>
              {getStatusBadge(selectedAppointment.followUp.appointmentStatus)}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                fullWidth
                variant="outline"
                onClick={() => handleMarkAttendance('completed')}
                className="justify-start bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                icon={<CheckCircle2 className="w-5 h-5" />}
              >
                {t.appointments.markAsAttended}
              </Button>

              <Button
                fullWidth
                variant="outline"
                onClick={() => handleMarkAttendance('no-show')}
                className="justify-start bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                icon={<XCircle className="w-5 h-5" />}
              >
                {t.appointments.markAsNoShow}
              </Button>

              <Button
                fullWidth
                variant="outline"
                onClick={() => handleMarkAttendance('confirmed')}
                className="justify-start"
                icon={<UserCheck className="w-5 h-5" />}
              >
                {language === 'es' ? 'Marcar como Confirmada' : 'Mark as Confirmed'}
              </Button>

              <Button
                fullWidth
                variant="outline"
                onClick={() => {
                  setShowAttendanceModal(false)
                  setRescheduleDate(null)
                  setRescheduleTime(null)
                  setShowRescheduleModal(true)
                }}
                className="justify-start"
                icon={<RotateCcw className="w-5 h-5" />}
              >
                {t.appointments.markAsRescheduled}
              </Button>
            </div>

            {/* View Patient Button */}
            <Button
              fullWidth
              variant="ghost"
              onClick={() => {
                setShowAttendanceModal(false)
                router.push(`/pacientes?id=${selectedAppointment.lead.id}`)
              }}
            >
              {t.appointments.viewPatientProfile}
            </Button>
          </div>
        )}
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        isOpen={showRescheduleModal}
        onClose={() => {
          setShowRescheduleModal(false)
          setSelectedAppointment(null)
        }}
        title={t.appointments.markAsRescheduled}
        size="lg"
      >
        {selectedAppointment && (
          <div className="space-y-4">
            {/* Patient Info */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Avatar name={selectedAppointment.lead.name} size="md" />
              <div>
                <p className="font-medium text-slate-800">{selectedAppointment.lead.name}</p>
                <p className="text-sm text-slate-500">
                  {language === 'es' ? 'Cita anterior:' : 'Previous appointment:'}{' '}
                  {format(new Date(selectedAppointment.followUp.scheduledAt), "d MMM yyyy 'a las' HH:mm", { locale })}
                </p>
              </div>
            </div>

            {/* Treatment */}
            {selectedAppointment.followUp.treatmentName && (
              <div className="p-3 bg-primary-50 rounded-lg">
                <p className="text-sm font-medium text-primary-800">
                  {t.followUp.selectTreatment}: {selectedAppointment.followUp.treatmentName}
                </p>
              </div>
            )}

            {/* Time Slot Picker */}
            <div className="border border-slate-200 rounded-lg p-4 bg-white">
              <label className="block text-sm font-medium text-slate-700 mb-3">
                {language === 'es' ? 'Seleccionar nueva fecha y hora' : 'Select new date and time'}
              </label>
              <TimeSlotPicker
                selectedDate={rescheduleDate}
                selectedTime={rescheduleTime}
                onSelectDateTime={(date, time) => {
                  setRescheduleDate(date)
                  setRescheduleTime(time)
                }}
                existingAppointments={allScheduledEvents.filter(
                  fu => fu.id !== selectedAppointment.followUp.id
                )}
                duration={selectedAppointment.followUp.duration || 30}
              />

              {rescheduleDate && rescheduleTime && (
                <div className="mt-3 p-2 bg-primary-50 border border-primary-200 rounded-lg text-center">
                  <p className="text-sm font-medium text-primary-700">
                    {language === 'es' ? 'Nueva cita:' : 'New appointment:'}{' '}
                    {rescheduleDate.toLocaleDateString()} - {rescheduleTime}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                fullWidth
                onClick={() => {
                  setShowRescheduleModal(false)
                  setSelectedAppointment(null)
                }}
              >
                {t.common.cancel}
              </Button>
              <Button
                fullWidth
                onClick={handleReschedule}
                disabled={!rescheduleDate || !rescheduleTime}
              >
                {language === 'es' ? 'Reprogramar Cita' : 'Reschedule Appointment'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Patient Search Modal */}
      <PatientSearchModal
        isOpen={showPatientSearchModal}
        onClose={() => setShowPatientSearchModal(false)}
        language={language}
      />
    </AppShell>
  )
}
