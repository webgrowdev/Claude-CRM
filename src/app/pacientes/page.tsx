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
  ChevronRight,
  Loader2,
  Trash2,
  UserPlus,
  MapPin,
  Filter,
  SlidersHorizontal,
  ArrowLeft,
  Syringe,
  CreditCard,
  Settings,
  UserX,
  LayoutList,
  LayoutGrid,
} from 'lucide-react'
import { AppShell } from '@/components/layout'
import { Input, Card, Avatar, Badge, Modal, Button, Select, TextArea, TimeSlotPicker } from '@/components/ui'
import { KanbanView } from '@/components/patients/KanbanView'
import { useApp } from '@/contexts/AppContext'
import { useLanguage } from '@/i18n/LanguageContext'
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
import { FunnelStatus, LeadSource, FollowUpType, Patient } from '@/types'

const getStatusOptions = (t: any): { value: FunnelStatus; label: string; color: string; bg: string }[] => [
  { value: 'new', label: t.status.new, color: 'text-primary-600', bg: 'bg-primary-100' },
  { value: 'contacted', label: t.status.contacted, color: 'text-amber-600', bg: 'bg-amber-100' },
  { value: 'appointment', label: t.status.scheduled, color: 'text-purple-600', bg: 'bg-purple-100' },
  { value: 'closed', label: t.status.closed, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  { value: 'lost', label: t.status.lost, color: 'text-red-600', bg: 'bg-red-100' },
]

const sourceIcons: Record<LeadSource, React.ReactNode> = {
  instagram: <Instagram className="w-4 h-4" />,
  whatsapp: <MessageCircle className="w-4 h-4" />,
  phone: <Phone className="w-4 h-4" />,
  website: <Globe className="w-4 h-4" />,
  referral: <Users className="w-4 h-4" />,
  other: <HelpCircle className="w-4 h-4" />,
}

const sourceColors: Record<LeadSource, string> = {
  instagram: 'text-pink-500 bg-pink-50',
  whatsapp: 'text-green-500 bg-green-50',
  phone: 'text-blue-500 bg-blue-50',
  website: 'text-purple-500 bg-purple-50',
  referral: 'text-amber-500 bg-amber-50',
  other: 'text-slate-500 bg-slate-50',
}

export default function PacientesPage() {
  const searchParams = useSearchParams()
  const { state, addPatient, updatePatientStatus, addNote, addFollowUp, deletePatient, isCalendarConnected, getDerivedPatientStatus, getPatientAppointmentCounts } = useApp()
  const { t, language } = useLanguage()

  // Get translated status options
  const statusOptions = useMemo(() => getStatusOptions(t), [t])

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'completed' | 'in-treatment' | 'lost'>('all')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showFollowUpModal, setShowFollowUpModal] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isCreatingFollowUp, setIsCreatingFollowUp] = useState(false)
  const [noteContent, setNoteContent] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  // View mode state
  type ViewMode = 'list' | 'kanban'
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  // New patient form
  const [newPatient, setNewPatient] = useState({
    name: '',
    phone: '',
    email: '',
    identificationNumber: '',
    source: 'instagram' as LeadSource,
    treatments: [] as string[],
  })

  // Follow-up form
  const [followUp, setFollowUp] = useState({
    type: 'call' as FollowUpType,
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    notes: '',
    duration: 30,
    treatmentId: '' as string,
  })
  const [selectedSlotDate, setSelectedSlotDate] = useState<Date | null>(null)
  const [selectedSlotTime, setSelectedSlotTime] = useState<string | null>(null)

  // Get all existing appointments for conflict checking
  const allAppointments = useMemo(() => {
    const appointments: any[] = []
    state.patients.forEach(patient => {
      patient.followUps
        .filter(fu => fu.type === 'meeting' || fu.type === 'appointment')
        .forEach(fu => appointments.push(fu))
    })
    return appointments
  }, [state.patients])

  const calendarConnected = isCalendarConnected()

  // Check for URL params: action, id, or selected
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setShowAddModal(true)
    }

    // Handle view mode from URL
    const viewParam = searchParams.get('view')
    if (viewParam === 'kanban') {
      setViewMode('kanban')
    }

    // Handle patient selection from other pages (id or selected param)
    const patientId = searchParams.get('id') || searchParams.get('selected')
    if (patientId && state.patients.length > 0) {
      const patient = state.patients.find(p => p.id === patientId)
      if (patient) {
        setSelectedPatient(patient)
      }
    }
  }, [searchParams, state.patients])

  // Update selected patient when state changes
  useEffect(() => {
    if (selectedPatient) {
      const updated = state.patients.find(p => p.id === selectedPatient.id)
      if (updated) {
        setSelectedPatient(updated)
      }
    }
  }, [state.patients, selectedPatient?.id])

  const filteredPatients = useMemo(() => {
    let patients = [...state.patients]

    if (statusFilter !== 'all') {
      patients = patients.filter(p => {
        const counts = getPatientAppointmentCounts(p.id)
        const derivedStatus = getDerivedPatientStatus(p.id)
        
        switch (statusFilter) {
          case 'scheduled':
            // Has pending or confirmed appointments
            return counts.pending > 0 || counts.confirmed > 0
          case 'completed':
            // Has completed appointments
            return counts.completed > 0
          case 'in-treatment':
            // Has recent completed appointments + pending/confirmed ones
            return derivedStatus === 'active' || derivedStatus === 'scheduled'
          case 'lost':
            // Only no-show or cancelled appointments, or derived as lost
            return derivedStatus === 'lost'
          default:
            return true
        }
      })
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      patients = patients.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.phone.includes(query) ||
        p.email?.toLowerCase().includes(query) ||
        p.identificationNumber?.toLowerCase().includes(query)
      )
    }

    return patients.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [state.patients, statusFilter, searchQuery, getDerivedPatientStatus, getPatientAppointmentCounts])

  const handleAddPatient = () => {
    if (!newPatient.name || !newPatient.phone) return

    addPatient({
      name: newPatient.name,
      phone: newPatient.phone,
      email: newPatient.email || undefined,
      identificationNumber: newPatient.identificationNumber || undefined,
      source: newPatient.source,
      status: 'new',
      treatments: newPatient.treatments,
      assignedTo: state.user.id,
    })

    setNewPatient({ name: '', phone: '', email: '', identificationNumber: '', source: 'instagram', treatments: [] })
    setShowAddModal(false)
  }

  const handleAddFollowUp = async () => {
    if (!selectedPatient) return

    // For meetings and appointments, use the slot picker date/time
    let scheduledDate: Date
    if ((followUp.type === 'meeting' || followUp.type === 'appointment') && selectedSlotDate && selectedSlotTime) {
      const [hours, minutes] = selectedSlotTime.split(':').map(Number)
      scheduledDate = new Date(selectedSlotDate)
      scheduledDate.setHours(hours, minutes, 0, 0)
    } else {
      scheduledDate = new Date(followUp.scheduledAt)
    }

    setIsCreatingFollowUp(true)
    try {
      // Get treatment name if selected
      const selectedTreatment = followUp.treatmentId
        ? state.treatments.find(t => t.id === followUp.treatmentId)
        : null

      await addFollowUp(selectedPatient.id, {
        type: followUp.type,
        scheduledAt: scheduledDate,
        notes: followUp.notes,
        duration: followUp.duration,
        treatmentId: followUp.treatmentId || undefined,
        treatmentName: selectedTreatment?.name,
      })
      setFollowUp({
        type: 'call',
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        notes: '',
        duration: 30,
        treatmentId: '',
      })
      setSelectedSlotDate(null)
      setSelectedSlotTime(null)
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
    deletePatient(selectedPatient.id)
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
      appointmentStatus?: string
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
      const typeLabel = fu.type === 'call' ? t.followUp.typeCall :
                        fu.type === 'message' ? t.followUp.typeMessage :
                        fu.type === 'email' ? t.followUp.typeEmail :
                        fu.type === 'appointment' ? t.followUp.typeAppointment :
                        t.followUp.typeMeeting
      const treatmentInfo = fu.treatmentName ? ` (${fu.treatmentName})` : ''
      items.push({
        id: fu.id,
        type: 'followup',
        content: `${typeLabel}${treatmentInfo}${fu.notes ? `: ${fu.notes}` : ''}`,
        date: new Date(fu.scheduledAt),
        completed: fu.completed,
        meetLink: fu.meetLink,
        followUpType: fu.type,
        appointmentStatus: fu.appointmentStatus,
      })
    })

    return items.sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [selectedPatient, t])

  const statusCounts = useMemo(() => {
    const counts = {
      all: state.patients.length,
      scheduled: 0,
      completed: 0,
      'in-treatment': 0,
      lost: 0,
    }
    
    state.patients.forEach(patient => {
      const appointmentCounts = getPatientAppointmentCounts(patient.id)
      const derivedStatus = getDerivedPatientStatus(patient.id)
      
      if (appointmentCounts.pending > 0 || appointmentCounts.confirmed > 0) {
        counts.scheduled++
      }
      if (appointmentCounts.completed > 0) {
        counts.completed++
      }
      if (derivedStatus === 'active' || derivedStatus === 'scheduled') {
        counts['in-treatment']++
      }
      if (derivedStatus === 'lost') {
        counts.lost++
      }
    })
    
    return counts
  }, [state.patients, getDerivedPatientStatus, getPatientAppointmentCounts])

  // Get status info for display (deprecated - use derived status)
  const getStatusInfo = (status: FunnelStatus) => {
    const option = statusOptions.find(s => s.value === status)
    return option || { label: status, color: 'text-slate-600', bg: 'bg-slate-100' }
  }

  return (
    <AppShell>
      <div className="flex flex-col h-[calc(100vh-4rem)] lg:h-screen overflow-hidden bg-slate-50">
        {/* Header - Clean and Minimal */}
        <div className="flex-shrink-0 bg-white border-b border-slate-200">
          <div className="px-4 py-4 lg:px-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-slate-900">{t.patients.title}</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  {state.patients.length} {t.patients.totalPatients}
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary-500/25"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">{t.patients.newPatient}</span>
              </button>
            </div>
          </div>

          {/* Search and Filters - Improved */}
          <div className="px-4 pb-4 lg:px-6">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={t.patients.searchPatients}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white transition-all"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "px-4 py-2.5 rounded-xl border transition-all flex items-center gap-2",
                  showFilters
                    ? "bg-primary-50 border-primary-200 text-primary-700"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">{language === 'es' ? 'Filtros' : 'Filters'}</span>
              </button>
            </div>

            {/* Filter Pills - Animated */}
            {showFilters && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide animate-slide-down">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
                    statusFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-lg'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                  )}
                >
                  {t.common.all} ({statusCounts.all})
                </button>
                <button
                  onClick={() => setStatusFilter('scheduled')}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1',
                    statusFilter === 'scheduled'
                      ? 'bg-purple-100 text-purple-700 shadow-md'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                  )}
                >
                  <Calendar className="w-4 h-4" />
                  {language === 'es' ? 'Citas agendadas' : 'Scheduled appointments'} ({statusCounts.scheduled})
                </button>
                <button
                  onClick={() => setStatusFilter('completed')}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1',
                    statusFilter === 'completed'
                      ? 'bg-green-100 text-green-700 shadow-md'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                  )}
                >
                  <CheckCircle className="w-4 h-4" />
                  {language === 'es' ? 'Citas completadas' : 'Completed appointments'} ({statusCounts.completed})
                </button>
                <button
                  onClick={() => setStatusFilter('in-treatment')}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1',
                    statusFilter === 'in-treatment'
                      ? 'bg-blue-100 text-blue-700 shadow-md'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                  )}
                >
                  <Clock className="w-4 h-4" />
                  {language === 'es' ? 'En tratamiento' : 'In treatment'} ({statusCounts['in-treatment']})
                </button>
                <button
                  onClick={() => setStatusFilter('lost')}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1',
                    statusFilter === 'lost'
                      ? 'bg-red-100 text-red-700 shadow-md'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                  )}
                >
                  <UserX className="w-4 h-4" />
                  {language === 'es' ? 'Citas perdidas' : 'Lost appointments'} ({statusCounts.lost})
                </button>
              </div>
            )}

            {/* View Toggle Buttons */}
            <div className="flex gap-2 mt-3">
              <Button
                variant={viewMode === 'list' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="flex items-center gap-2"
              >
                <LayoutList className="w-4 h-4" />
                {language === 'es' ? 'Lista' : 'List'}
              </Button>
              <Button
                variant={viewMode === 'kanban' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('kanban')}
                className="flex items-center gap-2"
              >
                <LayoutGrid className="w-4 h-4" />
                {language === 'es' ? 'Kanban' : 'Kanban'}
              </Button>
            </div>
          </div>
        </div>

        {/* Content - Improved Layout */}
        <div className="flex-1 flex overflow-hidden">
          {viewMode === 'list' ? (
            <>
              {/* Patient List - Better Cards */}
              <div className={cn(
                'flex-1 overflow-y-auto',
                selectedPatient && 'hidden lg:block lg:w-[400px] lg:flex-none lg:border-r lg:border-slate-200 lg:bg-white'
              )}>
            {filteredPatients.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <Users className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">
                  {searchQuery ? t.common.noResults : t.patients.noPatients}
                </h3>
                <p className="text-sm text-slate-500 mt-1 max-w-xs">
                  {searchQuery ? t.patients.searchPatients : t.patients.addFirstPatient}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-6 px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/25"
                  >
                    {t.patients.addPatient}
                  </button>
                )}
              </div>
            ) : (
              <div className="p-3 lg:p-4 space-y-2">
                {filteredPatients.map((patient) => {
                  const derivedStatus = getDerivedPatientStatus(patient.id)
                  const appointmentCounts = getPatientAppointmentCounts(patient.id)
                  const isSelected = selectedPatient?.id === patient.id

                  // Get appointments for status badges
                  const appointments = patient.followUps.filter(f => 
                    f.type === 'appointment' || f.type === 'meeting'
                  )

                  return (
                    <button
                      key={patient.id}
                      onClick={() => setSelectedPatient(patient)}
                      className={cn(
                        'w-full p-4 rounded-xl text-left transition-all',
                        isSelected
                          ? 'bg-primary-50 border-2 border-primary-200 shadow-md'
                          : 'bg-white border border-slate-100 hover:border-slate-200 hover:shadow-md'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar name={patient.name} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-slate-900 truncate">{patient.name}</p>
                            
                            {/* Show appointment status badges instead of global status */}
                            {appointmentCounts.total > 0 ? (
                              <div className="flex items-center gap-1 flex-wrap">
                                {appointmentCounts.pending > 0 && (
                                  <Badge variant="warning" size="sm">
                                    📅 {appointmentCounts.pending}
                                  </Badge>
                                )}
                                {appointmentCounts.confirmed > 0 && (
                                  <Badge variant="success" size="sm">
                                    ✅ {appointmentCounts.confirmed}
                                  </Badge>
                                )}
                                {appointmentCounts.completed > 0 && (
                                  <Badge variant="default" size="sm">
                                    ✓ {appointmentCounts.completed}
                                  </Badge>
                                )}
                                {appointmentCounts.noShow > 0 && (
                                  <Badge variant="error" size="sm">
                                    ❌ {appointmentCounts.noShow}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className={cn(
                                'px-2 py-0.5 rounded-full text-xs font-medium',
                                'bg-primary-100 text-primary-600'
                              )}>
                                {language === 'es' ? 'Nuevo' : 'New'}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-1">
                            <span className={cn(
                              'p-1 rounded',
                              sourceColors[patient.source]
                            )}>
                              {sourceIcons[patient.source]}
                            </span>
                            <span className="text-sm text-slate-500">{patient.phone}</span>
                          </div>

                          {/* Show appointment counts */}
                          {appointmentCounts.total > 0 && (
                            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
                              {appointmentCounts.pending > 0 && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {appointmentCounts.pending} {language === 'es' ? 'pendiente(s)' : 'pending'}
                                </span>
                              )}
                              {appointmentCounts.completed > 0 && (
                                <span className="flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  {appointmentCounts.completed} {language === 'es' ? 'completada(s)' : 'completed'}
                                </span>
                              )}
                            </div>
                          )}

                          {patient.identificationNumber && (
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <CreditCard className="w-3 h-3 text-slate-400" />
                              <span className="text-xs text-slate-400">
                                {t.appointments.idNumber}: {patient.identificationNumber}
                              </span>
                            </div>
                          )}

                          {patient.treatments.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                              <Syringe className="w-3 h-3 text-slate-400" />
                              {patient.treatments.slice(0, 2).map((treatment, i) => (
                                <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                                  {treatment}
                                </span>
                              ))}
                              {patient.treatments.length > 2 && (
                                <span className="text-xs text-slate-400">
                                  +{patient.treatments.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <ChevronRight className={cn(
                          "w-5 h-5 text-slate-300 transition-transform lg:hidden",
                          isSelected && "text-primary-500"
                        )} />
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Patient Detail Panel - Redesigned */}
          {selectedPatient ? (
            <div className="flex-1 flex flex-col overflow-hidden bg-white">
              {/* Detail Header - Cleaner */}
              <div className="flex-shrink-0 border-b border-slate-100">
                <div className="p-4 lg:p-6">
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => setSelectedPatient(null)}
                      className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>

                    <Avatar name={selectedPatient.name} size="xl" />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h2 className="text-xl font-bold text-slate-900">{selectedPatient.name}</h2>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={cn('p-1.5 rounded-lg', sourceColors[selectedPatient.source])}>
                              {sourceIcons[selectedPatient.source]}
                            </span>
                            <span className="text-sm text-slate-500">
                              {t.patients.via} {t.sources[selectedPatient.source]}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-sm text-slate-500">{formatTimeAgo(new Date(selectedPatient.createdAt))}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions - Redesigned */}
                  <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
                    <a
                      href={getPhoneUrl(selectedPatient.phone)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-colors font-medium text-sm"
                    >
                      <Phone className="w-4 h-4" />
                      {t.actions.call}
                    </a>
                    <a
                      href={getWhatsAppUrl(selectedPatient.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl transition-colors font-medium text-sm"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {t.actions.whatsapp}
                    </a>
                    {selectedPatient.email && (
                      <a
                        href={getEmailUrl(selectedPatient.email)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl transition-colors font-medium text-sm"
                      >
                        <Mail className="w-4 h-4" />
                        {t.actions.email}
                      </a>
                    )}
                    <button
                      onClick={() => setShowFollowUpModal(true)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors font-medium text-sm shadow-lg shadow-primary-500/25"
                    >
                      <Calendar className="w-4 h-4" />
                      {t.actions.schedule}
                    </button>
                  </div>

                  {/* Status Selector - Improved */}
                  <div className="mt-4 p-3 bg-slate-50 rounded-xl">
                    <p className="text-xs font-medium text-slate-500 mb-2">{language === 'es' ? 'Estado del paciente' : 'Patient status'}</p>
                    <div className="flex gap-2 flex-wrap">
                      {statusOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => updatePatientStatus(selectedPatient.id, option.value)}
                          className={cn(
                            'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                            selectedPatient.status === option.value
                              ? `${option.bg} ${option.color} ring-2 ring-offset-1 ring-current`
                              : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Info Card */}
              <div className="flex-shrink-0 p-4 lg:px-6 lg:py-4 border-b border-slate-100">
                <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-slate-800 mb-3">{t.patients.contactInfo}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500 text-xs mb-0.5">{t.patientForm.phone}</p>
                      <p className="font-medium text-slate-900">{selectedPatient.phone}</p>
                    </div>
                    {selectedPatient.email && (
                      <div>
                        <p className="text-slate-500 text-xs mb-0.5">{t.patientForm.email}</p>
                        <p className="font-medium text-slate-900 truncate">{selectedPatient.email}</p>
                      </div>
                    )}
                    {selectedPatient.identificationNumber && (
                      <div>
                        <p className="text-slate-500 text-xs mb-0.5">{t.patientForm.identificationNumber}</p>
                        <p className="font-medium text-slate-900">{selectedPatient.identificationNumber}</p>
                      </div>
                    )}
                  </div>

                  {selectedPatient.treatments.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-200">
                      <p className="text-slate-500 text-xs mb-2">{t.patients.treatmentsOfInterest}</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedPatient.treatments.map((treatment, i) => (
                          <span key={i} className="px-3 py-1 bg-white text-slate-700 text-sm rounded-lg border border-slate-200">
                            {treatment}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Timeline - Improved */}
              <div className="flex-1 overflow-y-auto p-5 lg:p-8">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-slate-900">{t.patients.activity}</h3>
                    <button
                      onClick={() => setShowNoteModal(true)}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      {t.patients.addNote}
                    </button>
                  </div>
                  <p className="text-sm text-slate-500">
                    {t.patients.activitySubtitle}
                  </p>
                </div>

                {timeline.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-500">{t.patients.noActivity}</p>
                  </div>
                ) : (
                  <div className="space-y-4 relative">
                    {/* Vertical connecting line - positioned to align with icon centers (left-5 = 1.25rem) */}
                    <div className="absolute left-5 top-8 bottom-0 w-px bg-slate-200" />
                    
                    {timeline.map((item, index) => (
                      <div key={item.id} className="relative">
                        <div
                          className={cn(
                            "p-5 rounded-xl border shadow-sm transition-all",
                            item.type === 'note'
                              ? 'bg-slate-50 border-slate-200'
                              : item.completed
                              ? 'bg-green-50 border-green-200'
                              : item.followUpType === 'meeting'
                              ? 'bg-purple-50 border-purple-200'
                              : item.followUpType === 'appointment'
                              ? 'bg-teal-50 border-teal-200'
                              : 'bg-blue-50 border-blue-200'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              'p-2.5 rounded-lg relative z-10 bg-white border-2',
                              item.type === 'note'
                                ? 'border-slate-300 text-slate-600'
                                : item.completed
                                ? 'border-green-300 text-green-700'
                                : item.followUpType === 'meeting'
                                ? 'border-purple-300 text-purple-700'
                                : item.followUpType === 'appointment'
                                ? 'border-teal-300 text-teal-700'
                                : 'border-blue-300 text-blue-700'
                            )}>
                              {item.type === 'note' ? (
                                <FileText className="w-5 h-5" />
                              ) : item.completed ? (
                                <CheckCircle className="w-5 h-5" />
                              ) : item.followUpType === 'meeting' ? (
                                <Video className="w-5 h-5" />
                              ) : item.followUpType === 'appointment' ? (
                                <MapPin className="w-5 h-5" />
                              ) : (
                                <Clock className="w-5 h-5" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <p className="text-base text-slate-800 font-medium">{item.content}</p>
                                {/* Show appointment status badge for appointments/meetings */}
                                {item.type === 'followup' && (item.followUpType === 'appointment' || item.followUpType === 'meeting') && item.appointmentStatus && (
                                  <Badge 
                                    variant={
                                      item.appointmentStatus === 'confirmed' ? 'success' :
                                      item.appointmentStatus === 'completed' ? 'default' :
                                      item.appointmentStatus === 'no-show' ? 'error' :
                                      item.appointmentStatus === 'cancelled' ? 'secondary' :
                                      'warning'
                                    }
                                    size="md"
                                  >
                                    {item.appointmentStatus === 'pending' ? '📅 Pendiente' :
                                     item.appointmentStatus === 'confirmed' ? '✅ Confirmada' :
                                     item.appointmentStatus === 'completed' ? '✓ Completada' :
                                     item.appointmentStatus === 'no-show' ? '❌ No asistió' :
                                     item.appointmentStatus === 'cancelled' ? '🚫 Cancelada' :
                                     item.appointmentStatus}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-slate-500 mt-1.5">
                                {item.type === 'followup'
                                  ? (item.completed ? `${t.followUp.completed} ` : `${t.followUp.scheduledFor} `) +
                                    formatRelativeDate(item.date)
                                  : formatTimeAgo(item.date)}
                              </p>

                              {item.meetLink && (
                                <a
                                  href={item.meetLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm hover:shadow-md"
                                >
                                  <Video className="w-4 h-4" />
                                  {t.calendar.joinMeet}
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
              <div className="text-center max-w-sm">
                <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <UserPlus className="w-12 h-12 text-slate-300" />
                </div>
                <h3 className="text-xl font-semibold text-slate-700">{t.patients.selectPatient}</h3>
                <p className="text-sm text-slate-500 mt-2">
                  {t.patients.selectPatientDesc}
                </p>
              </div>
            </div>
          )}
            </>
          ) : (
            <KanbanView 
              patients={filteredPatients}
              onPatientClick={(patient) => {
                setSelectedPatient(patient)
              }}
            />
          )}
        </div>
      </div>

      {/* Add Patient Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={t.patients.newPatient}
      >
        <form onSubmit={(e) => { e.preventDefault(); handleAddPatient() }} className="space-y-4">
          <Input
            label={t.patientForm.name}
            placeholder={t.patientForm.namePlaceholder}
            value={newPatient.name}
            onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
            required
          />
          <Input
            label={t.patientForm.phone}
            placeholder={t.patientForm.phonePlaceholder}
            type="tel"
            value={newPatient.phone}
            onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
            required
          />
          <Input
            label={`${t.patientForm.email} (${t.common.optional})`}
            placeholder={t.patientForm.emailPlaceholder}
            type="email"
            value={newPatient.email}
            onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
          />
          <Input
            label={`${t.patientForm.identificationNumber} (${t.common.optional})`}
            placeholder={t.patientForm.identificationPlaceholder}
            value={newPatient.identificationNumber}
            onChange={(e) => setNewPatient({ ...newPatient, identificationNumber: e.target.value })}
          />
          <Select
            label={t.patientForm.source}
            value={newPatient.source}
            onChange={(value) => setNewPatient({ ...newPatient, source: value as LeadSource })}
            options={[
              { value: 'instagram', label: t.sources.instagram },
              { value: 'whatsapp', label: t.sources.whatsapp },
              { value: 'phone', label: t.sources.phone },
              { value: 'website', label: t.sources.website },
              { value: 'referral', label: t.sources.referral },
              { value: 'other', label: t.sources.other },
            ]}
          />
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" fullWidth onClick={() => setShowAddModal(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" fullWidth>
              {t.patients.addPatient}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Follow-up Modal */}
      <Modal
        isOpen={showFollowUpModal}
        onClose={() => setShowFollowUpModal(false)}
        title={t.followUp.title}
        size="lg"
      >
        <div className="space-y-4">
          <Select
            label={t.followUp.type}
            value={followUp.type}
            onChange={(value) => setFollowUp({ ...followUp, type: value as FollowUpType })}
            options={[
              { value: 'call', label: t.followUp.typeCall },
              { value: 'message', label: t.followUp.typeMessage },
              { value: 'email', label: t.followUp.typeEmail },
              { value: 'meeting', label: t.followUp.typeMeeting },
              { value: 'appointment', label: t.followUp.typeAppointment },
            ]}
          />

          {followUp.type === 'meeting' && (
            calendarConnected ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-purple-50 border border-purple-200">
                <Video className="w-5 h-5 text-purple-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-purple-700">
                    {t.followUp.calendarConnected}
                  </p>
                  <p className="text-xs text-slate-500">
                    {t.followUp.meetLinkAuto}
                  </p>
                </div>
                <CheckCircle className="w-5 h-5 text-purple-600" />
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <Video className="w-5 h-5 text-red-500" />
                  <p className="text-sm font-semibold text-red-700">
                    {language === 'es' ? 'Google Calendar requerido' : 'Google Calendar required'}
                  </p>
                </div>
                <p className="text-xs text-red-600 mb-3">
                  {language === 'es'
                    ? 'Para agendar videollamadas necesitas conectar tu Google Calendar. Esto permite crear eventos automáticamente y generar enlaces de Google Meet.'
                    : 'To schedule video calls you need to connect your Google Calendar. This allows automatic event creation and Google Meet link generation.'}
                </p>
                <a
                  href="/settings/integrations"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  {language === 'es' ? 'Conectar Google Calendar' : 'Connect Google Calendar'}
                </a>
              </div>
            )
          )}

          {followUp.type === 'appointment' && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-teal-50 border border-teal-200">
              <MapPin className="w-5 h-5 text-teal-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-teal-700">
                  {t.followUp.inPersonAppointment}
                </p>
                <p className="text-xs text-slate-500">
                  {t.followUp.appointmentInfo}
                </p>
              </div>
              <CheckCircle className="w-5 h-5 text-teal-600" />
            </div>
          )}

          {/* Treatment selection for ALL follow-up types */}
          {state.treatments.length > 0 && (
            <Select
              label={t.followUp.selectTreatment}
              value={followUp.treatmentId}
              onChange={(value) => {
                const selectedTreatment = state.treatments.find(tr => tr.id === value)
                // Use the appropriate duration based on follow-up type
                let duration = followUp.duration
                if (selectedTreatment) {
                  if (followUp.type === 'appointment') {
                    duration = selectedTreatment.inPersonDuration || selectedTreatment.duration
                  } else if (followUp.type === 'meeting') {
                    duration = selectedTreatment.videocallDuration || selectedTreatment.duration
                  } else {
                    duration = selectedTreatment.duration
                  }
                }
                setFollowUp({
                  ...followUp,
                  treatmentId: value,
                  duration: duration,
                })
              }}
              options={[
                { value: '', label: t.followUp.noTreatmentSelected },
                ...state.treatments.map(treatment => {
                  // Show the appropriate duration based on follow-up type
                  const displayDuration = followUp.type === 'appointment'
                    ? (treatment.inPersonDuration || treatment.duration)
                    : followUp.type === 'meeting'
                    ? (treatment.videocallDuration || treatment.duration)
                    : treatment.duration
                  return {
                    value: treatment.id,
                    label: `${treatment.name} (${displayDuration} min) - $${treatment.price.toLocaleString()}`,
                  }
                }),
              ]}
            />
          )}

          {/* Duration selector for meetings and appointments */}
          {(followUp.type === 'meeting' || followUp.type === 'appointment') && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.followUp.duration}</label>
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

          {/* Time Slot Picker for meetings and appointments */}
          {(followUp.type === 'meeting' || followUp.type === 'appointment') ? (
            // Only show slot picker if it's an appointment OR if it's a meeting with calendar connected
            (followUp.type === 'appointment' || calendarConnected) ? (
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <label className="block text-sm font-medium text-slate-700 mb-3">{t.followUp.dateTime}</label>
                <TimeSlotPicker
                  selectedDate={selectedSlotDate}
                  selectedTime={selectedSlotTime}
                  onSelectDateTime={(date, time) => {
                    setSelectedSlotDate(date)
                    setSelectedSlotTime(time)
                  }}
                  existingAppointments={allAppointments}
                  duration={followUp.duration}
                />
                {selectedSlotDate && selectedSlotTime && (
                  <div className="mt-3 p-2 bg-primary-50 border border-primary-200 rounded-lg text-center">
                    <p className="text-sm font-medium text-primary-700">
                      {selectedSlotDate.toLocaleDateString()} - {selectedSlotTime}
                    </p>
                  </div>
                )}
              </div>
            ) : null
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.followUp.dateTime}</label>
              <input
                type="datetime-local"
                value={followUp.scheduledAt}
                onChange={(e) => setFollowUp({ ...followUp, scheduledAt: e.target.value })}
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}

          <Input
            label={`${t.followUp.notes} (${t.common.optional})`}
            placeholder={t.followUp.notesPlaceholder}
            value={followUp.notes}
            onChange={(e) => setFollowUp({ ...followUp, notes: e.target.value })}
          />

          <div className="flex gap-3 pt-2">
            <Button variant="outline" fullWidth onClick={() => setShowFollowUpModal(false)} disabled={isCreatingFollowUp}>
              {t.common.cancel}
            </Button>
            <Button
              fullWidth
              onClick={handleAddFollowUp}
              disabled={isCreatingFollowUp || (followUp.type === 'meeting' && !calendarConnected)}
            >
              {isCreatingFollowUp ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {followUp.type === 'meeting' ? t.followUp.creatingEvent : t.followUp.saving}
                </span>
              ) : (
                followUp.type === 'meeting' ? t.followUp.createWithMeet : t.followUp.schedule
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Note Modal */}
      <Modal
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        title={t.notes.title}
      >
        <div className="space-y-4">
          <TextArea
            placeholder={t.notes.placeholder}
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            className="min-h-[120px]"
          />
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setShowNoteModal(false)}>
              {t.common.cancel}
            </Button>
            <Button fullWidth onClick={handleAddNote}>
              {t.common.save}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title={t.patients.deletePatient}
        size="sm"
      >
        <p className="text-slate-600 mb-6">
          {t.patients.deleteConfirm} <strong>{selectedPatient?.name}</strong>? {t.patients.deleteWarning}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={() => setShowDeleteConfirm(false)}>
            {t.common.cancel}
          </Button>
          <Button variant="danger" fullWidth onClick={handleDelete}>
            {t.common.delete}
          </Button>
        </div>
      </Modal>
    </AppShell>
  )
}
