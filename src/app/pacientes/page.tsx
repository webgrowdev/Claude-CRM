'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Search,
  Plus,
  Phone,
  MessageCircle,
  Mail,
  Calendar,
  Instagram,
  Globe,
  Users,
  HelpCircle,
  X,
  Clock,
  FileText,
  CheckCircle,
  Video,
  ExternalLink,
  MoreHorizontal,
  ChevronRight,
  Loader2,
  Trash2,
  UserPlus,
} from 'lucide-react'
import { AppShell } from '@/components/layout'
import { Input, Card, Avatar, Badge, Modal, Button, Select, TextArea } from '@/components/ui'
import { useApp } from '@/contexts/AppContext'
import {
  formatTimeAgo,
  formatRelativeDate,
  getStatusLabel,
  getSourceLabel,
  getWhatsAppUrl,
  getPhoneUrl,
  getEmailUrl,
  cn,
} from '@/lib/utils'
import { LeadStatus, LeadSource, FollowUpType, Lead } from '@/types'

const statusOptions: { value: LeadStatus; label: string; color: string; bg: string }[] = [
  { value: 'new', label: 'Nuevo', color: 'text-primary-600', bg: 'bg-primary-100' },
  { value: 'contacted', label: 'Contactado', color: 'text-amber-600', bg: 'bg-amber-100' },
  { value: 'scheduled', label: 'Agendado', color: 'text-purple-600', bg: 'bg-purple-100' },
  { value: 'closed', label: 'Cerrado', color: 'text-emerald-600', bg: 'bg-emerald-100' },
  { value: 'lost', label: 'Perdido', color: 'text-red-600', bg: 'bg-red-100' },
]

const sourceIcons: Record<LeadSource, React.ReactNode> = {
  instagram: <Instagram className="w-4 h-4" />,
  whatsapp: <MessageCircle className="w-4 h-4" />,
  phone: <Phone className="w-4 h-4" />,
  website: <Globe className="w-4 h-4" />,
  referral: <Users className="w-4 h-4" />,
  other: <HelpCircle className="w-4 h-4" />,
}

