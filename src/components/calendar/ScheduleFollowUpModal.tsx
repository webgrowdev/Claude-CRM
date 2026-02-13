'use client'

import React, { useState, useMemo } from 'react'
import { Search, User, Phone, Calendar, Clock, X, MessageCircle, Mail, Video, CalendarCheck } from 'lucide-react'
import { Modal, Input, Button, Avatar, Badge, Select } from '@/components/ui'
import { useApp } from '@/contexts/AppContext'
import { Patient, Treatment, AppointmentStatus, FollowUpType } from '@/types'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { es, enUS } from 'date-fns/locale'

interface ScheduleFollowUpModalProps {
  isOpen: boolean
  onClose: () => void
  language?: 'es' | 'en'
}

export function ScheduleFollowUpModal({ isOpen, onClose, language = 'es' }: ScheduleFollowUpModalProps) {
  const { state, addFollowUp, getDerivedPatientStatus } = useApp()
  const locale = language === 'es' ? es : enUS
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showAppointmentForm, setShowAppointmentForm] = useState(false)
  
  // Appointment form state
  const [appointmentDate, setAppointmentDate] = useState<Date>(new Date())
  const [appointmentTime, setAppointmentTime] = useState<string>('')
  const [followUpType, setFollowUpType] = useState<FollowUpType>('appointment')
  const [treatmentId, setTreatmentId] = useState<string>('')
  const [appointmentNotes, setAppointmentNotes] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  // Follow-up type options
  const followUpTypeOptions: { value: FollowUpType; label: string; labelEs: string; icon: React.ElementType }[] = [
    { value: 'appointment', label: 'In-person Appointment', labelEs: 'Cita Presencial', icon: CalendarCheck },
    { value: 'meeting', label: 'Video Call (Meet)', labelEs: 'Videollamada (Meet)', icon: Video },
    { value: 'call', label: 'Phone Call', labelEs: 'Llamada Telefónica', icon: Phone },
    { value: 'whatsapp', label: 'WhatsApp Message', labelEs: 'Mensaje WhatsApp', icon: MessageCircle },
    { value: 'message', label: 'Message', labelEs: 'Mensaje', icon: MessageCircle },
    { value: 'email', label: 'Email', labelEs: 'Correo Electrónico', icon: Mail },
  ]

  // Filter patients by search query (name, phone, ID)
  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return []
    
    const query = searchQuery.toLowerCase()
    return state.patients.filter((patient) => {
      const matchName = patient.name.toLowerCase().includes(query)
      const matchPhone = patient.phone.toLowerCase().includes(query)
      const matchId = patient.identificationNumber?.toLowerCase().includes(query)
      return matchName || matchPhone || matchId
    })
  }, [state.patients, searchQuery])

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient)
    setShowAppointmentForm(true)
  }

  const handleBack = () => {
    setShowAppointmentForm(false)
    setSelectedPatient(null)
    setAppointmentTime('')
    setFollowUpType('appointment')
    setTreatmentId('')
    setAppointmentNotes('')
  }

  const handleCreateAppointment = async () => {
    if (!selectedPatient || !appointmentTime) return
    // Treatment is required only for appointments and meetings
    if ((followUpType === 'appointment' || followUpType === 'meeting') && !treatmentId) return

    setIsCreating(true)
    try {
      const [hours, minutes] = appointmentTime.split(':').map(Number)
      const scheduledAt = new Date(appointmentDate)
      scheduledAt.setHours(hours, minutes, 0, 0)

      const treatment = state.treatments.find((t) => t.id === treatmentId)
      const duration = treatment?.duration || 30

      await addFollowUp(
        selectedPatient.id,
        {
          type: followUpType,
          scheduledAt,
          duration,
          treatmentId: treatmentId || undefined,
          treatmentName: treatment?.name,
          notes: appointmentNotes,
          appointmentStatus: (followUpType === 'appointment' || followUpType === 'meeting') ? 'pending' : undefined,
          assignedTo: state.user.id,
        },
        followUpType === 'meeting' // Sync with calendar only for video meetings
      )

      // Close modal and reset state
      handleClose()
    } catch (error) {
      console.error('Error creating appointment:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    setSearchQuery('')
    setSelectedPatient(null)
    setShowAppointmentForm(false)
    setAppointmentTime('')
    setFollowUpType('appointment')
    setTreatmentId('')
    setAppointmentNotes('')
    onClose()
  }

  const getFormTitle = () => {
    if (!showAppointmentForm) {
      return language === 'es' ? 'Buscar Paciente' : 'Search Patient'
    }
    
    switch (followUpType) {
      case 'appointment':
        return language === 'es' ? 'Nueva Cita Presencial' : 'New In-person Appointment'
      case 'meeting':
        return language === 'es' ? 'Nueva Videollamada' : 'New Video Call'
      case 'call':
        return language === 'es' ? 'Nueva Llamada' : 'New Phone Call'
      case 'whatsapp':
      case 'message':
        return language === 'es' ? 'Nuevo Mensaje' : 'New Message'
      case 'email':
        return language === 'es' ? 'Nuevo Correo' : 'New Email'
      default:
        return language === 'es' ? 'Nuevo Seguimiento' : 'New Follow-up'
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={getFormTitle()}
      size="lg"
    >
      {!showAppointmentForm ? (
        // Patient Search View
        <div className="space-y-4">
          <Input
            icon={<Search className="w-5 h-5" />}
            placeholder={language === 'es' ? 'Buscar por nombre, teléfono o ID...' : 'Search by name, phone or ID...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredPatients.length === 0 && searchQuery.trim() && (
              <div className="text-center py-8 text-slate-500">
                <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>{language === 'es' ? 'No se encontraron pacientes' : 'No patients found'}</p>
              </div>
            )}

            {filteredPatients.map((patient) => {
              const derivedStatus = getDerivedPatientStatus(patient.id)
              return (
                <button
                  key={patient.id}
                  onClick={() => handlePatientSelect(patient)}
                  className="w-full p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left"
                >
                  <div className="flex items-start gap-3">
                    <Avatar name={patient.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-800">{patient.name}</h3>
                        <Badge
                          variant={
                            derivedStatus === 'scheduled' ? 'primary' :
                            derivedStatus === 'active' ? 'success' :
                            derivedStatus === 'new' ? 'primary' :
                            derivedStatus === 'lost' ? 'error' : 'default'
                          }
                          size="sm"
                        >
                          {language === 'es' ? (
                            derivedStatus === 'scheduled' ? 'Agendado' :
                            derivedStatus === 'active' ? 'Activo' :
                            derivedStatus === 'new' ? 'Nuevo' :
                            derivedStatus === 'lost' ? 'Perdido' : 'Inactivo'
                          ) : (
                            derivedStatus === 'scheduled' ? 'Scheduled' :
                            derivedStatus === 'active' ? 'Active' :
                            derivedStatus === 'new' ? 'New' :
                            derivedStatus === 'lost' ? 'Lost' : 'Inactive'
                          )}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {patient.phone}
                        </span>
                        {patient.identificationNumber && (
                          <span>ID: {patient.identificationNumber}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        // Appointment Form View
        <div className="space-y-4">
          {/* Patient Info */}
          <div className="p-4 bg-primary-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Avatar name={selectedPatient!.name} size="md" />
              <div>
                <h3 className="font-semibold text-slate-800">{selectedPatient!.name}</h3>
                <p className="text-sm text-slate-600">{selectedPatient!.phone}</p>
              </div>
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {language === 'es' ? 'Fecha' : 'Date'}
            </label>
            <input
              type="date"
              value={format(appointmentDate, 'yyyy-MM-dd')}
              onChange={(e) => setAppointmentDate(new Date(e.target.value))}
              className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              min={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>

          {/* Time Picker */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {language === 'es' ? 'Hora' : 'Time'}
            </label>
            <input
              type="time"
              value={appointmentTime}
              onChange={(e) => setAppointmentTime(e.target.value)}
              className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Follow-up Type Select */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {language === 'es' ? 'Tipo de Actividad' : 'Activity Type'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {followUpTypeOptions.map((option) => {
                const OptionIcon = option.icon
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFollowUpType(option.value)}
                    className={cn(
                      'flex items-center gap-2 p-3 rounded-lg border-2 transition-all',
                      followUpType === option.value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    )}
                  >
                    <OptionIcon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-medium text-left">
                      {language === 'es' ? option.labelEs : option.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Treatment Select - Only show for appointments and meetings */}
          {(followUpType === 'appointment' || followUpType === 'meeting') && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {language === 'es' ? 'Tratamiento' : 'Treatment'}
              </label>
              <Select
                value={treatmentId}
                onChange={setTreatmentId}
                options={[
                  { value: '', label: language === 'es' ? 'Seleccionar tratamiento' : 'Select treatment' },
                  ...state.treatments
                    .filter((t) => t.active !== false)
                    .map((t) => ({
                      value: t.id,
                      label: `${t.name} (${t.duration} min)`,
                    })),
                ]}
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {language === 'es' ? 'Notas (opcional)' : 'Notes (optional)'}
            </label>
            <textarea
              value={appointmentNotes}
              onChange={(e) => setAppointmentNotes(e.target.value)}
              placeholder={language === 'es' ? 'Agregar notas...' : 'Add notes...'}
              className="w-full h-24 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleBack}
              variant="outline"
              className="flex-1"
              disabled={isCreating}
            >
              {language === 'es' ? 'Atrás' : 'Back'}
            </Button>
            <Button
              onClick={handleCreateAppointment}
              className="flex-1"
              disabled={
                !appointmentTime || 
                ((followUpType === 'appointment' || followUpType === 'meeting') && !treatmentId) || 
                isCreating
              }
            >
              {isCreating ? (
                language === 'es' ? 'Creando...' : 'Creating...'
              ) : (
                language === 'es' ? 'Crear Seguimiento' : 'Create Follow-up'
              )}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
