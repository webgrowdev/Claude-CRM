'use client'

import { useState } from 'react'
import { format, addMinutes, isBefore, isAfter, startOfDay, setHours, setMinutes } from 'date-fns'
import { Clock, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'

export interface TimeSlot {
  time: string // "09:00"
  date: Date
  available: boolean
  appointmentId?: string
}

interface SlotPickerProps {
  selectedDate: Date
  slots: TimeSlot[]
  onSelectSlot: (slot: TimeSlot) => void
  selectedSlot?: TimeSlot
  workingHours?: { start: string; end: string }
  slotDuration?: number // minutes
}

export function SlotPicker({
  selectedDate,
  slots,
  onSelectSlot,
  selectedSlot,
  workingHours = { start: '09:00', end: '18:00' },
  slotDuration = 30,
}: SlotPickerProps) {
  // Generate all possible time slots for the day
  const generateTimeSlots = (): TimeSlot[] => {
    const [startHour, startMinute] = workingHours.start.split(':').map(Number)
    const [endHour, endMinute] = workingHours.end.split(':').map(Number)

    let current = setMinutes(setHours(startOfDay(selectedDate), startHour), startMinute)
    const end = setMinutes(setHours(startOfDay(selectedDate), endHour), endMinute)
    const generated: TimeSlot[] = []

    while (isBefore(current, end)) {
      const timeStr = format(current, 'HH:mm')
      
      // Check if this slot is in the provided slots array
      const existingSlot = slots.find(s => s.time === timeStr)
      
      generated.push({
        time: timeStr,
        date: current,
        available: existingSlot ? existingSlot.available : true,
        appointmentId: existingSlot?.appointmentId,
      })

      current = addMinutes(current, slotDuration)
    }

    return generated
  }

  const timeSlots = generateTimeSlots()

  // Group slots by time period
  const morningSlots = timeSlots.filter(s => {
    const hour = parseInt(s.time.split(':')[0])
    return hour < 12
  })

  const afternoonSlots = timeSlots.filter(s => {
    const hour = parseInt(s.time.split(':')[0])
    return hour >= 12 && hour < 18
  })

  const eveningSlots = timeSlots.filter(s => {
    const hour = parseInt(s.time.split(':')[0])
    return hour >= 18
  })

  const SlotButton = ({ slot }: { slot: TimeSlot }) => {
    const isSelected = selectedSlot?.time === slot.time
    const isPast = isBefore(slot.date, new Date())

    return (
      <button
        onClick={() => slot.available && !isPast && onSelectSlot(slot)}
        disabled={!slot.available || isPast}
        className={cn(
          'relative px-3 py-2 rounded-lg text-sm font-medium transition-all',
          'hover:scale-105 active:scale-95',
          isSelected && 'ring-2 ring-blue-500 ring-offset-2',
          slot.available && !isPast && 'bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer',
          !slot.available && 'bg-gray-100 text-gray-400 cursor-not-allowed line-through',
          isPast && !slot.available && 'bg-gray-50 text-gray-300',
          isPast && slot.available && 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
        )}
      >
        <div className="flex items-center gap-1.5">
          {isSelected && <Check className="w-3 h-3" />}
          <Clock className="w-3 h-3" />
          <span>{slot.time}</span>
        </div>
      </button>
    )
  }

  const SlotGroup = ({ title, slots }: { title: string; slots: TimeSlot[] }) => {
    if (slots.length === 0) return null

    return (
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {title}
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {slots.map((slot) => (
            <SlotButton key={slot.time} slot={slot} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">
          Horarios Disponibles - {format(selectedDate, 'dd/MM/yyyy')}
        </h3>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-100 rounded" />
            <span>Disponible</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-100 rounded" />
            <span>Ocupado</span>
          </div>
        </div>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        <SlotGroup title="Mañana" slots={morningSlots} />
        <SlotGroup title="Tarde" slots={afternoonSlots} />
        <SlotGroup title="Noche" slots={eveningSlots} />
      </div>

      {selectedSlot && (
        <div className="pt-4 border-t">
          <p className="text-sm text-gray-600">
            Hora seleccionada: <span className="font-semibold text-gray-900">{selectedSlot.time}</span>
          </p>
        </div>
      )}
    </div>
  )
}
