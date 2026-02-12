'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  format,
  addDays,
  startOfWeek,
  isSameDay,
  isToday,
  isBefore,
  setHours,
  setMinutes,
  addMinutes,
  startOfDay,
  endOfDay,
} from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Clock, Check, Calendar, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/i18n'
import { FollowUp, Appointment } from '@/types'
import { getCalendarBusyTimes, getGoogleCalendarSettings, BusyTime } from '@/services/googleCalendar'

interface TimeSlot {
  time: string // "09:00"
  hour: number
  minute: number
  available: boolean
  conflictingAppointment?: string
  isGoogleBusy?: boolean
}

interface TimeSlotPickerProps {
  selectedDate: Date | null
  selectedTime: string | null
  onSelectDateTime: (date: Date, time: string) => void
  existingAppointments: (FollowUp | Appointment)[]
  duration?: number // appointment duration in minutes
  workingHours?: {
    start: string // "09:00"
    end: string // "18:00"
  }
  slotInterval?: number // minutes between slots
}

export function TimeSlotPicker({
  selectedDate,
  selectedTime,
  onSelectDateTime,
  existingAppointments,
  duration = 30,
  workingHours = { start: '09:00', end: '18:00' },
  slotInterval = 30,
}: TimeSlotPickerProps) {
  const { t, language } = useLanguage()
  const locale = language === 'es' ? es : enUS

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { locale }))
  const [internalSelectedDate, setInternalSelectedDate] = useState<Date | null>(selectedDate)
  const [googleBusyTimes, setGoogleBusyTimes] = useState<BusyTime[]>([])
  const [isLoadingBusy, setIsLoadingBusy] = useState(false)
  const [isCalendarConnected, setIsCalendarConnected] = useState(false)

  // Check if Google Calendar is connected
  useEffect(() => {
    const settings = getGoogleCalendarSettings()
    setIsCalendarConnected(settings.connected)
  }, [])

  // Fetch Google Calendar busy times when week changes
  useEffect(() => {
    async function fetchBusyTimes() {
      const settings = getGoogleCalendarSettings()
      if (!settings.connected) {
        setGoogleBusyTimes([])
        return
      }

      setIsLoadingBusy(true)
      try {
        const startDate = startOfDay(weekStart)
        const endDate = endOfDay(addDays(weekStart, 6))
        const busyTimes = await getCalendarBusyTimes(startDate, endDate)
        setGoogleBusyTimes(busyTimes)
      } catch (error) {
        console.error('Error fetching busy times:', error)
        setGoogleBusyTimes([])
      } finally {
        setIsLoadingBusy(false)
      }
    }

    fetchBusyTimes()
  }, [weekStart])

  // Generate week days
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  }, [weekStart])

  // Check if a time slot conflicts with Google Calendar
  const isGoogleBusy = (slotStart: Date, slotEnd: Date): boolean => {
    return googleBusyTimes.some(busy =>
      slotStart < busy.end && slotEnd > busy.start
    )
  }

  // Generate time slots for the selected date
  const timeSlots = useMemo(() => {
    if (!internalSelectedDate) return []

    const [startHour, startMin] = workingHours.start.split(':').map(Number)
    const [endHour, endMin] = workingHours.end.split(':').map(Number)

    const slots: TimeSlot[] = []
    let currentTime = setMinutes(setHours(internalSelectedDate, startHour), startMin)
    const endTime = setMinutes(setHours(internalSelectedDate, endHour), endMin)

    while (isBefore(currentTime, endTime)) {
      const timeString = format(currentTime, 'HH:mm')
      const slotStart = currentTime
      const slotEnd = addMinutes(currentTime, duration)

      // Check for conflicts with existing appointments (local)
      const conflict = existingAppointments.find(apt => {
        // Check if appointment is completed - handle both FollowUp and Appointment types
        const isCompleted = 'completed' in apt ? apt.completed : apt.status === 'completed'
        if (isCompleted) return false
        const aptDate = new Date(apt.scheduledAt)
        if (!isSameDay(aptDate, internalSelectedDate)) return false

        const aptStart = aptDate
        const aptEnd = addMinutes(aptDate, apt.duration || 30)

        // Check if slots overlap
        return (slotStart < aptEnd && slotEnd > aptStart)
      })

      // Check for conflicts with Google Calendar
      const googleConflict = isGoogleBusy(slotStart, slotEnd)

      const isPast = isBefore(currentTime, new Date())
      const isAvailable = !conflict && !googleConflict && !isPast

      slots.push({
        time: timeString,
        hour: currentTime.getHours(),
        minute: currentTime.getMinutes(),
        available: isAvailable,
        conflictingAppointment: conflict?.notes || (conflict ? (language === 'es' ? 'Ocupado (CRM)' : 'Busy (CRM)') : undefined),
        isGoogleBusy: googleConflict && !conflict,
      })

      currentTime = addMinutes(currentTime, slotInterval)
    }

    return slots
  }, [internalSelectedDate, existingAppointments, workingHours, duration, slotInterval, googleBusyTimes, language])

  const handleSelectDate = (date: Date) => {
    setInternalSelectedDate(date)
  }

  const handleSelectTime = (time: string) => {
    if (internalSelectedDate) {
      onSelectDateTime(internalSelectedDate, time)
    }
  }

  const goToPreviousWeek = () => {
    setWeekStart(addDays(weekStart, -7))
  }

  const goToNextWeek = () => {
    setWeekStart(addDays(weekStart, 7))
  }

  const goToToday = () => {
    setWeekStart(startOfWeek(new Date(), { locale }))
    setInternalSelectedDate(new Date())
  }

  // Count available slots per day
  const getDayAvailability = (date: Date) => {
    const [startHour, startMin] = workingHours.start.split(':').map(Number)
    const [endHour, endMin] = workingHours.end.split(':').map(Number)

    let available = 0
    let total = 0
    let currentTime = setMinutes(setHours(date, startHour), startMin)
    const endTime = setMinutes(setHours(date, endHour), endMin)

    while (isBefore(currentTime, endTime)) {
      const slotStart = currentTime
      const slotEnd = addMinutes(currentTime, duration)

      const conflict = existingAppointments.find(apt => {
        // Check if appointment is completed - handle both FollowUp and Appointment types
        const isCompleted = 'completed' in apt ? apt.completed : apt.status === 'completed'
        if (isCompleted) return false
        const aptDate = new Date(apt.scheduledAt)
        if (!isSameDay(aptDate, date)) return false
        const aptStart = aptDate
        const aptEnd = addMinutes(aptDate, apt.duration || 30)
        return (slotStart < aptEnd && slotEnd > aptStart)
      })

      const googleConflict = isGoogleBusy(slotStart, slotEnd)

      if (!conflict && !googleConflict && !isBefore(currentTime, new Date())) {
        available++
      }
      total++
      currentTime = addMinutes(currentTime, slotInterval)
    }

    return { available, total }
  }

  const translations = {
    es: {
      available: 'Disponible',
      busyCRM: 'Ocupado (CRM)',
      busyGoogle: 'Ocupado (Google)',
      full: 'Lleno',
      availableSlots: 'disp.',
      noAvailable: 'No hay horarios disponibles para este día',
      syncingGoogle: 'Sincronizando con Google Calendar...',
      googleConnected: 'Sincronizado con Google Calendar',
    },
    en: {
      available: 'Available',
      busyCRM: 'Busy (CRM)',
      busyGoogle: 'Busy (Google)',
      full: 'Full',
      availableSlots: 'avail.',
      noAvailable: 'No available slots for this day',
      syncingGoogle: 'Syncing with Google Calendar...',
      googleConnected: 'Synced with Google Calendar',
    },
  }

  const text = translations[language] || translations.es

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goToPreviousWeek}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700">
            {format(weekStart, "d MMM", { locale })} - {format(addDays(weekStart, 6), "d MMM yyyy", { locale })}
          </span>
          <button
            type="button"
            onClick={goToToday}
            className="px-2 py-1 text-xs font-medium text-primary-600 bg-primary-50 rounded hover:bg-primary-100 transition-colors"
          >
            {t.time.today}
          </button>
        </div>

        <button
          type="button"
          onClick={goToNextWeek}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      {/* Google Calendar Sync Status */}
      {isCalendarConnected && (
        <div className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg text-xs",
          isLoadingBusy ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"
        )}>
          {isLoadingBusy ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>{text.syncingGoogle}</span>
            </>
          ) : (
            <>
              <Calendar className="w-3.5 h-3.5" />
              <span>{text.googleConnected}</span>
            </>
          )}
        </div>
      )}

      {/* Week Days */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => {
          const isSelected = internalSelectedDate && isSameDay(day, internalSelectedDate)
          const isPast = isBefore(day, new Date()) && !isToday(day)
          const availability = getDayAvailability(day)

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => !isPast && handleSelectDate(day)}
              disabled={isPast}
              className={cn(
                'flex flex-col items-center p-2 rounded-lg transition-all',
                isSelected && 'bg-primary-500 text-white',
                !isSelected && isToday(day) && 'bg-primary-100',
                !isSelected && !isToday(day) && !isPast && 'hover:bg-slate-100',
                isPast && 'opacity-40 cursor-not-allowed'
              )}
            >
              <span className={cn(
                'text-xs font-medium',
                isSelected ? 'text-white/80' : 'text-slate-500'
              )}>
                {format(day, 'EEE', { locale })}
              </span>
              <span className={cn(
                'text-lg font-semibold',
                isSelected ? 'text-white' : 'text-slate-800'
              )}>
                {format(day, 'd')}
              </span>
              {!isPast && (
                <span className={cn(
                  'text-[10px] mt-0.5',
                  isSelected ? 'text-white/70' : 'text-slate-400',
                  availability.available === 0 && !isSelected && 'text-red-400'
                )}>
                  {availability.available > 0 ? `${availability.available} ${text.availableSlots}` : text.full}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Time Slots */}
      {internalSelectedDate && (
        <div className="border-t border-slate-200 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">
              {format(internalSelectedDate, "EEEE d 'de' MMMM", { locale })}
            </span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto">
            {timeSlots.map((slot) => {
              const isSelected = selectedTime === slot.time &&
                selectedDate && isSameDay(selectedDate, internalSelectedDate)

              return (
                <button
                  key={slot.time}
                  type="button"
                  onClick={() => slot.available && handleSelectTime(slot.time)}
                  disabled={!slot.available}
                  className={cn(
                    'py-2 px-3 rounded-lg text-sm font-medium transition-all relative',
                    isSelected && 'bg-primary-500 text-white ring-2 ring-primary-300',
                    !isSelected && slot.available && 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200',
                    !slot.available && slot.isGoogleBusy && 'bg-purple-50 text-purple-400 cursor-not-allowed border border-purple-200',
                    !slot.available && !slot.isGoogleBusy && 'bg-slate-100 text-slate-400 cursor-not-allowed line-through'
                  )}
                  title={slot.conflictingAppointment || (slot.isGoogleBusy ? text.busyGoogle : undefined)}
                >
                  {slot.time}
                  {isSelected && (
                    <Check className="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 text-white rounded-full p-0.5" />
                  )}
                </button>
              )
            })}
          </div>

          {timeSlots.filter(s => s.available).length === 0 && (
            <p className="text-center text-sm text-slate-500 py-4">
              {text.noAvailable}
            </p>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 pt-2 border-t border-slate-100 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <div className="w-3 h-3 rounded bg-green-100 border border-green-300" />
          <span>{text.available}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <div className="w-3 h-3 rounded bg-slate-100 border border-slate-300" />
          <span>{text.busyCRM}</span>
        </div>
        {isCalendarConnected && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <div className="w-3 h-3 rounded bg-purple-100 border border-purple-300" />
            <span>{text.busyGoogle}</span>
          </div>
        )}
      </div>
    </div>
  )
}
