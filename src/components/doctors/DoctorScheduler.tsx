'use client'

import { useState, useMemo } from 'react'
import {
  User,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  Check,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Button, Modal, Input, Select, Avatar } from '@/components/ui'
import { useLanguage } from '@/i18n/LanguageContext'
import { Doctor } from '@/types'
import { cn } from '@/lib/utils'

interface DoctorSchedulerProps {
  doctors: Doctor[]
  onAddDoctor: (doctor: Omit<Doctor, 'id'>) => void
  onUpdateDoctor: (id: string, doctor: Partial<Doctor>) => void
  onDeleteDoctor: (id: string) => void
}

const defaultWorkingHours: Doctor['workingHours'] = {
  0: { start: '09:00', end: '18:00', enabled: false }, // Sunday
  1: { start: '09:00', end: '18:00', enabled: true },  // Monday
  2: { start: '09:00', end: '18:00', enabled: true },  // Tuesday
  3: { start: '09:00', end: '18:00', enabled: true },  // Wednesday
  4: { start: '09:00', end: '18:00', enabled: true },  // Thursday
  5: { start: '09:00', end: '18:00', enabled: true },  // Friday
  6: { start: '09:00', end: '14:00', enabled: false }, // Saturday
}

const colorOptions = [
  { value: '#3B82F6', label: 'Blue' },
  { value: '#10B981', label: 'Green' },
  { value: '#F59E0B', label: 'Amber' },
  { value: '#EF4444', label: 'Red' },
  { value: '#8B5CF6', label: 'Purple' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#06B6D4', label: 'Cyan' },
  { value: '#F97316', label: 'Orange' },
]

export function DoctorScheduler({
  doctors,
  onAddDoctor,
  onUpdateDoctor,
  onDeleteDoctor,
}: DoctorSchedulerProps) {
  const { language } = useLanguage()
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [expandedDoctor, setExpandedDoctor] = useState<string | null>(null)
  const [editingDoctor, setEditingDoctor] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: '',
    color: '#3B82F6',
    active: true,
    workingHours: defaultWorkingHours,
    slotDuration: 30,
  })

  const t = {
    title: language === 'es' ? 'Gestión de Doctores' : 'Doctor Management',
    addDoctor: language === 'es' ? 'Agregar Doctor' : 'Add Doctor',
    editDoctor: language === 'es' ? 'Editar Doctor' : 'Edit Doctor',
    name: language === 'es' ? 'Nombre' : 'Name',
    email: language === 'es' ? 'Email' : 'Email',
    phone: language === 'es' ? 'Teléfono' : 'Phone',
    specialty: language === 'es' ? 'Especialidad' : 'Specialty',
    color: language === 'es' ? 'Color (calendario)' : 'Color (calendar)',
    active: language === 'es' ? 'Activo' : 'Active',
    inactive: language === 'es' ? 'Inactivo' : 'Inactive',
    workingHours: language === 'es' ? 'Horario de Trabajo' : 'Working Hours',
    slotDuration: language === 'es' ? 'Duración de cita (min)' : 'Appointment duration (min)',
    save: language === 'es' ? 'Guardar' : 'Save',
    cancel: language === 'es' ? 'Cancelar' : 'Cancel',
    delete: language === 'es' ? 'Eliminar' : 'Delete',
    noDoctors: language === 'es' ? 'No hay doctores registrados' : 'No doctors registered',
    days: {
      0: language === 'es' ? 'Domingo' : 'Sunday',
      1: language === 'es' ? 'Lunes' : 'Monday',
      2: language === 'es' ? 'Martes' : 'Tuesday',
      3: language === 'es' ? 'Miércoles' : 'Wednesday',
      4: language === 'es' ? 'Jueves' : 'Thursday',
      5: language === 'es' ? 'Viernes' : 'Friday',
      6: language === 'es' ? 'Sábado' : 'Saturday',
    } as Record<number, string>,
    optional: language === 'es' ? 'opcional' : 'optional',
    viewSchedule: language === 'es' ? 'Ver horario' : 'View schedule',
    hideSchedule: language === 'es' ? 'Ocultar horario' : 'Hide schedule',
  }

  const handleOpenNew = () => {
    setSelectedDoctor(null)
    setEditingDoctor({
      name: '',
      email: '',
      phone: '',
      specialty: '',
      color: '#3B82F6',
      active: true,
      workingHours: defaultWorkingHours,
      slotDuration: 30,
    })
    setShowEditModal(true)
  }

  const handleOpenEdit = (doctor: Doctor) => {
    setSelectedDoctor(doctor)
    setEditingDoctor({
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone || '',
      specialty: doctor.specialty,
      color: doctor.color,
      active: doctor.active,
      workingHours: doctor.workingHours,
      slotDuration: doctor.slotDuration,
    })
    setShowEditModal(true)
  }

  const handleSave = () => {
    if (!editingDoctor.name || !editingDoctor.email || !editingDoctor.specialty) return

    if (selectedDoctor) {
      onUpdateDoctor(selectedDoctor.id, {
        name: editingDoctor.name,
        email: editingDoctor.email,
        phone: editingDoctor.phone || undefined,
        specialty: editingDoctor.specialty,
        color: editingDoctor.color,
        active: editingDoctor.active,
        workingHours: editingDoctor.workingHours,
        slotDuration: editingDoctor.slotDuration,
      })
    } else {
      onAddDoctor({
        name: editingDoctor.name,
        email: editingDoctor.email,
        phone: editingDoctor.phone || undefined,
        specialty: editingDoctor.specialty,
        color: editingDoctor.color,
        active: editingDoctor.active,
        workingHours: editingDoctor.workingHours,
        slotDuration: editingDoctor.slotDuration,
      })
    }
    setShowEditModal(false)
  }

  const updateWorkingDay = (day: number, field: 'start' | 'end' | 'enabled', value: string | boolean) => {
    setEditingDoctor({
      ...editingDoctor,
      workingHours: {
        ...editingDoctor.workingHours,
        [day]: {
          ...editingDoctor.workingHours[day],
          [field]: value,
        },
      },
    })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary-100 rounded-lg">
            <User className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">{t.title}</h3>
            <p className="text-xs text-slate-500">{doctors.length} {language === 'es' ? 'registrados' : 'registered'}</p>
          </div>
        </div>
        <Button size="sm" onClick={handleOpenNew}>
          <Plus className="w-4 h-4 mr-1" />
          {t.addDoctor}
        </Button>
      </div>

      {/* Doctor List */}
      {doctors.length === 0 ? (
        <div className="text-center py-8">
          <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">{t.noDoctors}</p>
          <button
            onClick={handleOpenNew}
            className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            {t.addDoctor}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {doctors.map((doctor) => {
            const isExpanded = expandedDoctor === doctor.id

            return (
              <div
                key={doctor.id}
                className={cn(
                  'border rounded-xl overflow-hidden transition-all',
                  doctor.active
                    ? 'bg-white border-slate-200'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                )}
              >
                {/* Doctor Header */}
                <div className="p-4 flex items-center gap-4">
                  <div
                    className="w-3 h-12 rounded-full"
                    style={{ backgroundColor: doctor.color }}
                  />
                  <Avatar name={doctor.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-slate-800">{doctor.name}</h4>
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-medium',
                        doctor.active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-200 text-slate-500'
                      )}>
                        {doctor.active ? t.active : t.inactive}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">{doctor.specialty}</p>
                    <p className="text-xs text-slate-400">{doctor.email}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpandedDoctor(isExpanded ? null : doctor.id)}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleOpenEdit(doctor)}
                      className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteDoctor(doctor.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Schedule */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-slate-100">
                    <p className="text-xs font-medium text-slate-500 mt-3 mb-2">
                      {t.workingHours} • {t.slotDuration}: {doctor.slotDuration} min
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {[1, 2, 3, 4, 5, 6, 0].map((day) => {
                        const schedule = doctor.workingHours[day]
                        return (
                          <div
                            key={day}
                            className={cn(
                              'p-2 rounded-lg text-sm',
                              schedule.enabled
                                ? 'bg-green-50 text-green-700'
                                : 'bg-slate-100 text-slate-400'
                            )}
                          >
                            <span className="font-medium">{t.days[day]}</span>
                            {schedule.enabled ? (
                              <span className="ml-2">
                                {schedule.start} - {schedule.end}
                              </span>
                            ) : (
                              <span className="ml-2">{language === 'es' ? 'Cerrado' : 'Closed'}</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Edit/Create Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={selectedDoctor ? t.editDoctor : t.addDoctor}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t.name}
              value={editingDoctor.name}
              onChange={(e) => setEditingDoctor({ ...editingDoctor, name: e.target.value })}
              placeholder="Dr. Juan Pérez"
              required
            />
            <Input
              label={t.specialty}
              value={editingDoctor.specialty}
              onChange={(e) => setEditingDoctor({ ...editingDoctor, specialty: e.target.value })}
              placeholder={language === 'es' ? 'Dermatología' : 'Dermatology'}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t.email}
              type="email"
              value={editingDoctor.email}
              onChange={(e) => setEditingDoctor({ ...editingDoctor, email: e.target.value })}
              placeholder="doctor@clinic.com"
              required
            />
            <Input
              label={`${t.phone} (${t.optional})`}
              value={editingDoctor.phone}
              onChange={(e) => setEditingDoctor({ ...editingDoctor, phone: e.target.value })}
              placeholder="+54 11 1234-5678"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.color}</label>
              <div className="flex gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setEditingDoctor({ ...editingDoctor, color: color.value })}
                    className={cn(
                      'w-8 h-8 rounded-lg transition-all',
                      editingDoctor.color === color.value && 'ring-2 ring-offset-2 ring-slate-400'
                    )}
                    style={{ backgroundColor: color.value }}
                  />
                ))}
              </div>
            </div>
            <Select
              label={t.slotDuration}
              value={editingDoctor.slotDuration.toString()}
              onChange={(value) => setEditingDoctor({ ...editingDoctor, slotDuration: parseInt(value) })}
              options={[
                { value: '15', label: '15 min' },
                { value: '20', label: '20 min' },
                { value: '30', label: '30 min' },
                { value: '45', label: '45 min' },
                { value: '60', label: '60 min' },
                { value: '90', label: '90 min' },
              ]}
            />
          </div>

          {/* Working Hours */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t.workingHours}</label>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {[1, 2, 3, 4, 5, 6, 0].map((day) => {
                const schedule = editingDoctor.workingHours[day]
                return (
                  <div key={day} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                    <button
                      type="button"
                      onClick={() => updateWorkingDay(day, 'enabled', !schedule.enabled)}
                      className={cn(
                        'w-6 h-6 rounded-md flex items-center justify-center transition-colors',
                        schedule.enabled
                          ? 'bg-green-500 text-white'
                          : 'bg-slate-200 text-slate-400'
                      )}
                    >
                      {schedule.enabled ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </button>
                    <span className="w-24 text-sm font-medium text-slate-700">
                      {t.days[day]}
                    </span>
                    <input
                      type="time"
                      value={schedule.start}
                      onChange={(e) => updateWorkingDay(day, 'start', e.target.value)}
                      disabled={!schedule.enabled}
                      className="px-2 py-1 text-sm border border-slate-200 rounded-lg disabled:opacity-50 disabled:bg-slate-100"
                    />
                    <span className="text-slate-400">-</span>
                    <input
                      type="time"
                      value={schedule.end}
                      onChange={(e) => updateWorkingDay(day, 'end', e.target.value)}
                      disabled={!schedule.enabled}
                      className="px-2 py-1 text-sm border border-slate-200 rounded-lg disabled:opacity-50 disabled:bg-slate-100"
                    />
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" fullWidth onClick={() => setShowEditModal(false)}>
              {t.cancel}
            </Button>
            <Button fullWidth onClick={handleSave}>
              {t.save}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
