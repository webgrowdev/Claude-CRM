'use client'

import React, { useState, useMemo } from 'react'
import { Search, User, Phone, Calendar, Clock, X } from 'lucide-react'
import { Modal, Input, Button, Avatar, Badge, Select } from '@/components/ui'
import { useApp } from '@/contexts/AppContext'
import { Lead, Treatment, AppointmentStatus } from '@/types'
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
  const [selectedPatient, setSelectedPatient] = useState<Lead | null>(null)
  const [showAppointmentForm, setShowAppointmentForm] = useState(false)
  
  // Appointment form state
  const [appointmentDate, setAppointmentDate] = useState<Date>(new Date())
  const [appointmentTime, setAppointmentTime] = useState<string>('')
  const [treatmentId, setTreatmentId] = useState<string>('')
  const [appointmentNotes, setAppointmentNotes] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  // Filter patients by search query (name, phone, ID)
  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return []
    
    const query = searchQuery.toLowerCase()
    return state.leads.filter((lead) => {
      const matchName = lead.name.toLowerCase().includes(query)
      const matchPhone = lead.phone.toLowerCase().includes(query)
      const matchId = lead.identificationNumber?.toLowerCase().includes(query)
      return matchName || matchPhone || matchId
    })
  }, [state.leads, searchQuery])

  const handlePatientSelect = (patient: Lead) => {
    setSelectedPatient(patient)
    setShowAppointmentForm(true)
  }

  const handleBack = () => {
    setShowAppointmentForm(false)
    setSelectedPatient(null)
    setAppointmentTime('')
    setTreatmentId('')
    setAppointmentNotes('')
  }

  const handleCreateAppointment = async () => {
    if (!selectedPatient || !appointmentTime || !treatmentId) return

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
          type: 'appointment',
          scheduledAt,
          duration,
          treatmentId,
          treatmentName: treatment?.name,
          notes: appointmentNotes,
          appointmentStatus: 'pending',
          assignedTo: state.user.id,
        },
        true // Sync with calendar
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
    setTreatmentId('')
    setAppointmentNotes('')
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={showAppointmentForm ? (language === 'es' ? 'Nueva Cita' : 'New Appointment') : (language === 'es' ? 'Buscar Paciente' : 'Search Patient')}
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

          {/* Treatment Select */}
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
              disabled={!appointmentTime || !treatmentId || isCreating}
            >
              {isCreating ? (
                language === 'es' ? 'Creando...' : 'Creating...'
              ) : (
                language === 'es' ? 'Crear Cita' : 'Create Appointment'
              )}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
