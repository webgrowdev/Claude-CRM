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
  isAfter,
  addMinutes,
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
  User,
  Phone,
  CreditCard,
  MapPin,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react'
import { AppShell, Header, PageContainer } from '@/components/layout'
import { Card, Avatar, Button, Badge, Modal, Input, Select, EmptyState } from '@/components/ui'
import { useApp } from '@/contexts/AppContext'
import { useLanguage } from '@/i18n'
import { cn } from '@/lib/utils'
import { FollowUp, Lead, AttendanceStatus } from '@/types'

interface AppointmentWithLead {
  lead: Lead
  followUp: FollowUp
}

export default function AppointmentsPage() {
  const router = useRouter()
  const { state, completeFollowUp, dispatch } = useApp()
  const { t, language } = useLanguage()
  const locale = language === 'es' ? es : enUS

  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState('')
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithLead | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'attended' | 'noshow'>('all')

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

    // Filter by attendance status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(({ followUp }) => {
        const status = followUp.attendanceStatus || 'pending'
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

  // Days with appointments
  const daysWithAppointments = useMemo(() => {
    const days = new Map<string, { total: number; pending: number; attended: number; noshow: number }>()
    allAppointments.forEach(({ followUp }) => {
      const key = format(new Date(followUp.scheduledAt), 'yyyy-MM-dd')
      const current = days.get(key) || { total: 0, pending: 0, attended: 0, noshow: 0 }
      current.total++
      const status = followUp.attendanceStatus || 'pending'
      if (status === 'attended') current.attended++
      else if (status === 'noshow') current.noshow++
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

  const handleMarkAttendance = (status: AttendanceStatus) => {
    if (!selectedAppointment) return

    const { lead, followUp } = selectedAppointment
    const updatedFollowUp: FollowUp = {
      ...followUp,
      attendanceStatus: status,
      attendanceMarkedAt: new Date(),
      completed: status === 'attended',
      completedAt: status === 'attended' ? new Date() : undefined,
    }

    // Update the lead with the modified follow-up
    const updatedLead: Lead = {
      ...lead,
      followUps: lead.followUps.map((fu) =>
        fu.id === followUp.id ? updatedFollowUp : fu
      ),
    }

    dispatch({ type: 'UPDATE_LEAD', payload: updatedLead })
    setShowAttendanceModal(false)
    setSelectedAppointment(null)
  }

  const openAttendanceModal = (item: AppointmentWithLead) => {
    setSelectedAppointment(item)
    setShowAttendanceModal(true)
  }

  const getStatusBadge = (status?: AttendanceStatus) => {
    switch (status) {
      case 'attended':
        return <Badge variant="success" size="sm">{t.appointments.attended}</Badge>
      case 'noshow':
        return <Badge variant="error" size="sm">{t.appointments.noshow}</Badge>
      case 'cancelled':
        return <Badge variant="outline" size="sm">{t.appointments.cancelled}</Badge>
      case 'rescheduled':
        return <Badge variant="warning" size="sm">{t.appointments.rescheduled}</Badge>
      default:
        return <Badge variant="default" size="sm">{t.appointments.pending}</Badge>
    }
  }

  const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
  const weekDaysEn = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  return (
    <AppShell>
      <Header
        title={t.appointments.title}
        rightContent={
          <button
            onClick={() => router.push('/pacientes?action=new')}
            className="p-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        }
      />

      <PageContainer>
        <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-6">
          {/* Left: Calendar */}
          <div>
            {/* Search and filters */}
            <div className="flex gap-3 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={t.appointments.searchByNameOrId}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
              >
                <option value="all">{t.common.all}</option>
                <option value="pending">{t.appointments.pending}</option>
                <option value="attended">{t.appointments.attended}</option>
                <option value="noshow">{t.appointments.noshow}</option>
              </select>
            </div>

            {/* Mini Calendar */}
            <Card className="mb-4">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-2 rounded-lg hover:bg-slate-100"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-600" />
                </button>
                <h3 className="font-semibold text-slate-800 capitalize">
                  {format(currentMonth, 'MMMM yyyy', { locale })}
                </h3>
                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="p-2 rounded-lg hover:bg-slate-100"
                >
                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {(language === 'es' ? weekDays : weekDaysEn).map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-slate-400 py-1">
                    {day}
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
                        isSelected && 'bg-primary-500 text-white',
                        !isSelected && isToday(day) && 'bg-primary-100 text-primary-700',
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
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  {t.appointments.pending}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  {t.appointments.attended}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  {t.appointments.noshow}
                </div>
              </div>
            </Card>

            {/* Today's stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <Card padding="sm" className="text-center">
                <p className="text-2xl font-bold text-slate-800">
                  {selectedDateAppointments.length}
                </p>
                <p className="text-xs text-slate-500">{t.appointments.total}</p>
              </Card>
              <Card padding="sm" className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {selectedDateAppointments.filter(a => a.followUp.attendanceStatus === 'attended').length}
                </p>
                <p className="text-xs text-slate-500">{t.appointments.attended}</p>
              </Card>
              <Card padding="sm" className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {selectedDateAppointments.filter(a => a.followUp.attendanceStatus === 'noshow').length}
                </p>
                <p className="text-xs text-slate-500">{t.appointments.noshow}</p>
              </Card>
            </div>
          </div>

          {/* Right: Appointment List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">
                {format(selectedDate, "EEEE d 'de' MMMM", { locale })}
              </h3>
              {isToday(selectedDate) && (
                <Badge variant="primary" size="sm">{t.time.today}</Badge>
              )}
            </div>

            {selectedDateAppointments.length === 0 ? (
              <EmptyState
                icon={<CalendarIcon className="w-8 h-8" />}
                title={t.appointments.noAppointments}
                description={t.appointments.noAppointmentsDesc}
              />
            ) : (
              <div className="space-y-3">
                {selectedDateAppointments.map(({ lead, followUp }) => {
                  const isPast = isBefore(new Date(followUp.scheduledAt), new Date())
                  const needsAttention = isPast && !followUp.attendanceStatus

                  return (
                    <Card
                      key={followUp.id}
                      padding="sm"
                      className={cn(
                        'cursor-pointer transition-all hover:shadow-md',
                        needsAttention && 'border-l-4 border-l-warning-500'
                      )}
                      onClick={() => openAttendanceModal({ lead, followUp })}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar name={lead.name} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-slate-800 truncate">{lead.name}</p>
                            {getStatusBadge(followUp.attendanceStatus)}
                          </div>

                          <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {format(new Date(followUp.scheduledAt), 'HH:mm')}
                            </span>
                            {followUp.duration && (
                              <span>{followUp.duration} min</span>
                            )}
                          </div>

                          {lead.identificationNumber && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                              <CreditCard className="w-3 h-3" />
                              {t.appointments.idNumber}: {lead.identificationNumber}
                            </div>
                          )}

                          {followUp.treatmentName && (
                            <div className="mt-2">
                              <Badge variant="outline" size="sm">
                                {followUp.treatmentName}
                              </Badge>
                            </div>
                          )}

                          {needsAttention && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-warning-600">
                              <AlertTriangle className="w-3 h-3" />
                              {t.appointments.needsAttendanceConfirmation}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </PageContainer>

      {/* Attendance Modal */}
      <Modal
        isOpen={showAttendanceModal}
        onClose={() => setShowAttendanceModal(false)}
        title={t.appointments.markAttendance}
      >
        {selectedAppointment && (
          <div className="space-y-4">
            {/* Patient Info */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Avatar name={selectedAppointment.lead.name} size="lg" />
              <div>
                <p className="font-medium text-slate-800">{selectedAppointment.lead.name}</p>
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
              <div className="p-3 bg-primary-50 rounded-lg">
                <p className="text-sm font-medium text-primary-800">
                  {t.followUp.selectTreatment}: {selectedAppointment.followUp.treatmentName}
                </p>
              </div>
            )}

            {/* Current Status */}
            <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
              <span className="text-sm text-slate-600">{t.appointments.currentStatus}:</span>
              {getStatusBadge(selectedAppointment.followUp.attendanceStatus)}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                fullWidth
                variant="outline"
                onClick={() => handleMarkAttendance('attended')}
                className="justify-start bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                icon={<CheckCircle2 className="w-5 h-5" />}
              >
                {t.appointments.markAsAttended}
              </Button>

              <Button
                fullWidth
                variant="outline"
                onClick={() => handleMarkAttendance('noshow')}
                className="justify-start bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                icon={<XCircle className="w-5 h-5" />}
              >
                {t.appointments.markAsNoShow}
              </Button>

              <Button
                fullWidth
                variant="outline"
                onClick={() => handleMarkAttendance('rescheduled')}
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
    </AppShell>
  )
}