export default function PacientesPage() {
  const searchParams = useSearchParams()
  const { state, addLead, updateLeadStatus, addNote, addFollowUp, deleteLead, isCalendarConnected } = useApp()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all')
  const [selectedPatient, setSelectedPatient] = useState<Lead | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showFollowUpModal, setShowFollowUpModal] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isCreatingFollowUp, setIsCreatingFollowUp] = useState(false)
  const [noteContent, setNoteContent] = useState('')

  // New patient form
  const [newPatient, setNewPatient] = useState({
    name: '',
    phone: '',
    email: '',
    source: 'instagram' as LeadSource,
    treatments: [] as string[],
  })

  // Follow-up form
  const [followUp, setFollowUp] = useState({
    type: 'call' as FollowUpType,
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    notes: '',
    duration: 30,
  })

  const calendarConnected = isCalendarConnected()

  // Check for action param to open add modal
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setShowAddModal(true)
    }
  }, [searchParams])

  // Update selected patient when state changes
  useEffect(() => {
    if (selectedPatient) {
      const updated = state.leads.find(l => l.id === selectedPatient.id)
      if (updated) {
        setSelectedPatient(updated)
      }
    }
  }, [state.leads, selectedPatient?.id])

  const filteredPatients = useMemo(() => {
    let patients = [...state.leads]

    if (statusFilter !== 'all') {
      patients = patients.filter(p => p.status === statusFilter)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      patients = patients.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.phone.includes(query) ||
        p.email?.toLowerCase().includes(query)
      )
    }

    return patients.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [state.leads, statusFilter, searchQuery])

  const handleAddPatient = () => {
    if (!newPatient.name || !newPatient.phone) return

    addLead({
      name: newPatient.name,
      phone: newPatient.phone,
      email: newPatient.email || undefined,
      source: newPatient.source,
      status: 'new',
      treatments: newPatient.treatments,
      assignedTo: state.user.id,
    })

    setNewPatient({ name: '', phone: '', email: '', source: 'instagram', treatments: [] })
    setShowAddModal(false)
  }

  const handleAddFollowUp = async () => {
    if (!selectedPatient) return
    setIsCreatingFollowUp(true)
    try {
      await addFollowUp(selectedPatient.id, {
        type: followUp.type,
        scheduledAt: new Date(followUp.scheduledAt),
        notes: followUp.notes,
        duration: followUp.duration,
      })
      setFollowUp({
        type: 'call',
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        notes: '',
        duration: 30,
      })
      setShowFollowUpModal(false)
    } catch (error) {
      console.error('Error creating follow-up:', error)
    } finally {
      setIsCreatingFollowUp(false)
    }
  }

  const handleAddNote = () => {
    if (!selectedPatient || !noteContent.trim()) return
    addNote(selectedPatient.id, noteContent)
    setNoteContent('')
    setShowNoteModal(false)
  }

  const handleDelete = () => {
    if (!selectedPatient) return
    deleteLead(selectedPatient.id)
    setSelectedPatient(null)
    setShowDeleteConfirm(false)
  }

  // Get timeline for selected patient
  const timeline = useMemo(() => {
    if (!selectedPatient) return []

    const items: Array<{
      id: string
      type: 'note' | 'followup'
      content: string
      date: Date
      completed?: boolean
      meetLink?: string
      followUpType?: string
    }> = []

    selectedPatient.notes.forEach(note => {
      items.push({
        id: note.id,
        type: 'note',
        content: note.content,
        date: new Date(note.createdAt),
      })
    })

    selectedPatient.followUps.forEach(fu => {
      items.push({
        id: fu.id,
        type: 'followup',
        content: `${fu.type === 'call' ? 'Llamada' : fu.type === 'message' ? 'Mensaje' : fu.type === 'email' ? 'Email' : 'Reunión'}${fu.notes ? `: ${fu.notes}` : ''}`,
        date: new Date(fu.scheduledAt),
        completed: fu.completed,
        meetLink: fu.meetLink,
        followUpType: fu.type,
      })
    })

    return items.sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [selectedPatient])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: state.leads.length }
    statusOptions.forEach(s => {
      counts[s.value] = state.leads.filter(l => l.status === s.value).length
    })
    return counts
  }, [state.leads])

  return (
    <AppShell>
      <div className="flex flex-col h-[calc(100vh-4rem)] lg:h-screen">
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-slate-200 px-4 py-4 lg:px-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Pacientes</h1>
              <p className="text-sm text-slate-500 hidden sm:block">
                {state.leads.length} pacientes en total
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary-500/25"
            >
              <UserPlus className="w-5 h-5" />
              <span className="hidden sm:inline">Nuevo Paciente</span>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar pacientes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-5 h-5" />}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => setStatusFilter('all')}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                  statusFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                Todos ({statusCounts.all})
              </button>
              {statusOptions.map(status => (
                <button
                  key={status.value}
                  onClick={() => setStatusFilter(status.value)}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                    statusFilter === status.value
                      ? `${status.bg} ${status.color}`
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  {status.label} ({statusCounts[status.value]})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Patient List */}
          <div className={cn(
            'flex-1 overflow-y-auto bg-slate-50',
            selectedPatient && 'hidden lg:block lg:w-96 lg:flex-none lg:border-r lg:border-slate-200'
          )}>
            {filteredPatients.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">
                  {searchQuery ? 'Sin resultados' : 'No hay pacientes'}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {searchQuery ? 'Intenta con otra búsqueda' : 'Agrega tu primer paciente para comenzar'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
                  >
                    Agregar Paciente
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {filteredPatients.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => setSelectedPatient(patient)}
                    className={cn(
                      'w-full flex items-center gap-3 p-4 text-left hover:bg-white transition-all',
                      selectedPatient?.id === patient.id && 'bg-white border-l-4 border-primary-500'
                    )}
                  >
                    <Avatar name={patient.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900 truncate">{patient.name}</p>
                        <Badge
                          variant={
                            patient.status === 'new' ? 'primary' :
                            patient.status === 'contacted' ? 'warning' :
                            patient.status === 'scheduled' ? 'default' :
                            patient.status === 'closed' ? 'success' : 'error'
                          }
                          size="sm"
                        >
                          {getStatusLabel(patient.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-sm text-slate-500">
                        {sourceIcons[patient.source]}
                        <span>{patient.phone}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 lg:hidden" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Patient Detail Panel */}
          {selectedPatient ? (
            <div className="flex-1 flex flex-col overflow-hidden bg-white">
              {/* Detail Header */}
              <div className="flex-shrink-0 p-4 lg:p-6 border-b border-slate-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setSelectedPatient(null)}
                      className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <Avatar name={selectedPatient.name} size="lg" />
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">{selectedPatient.name}</h2>
                      <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                        {sourceIcons[selectedPatient.source]}
                        <span>Vía {getSourceLabel(selectedPatient.source)}</span>
                        <span className="text-slate-300">•</span>
                        <span>{formatTimeAgo(new Date(selectedPatient.createdAt))}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-4 gap-2 mt-4">
                  <a
                    href={getPhoneUrl(selectedPatient.phone)}
                    className="flex flex-col items-center gap-1 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <Phone className="w-5 h-5 text-primary-600" />
                    <span className="text-xs text-slate-600">Llamar</span>
                  </a>
                  <a
                    href={getWhatsAppUrl(selectedPatient.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <MessageCircle className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs text-slate-600">WhatsApp</span>
                  </a>
                  {selectedPatient.email && (
                    <a
                      href={getEmailUrl(selectedPatient.email)}
                      className="flex flex-col items-center gap-1 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      <Mail className="w-5 h-5 text-amber-600" />
                      <span className="text-xs text-slate-600">Email</span>
                    </a>
                  )}
                  <button
                    onClick={() => setShowFollowUpModal(true)}
                    className="flex flex-col items-center gap-1 p-3 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors"
                  >
                    <Calendar className="w-5 h-5 text-primary-600" />
                    <span className="text-xs text-primary-700 font-medium">Agendar</span>
                  </button>
                </div>

                {/* Status Selector */}
                <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => updateLeadStatus(selectedPatient.id, option.value)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap',
                        selectedPatient.status === option.value
                          ? `${option.bg} ${option.color} ring-2 ring-offset-1 ring-current`
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact Info + Treatments */}
              <div className="flex-shrink-0 p-4 lg:p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Teléfono</p>
                    <p className="font-medium text-slate-900">{selectedPatient.phone}</p>
                  </div>
                  {selectedPatient.email && (
                    <div>
                      <p className="text-slate-500">Email</p>
                      <p className="font-medium text-slate-900 truncate">{selectedPatient.email}</p>
                    </div>
                  )}
                </div>
                {selectedPatient.treatments.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm text-slate-500 mb-1">Tratamientos de interés</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedPatient.treatments.map((t, i) => (
                        <Badge key={i} variant="outline" size="sm">{t}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div className="flex-1 overflow-y-auto p-4 lg:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900">Actividad</h3>
                  <button
                    onClick={() => setShowNoteModal(true)}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    + Agregar nota
                  </button>
                </div>

                {timeline.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p>No hay actividad todavía</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {timeline.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className={cn(
                              'w-8 h-8 rounded-full flex items-center justify-center',
                              item.type === 'note'
                                ? 'bg-slate-100'
                                : item.followUpType === 'meeting'
                                ? item.completed ? 'bg-emerald-100' : 'bg-purple-100'
                                : item.completed ? 'bg-emerald-100' : 'bg-primary-100'
                            )}
                          >
                            {item.type === 'note' ? (
                              <FileText className="w-4 h-4 text-slate-500" />
                            ) : item.completed ? (
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                            ) : item.followUpType === 'meeting' ? (
                              <Video className="w-4 h-4 text-purple-600" />
                            ) : (
                              <Clock className="w-4 h-4 text-primary-600" />
                            )}
                          </div>
                          <div className="flex-1 w-px bg-slate-200 mt-2" />
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="text-sm text-slate-800">{item.content}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {item.type === 'followup'
                              ? (item.completed ? 'Completado ' : 'Programado para ') +
                                formatRelativeDate(item.date)
                              : formatTimeAgo(item.date)}
                          </p>
                          {item.meetLink && (
                            <a
                              href={item.meetLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-medium rounded-lg transition-colors"
                            >
                              <Video className="w-3.5 h-3.5" />
                              Unirse a Google Meet
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="hidden lg:flex flex-1 items-center justify-center bg-slate-50">
              <div className="text-center">
                <div className="w-20 h-20 bg-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700">Selecciona un paciente</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Elige un paciente de la lista para ver sus detalles
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Patient Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Nuevo Paciente"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleAddPatient() }} className="space-y-4">
          <Input
            label="Nombre"
            placeholder="Nombre del paciente"
            value={newPatient.name}
            onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
            required
          />
          <Input
            label="Teléfono"
            placeholder="+52 55 1234 5678"
            type="tel"
            value={newPatient.phone}
            onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
            required
          />
          <Input
            label="Email (opcional)"
            placeholder="paciente@email.com"
            type="email"
            value={newPatient.email}
            onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
          />
          <Select
            label="Fuente"
            value={newPatient.source}
            onChange={(value) => setNewPatient({ ...newPatient, source: value as LeadSource })}
            options={[
              { value: 'instagram', label: 'Instagram' },
              { value: 'whatsapp', label: 'WhatsApp' },
              { value: 'phone', label: 'Teléfono' },
              { value: 'website', label: 'Sitio Web' },
              { value: 'referral', label: 'Referido' },
              { value: 'other', label: 'Otro' },
            ]}
          />
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" fullWidth onClick={() => setShowAddModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" fullWidth>
              Agregar Paciente
            </Button>
          </div>
        </form>
      </Modal>

      {/* Follow-up Modal */}
      <Modal
        isOpen={showFollowUpModal}
        onClose={() => setShowFollowUpModal(false)}
        title="Programar Seguimiento"
      >
        <div className="space-y-4">
          <Select
            label="Tipo"
            value={followUp.type}
            onChange={(value) => setFollowUp({ ...followUp, type: value as FollowUpType })}
            options={[
              { value: 'call', label: 'Llamada' },
              { value: 'message', label: 'Mensaje' },
              { value: 'email', label: 'Email' },
              { value: 'meeting', label: 'Reunión con videollamada' },
            ]}
          />

          {followUp.type === 'meeting' && (
            <div className={cn(
              'flex items-center gap-2 p-3 rounded-lg',
              calendarConnected ? 'bg-purple-50 border border-purple-200' : 'bg-slate-50 border border-slate-200'
            )}>
              <Video className={cn('w-5 h-5', calendarConnected ? 'text-purple-600' : 'text-slate-400')} />
              <div className="flex-1">
                <p className={cn('text-sm font-medium', calendarConnected ? 'text-purple-700' : 'text-slate-600')}>
                  {calendarConnected ? 'Se creará evento en Google Calendar' : 'Google Calendar no conectado'}
                </p>
                <p className="text-xs text-slate-500">
                  {calendarConnected
                    ? 'Se generará automáticamente un enlace de Google Meet'
                    : 'Conecta tu calendario en Configuración → Integraciones'
                  }
                </p>
              </div>
              {calendarConnected && <CheckCircle className="w-5 h-5 text-purple-600" />}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha y Hora</label>
            <input
              type="datetime-local"
              value={followUp.scheduledAt}
              onChange={(e) => setFollowUp({ ...followUp, scheduledAt: e.target.value })}
              className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {followUp.type === 'meeting' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Duración</label>
              <div className="flex gap-2">
                {[15, 30, 45, 60, 90].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setFollowUp({ ...followUp, duration: mins })}
                    className={cn(
                      'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors',
                      followUp.duration === mins
                        ? 'bg-primary-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Input
            label="Notas (opcional)"
            placeholder="Ej: Confirmar disponibilidad para consulta"
            value={followUp.notes}
            onChange={(e) => setFollowUp({ ...followUp, notes: e.target.value })}
          />

          <div className="flex gap-3 pt-2">
            <Button variant="outline" fullWidth onClick={() => setShowFollowUpModal(false)} disabled={isCreatingFollowUp}>
              Cancelar
            </Button>
            <Button fullWidth onClick={handleAddFollowUp} disabled={isCreatingFollowUp}>
              {isCreatingFollowUp ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {followUp.type === 'meeting' && calendarConnected ? 'Creando evento...' : 'Guardando...'}
                </span>
              ) : (
                followUp.type === 'meeting' && calendarConnected ? 'Crear con Google Meet' : 'Programar'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Note Modal */}
      <Modal
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        title="Agregar Nota"
      >
        <div className="space-y-4">
          <TextArea
            placeholder="Escribe una nota sobre este paciente..."
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            className="min-h-[120px]"
          />
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setShowNoteModal(false)}>
              Cancelar
            </Button>
            <Button fullWidth onClick={handleAddNote}>
              Guardar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Eliminar Paciente"
        size="sm"
      >
        <p className="text-slate-600 mb-6">
          ¿Estás seguro de que deseas eliminar a <strong>{selectedPatient?.name}</strong>? Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={() => setShowDeleteConfirm(false)}>
            Cancelar
          </Button>
          <Button variant="danger" fullWidth onClick={handleDelete}>
            Eliminar
          </Button>
        </div>
      </Modal>
    </AppShell>
  )
}
