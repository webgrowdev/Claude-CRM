'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Search, Calendar, Phone, Video, MessageCircle, MapPin, X, Check } from 'lucide-react'
import { format, addDays, setHours, setMinutes, startOfDay } from 'date-fns'
import { cn } from '@/lib/utils'
import { Card, Button, Avatar } from '@/components/ui'
import { SlotPicker, TimeSlot } from './SlotPicker'
import { Lead, FollowUpType, FollowUp } from '@/types'
import { useApp } from '@/contexts/AppContext'
import { generateId } from '@/lib/utils'

interface QuickBookingBarProps {
  onBookingComplete?: (leadId: string, followUp: FollowUp) => void
  language?: 'es' | 'en'
}

export function QuickBookingBar({ onBookingComplete, language = 'es' }: QuickBookingBarProps) {
  const { state, addFollowUp } = useApp()
  const [searchQuery, setSearchQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Lead | null>(null)
  const [selectedType, setSelectedType] = useState<FollowUpType>('appointment')
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isBooking, setIsBooking] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const t = {
    quickBooking: language === 'es' ? 'Reserva Rápida' : 'Quick Booking',
    cancel: language === 'es' ? 'Cancelar' : 'Cancel',
    searchPlaceholder: language === 'es' 
      ? 'Buscar paciente por nombre, teléfono o DNI...' 
      : 'Search patient by name, phone or ID...',
    noPatients: language === 'es' ? 'No se encontraron pacientes' : 'No patients found',
    appointmentType: language === 'es' ? 'Tipo de Cita' : 'Appointment Type',
    date: language === 'es' ? 'Fecha' : 'Date',
    today: language === 'es' ? 'Hoy' : 'Today',
    confirmBooking: language === 'es' ? 'Confirmar Reserva' : 'Confirm Booking',
    booking: language === 'es' ? 'Reservando...' : 'Booking...',
    inPerson: language === 'es' ? 'Presencial' : 'In-person',
    videoCall: language === 'es' ? 'Videollamada' : 'Video Call',
    call: language === 'es' ? 'Llamada' : 'Call',
    message: language === 'es' ? 'Mensaje' : 'Message',
  }

  // Filter patients based on search
  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return []

    const query = searchQuery.toLowerCase()
    return state.leads.filter(
      (lead) =>
        lead.name.toLowerCase().includes(query) ||
        lead.phone.includes(query) ||
        lead.identificationNumber?.toLowerCase().includes(query) ||
        lead.email?.toLowerCase().includes(query)
    ).slice(0, 5) // Limit to 5 results
  }, [searchQuery, state.leads])

  // Get occupied slots for selected date
  const occupiedSlots = useMemo(() => {
    const slots: TimeSlot[] = []
    state.leads.forEach((lead) => {
      lead.followUps
        .filter((fu) => !fu.completed && fu.type === 'appointment')
        .forEach((fu) => {
          const fuDate = new Date(fu.scheduledAt)
          if (format(fuDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')) {
            slots.push({
              time: format(fuDate, 'HH:mm'),
              date: fuDate,
              available: false,
              appointmentId: fu.id,
            })
          }
        })
    })
    return slots
  }, [state.leads, selectedDate])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handlePatientSelect = (patient: Lead) => {
    setSelectedPatient(patient)
    setSearchQuery(patient.name)
    setShowResults(false)
  }

  const handleQuickBook = async () => {
    if (!selectedPatient) return
    
    // For appointment types, slot is required
    if (selectedType === 'appointment' && !selectedSlot) return

    setIsBooking(true)
    try {
      let appointmentDate: Date

      if (selectedSlot) {
        const [hours, minutes] = selectedSlot.time.split(':').map(Number)
        appointmentDate = setMinutes(setHours(startOfDay(selectedDate), hours), minutes)
      } else {
        // For non-appointment types without slot, use selected date at 9 AM
        appointmentDate = setMinutes(setHours(startOfDay(selectedDate), 9), 0)
      }

      const followUpData: Omit<FollowUp, 'id' | 'leadId' | 'completed'> = {
        type: selectedType,
        scheduledAt: appointmentDate,
        duration: 30,
        notes: `Reserva rápida - ${selectedType}`,
        appointmentStatus: 'pending',
        treatmentPhase: selectedType === 'appointment' ? 'consultation' : undefined,
      }

      const newFollowUp = await addFollowUp(selectedPatient.id, followUpData, true)
      
      if (newFollowUp && onBookingComplete) {
        onBookingComplete(selectedPatient.id, newFollowUp)
      }

      // Reset form
      setSelectedPatient(null)
      setSearchQuery('')
      setSelectedSlot(null)
      setSelectedType('appointment')
    } catch (error) {
      console.error('Error creating booking:', error)
    } finally {
      setIsBooking(false)
    }
  }

  const resetBooking = () => {
    setSelectedPatient(null)
    setSearchQuery('')
    setSelectedSlot(null)
    setSelectedType('appointment')
  }

  const appointmentTypes = [
    { type: 'appointment' as FollowUpType, label: t.inPerson, icon: MapPin, color: 'blue' },
    { type: 'meeting' as FollowUpType, label: t.videoCall, icon: Video, color: 'purple' },
    { type: 'call' as FollowUpType, label: t.call, icon: Phone, color: 'green' },
    { type: 'message' as FollowUpType, label: t.message, icon: MessageCircle, color: 'orange' },
  ]

  return (
    <Card className="p-4 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            {t.quickBooking}
          </h3>
          {selectedPatient && (
            <Button variant="ghost" size="sm" onClick={resetBooking}>
              <X className="w-4 h-4 mr-1" />
              {t.cancel}
            </Button>
          )}
        </div>

        {/* Step 1: Patient Search */}
        <div ref={searchRef} className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowResults(true)
                setSelectedPatient(null)
              }}
              onFocus={() => setShowResults(true)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
            />
          </div>

          {/* Search Results Dropdown */}
          {showResults && filteredPatients.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {filteredPatients.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => handlePatientSelect(patient)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 transition-colors text-left"
                >
                  <Avatar name={patient.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{patient.name}</p>
                    <p className="text-sm text-gray-500 truncate">{patient.phone}</p>
                  </div>
                  {patient.identificationNumber && (
                    <span className="text-xs text-gray-400">{patient.identificationNumber}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {showResults && searchQuery && filteredPatients.length === 0 && (
            <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
              {t.noPatients}
            </div>
          )}
        </div>

        {/* Step 2 & 3: Type Selection + Slot Picker (only if patient selected) */}
        {selectedPatient && (
          <div className="space-y-4 animate-fadeIn">
            {/* Selected Patient Info */}
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border-2 border-blue-200">
              <Avatar name={selectedPatient.name} size="md" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{selectedPatient.name}</p>
                <p className="text-sm text-gray-500">{selectedPatient.phone}</p>
              </div>
              <Check className="w-5 h-5 text-green-600" />
            </div>

            {/* Appointment Type Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.appointmentType}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {appointmentTypes.map(({ type, label, icon: Icon, color }) => {
                  const isSelected = selectedType === type
                  const colorClasses = {
                    blue: 'border-blue-500 bg-blue-50 text-blue-700',
                    purple: 'border-purple-500 bg-purple-50 text-purple-700',
                    green: 'border-green-500 bg-green-50 text-green-700',
                    orange: 'border-orange-500 bg-orange-50 text-orange-700',
                  }
                  
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={cn(
                        'flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all',
                        isSelected
                          ? colorClasses[color as keyof typeof colorClasses]
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-medium">{label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Date Quick Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.date}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3].map((daysToAdd) => {
                  const date = addDays(new Date(), daysToAdd)
                  const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                  const isToday = daysToAdd === 0
                  return (
                    <button
                      key={daysToAdd}
                      onClick={() => {
                        setSelectedDate(date)
                        setSelectedSlot(null)
                      }}
                      className={cn(
                        'p-2 rounded-lg border-2 transition-all text-center',
                        isSelected
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      )}
                    >
                      <div className="text-xs font-medium">{isToday ? t.today : format(date, 'EEE')}</div>
                      <div className="text-lg font-bold">{format(date, 'd')}</div>
                      <div className="text-xs">{format(date, 'MMM')}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Slot Picker */}
            {selectedType === 'appointment' && (
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                <SlotPicker
                  selectedDate={selectedDate}
                  slots={occupiedSlots}
                  onSelectSlot={setSelectedSlot}
                  selectedSlot={selectedSlot || undefined}
                  slotDuration={30}
                  language={language}
                />
              </div>
            )}

            {/* Book Button */}
            <Button
              onClick={handleQuickBook}
              disabled={(selectedType === 'appointment' && !selectedSlot) || isBooking}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              size="lg"
            >
              {isBooking ? (
                <>{t.booking}</>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  {t.confirmBooking}
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
