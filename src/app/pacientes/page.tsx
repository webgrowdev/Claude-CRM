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
  MapPin,
} from 'lucide-react'
import { AppShell } from '@/components/layout'
import { Input, Card, Avatar, Badge, Modal, Button, Select, TextArea, TimeSlotPicker } from '@/components/ui'
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
import { LeadStatus, LeadSource, FollowUpType, Lead } from '@/types'

const getStatusOptions = (t: any): { value: LeadStatus; label: string; color: string; bg: string }[] => [
  { value: 'new', label: t.status.new, color: 'text-primary-600', bg: 'bg-primary-100' },
  { value: 'contacted', label: t.status.contacted, color: 'text-amber-600', bg: 'bg-amber-100' },
  { value: 'scheduled', label: t.status.scheduled, color: 'text-purple-600', bg: 'bg-purple-100' },
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

export default function PacientesPage() {
  const searchParams = useSearchParams()
  const { state, addLead, updateLeadStatus, addNote, addFollowUp, deleteLead, isCalendarConnected } = useApp()
  const { t } = useLanguage()

  // Get translated status options
  const statusOptions = useMemo(() => getStatusOptions(t), [t])

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
    state.leads.forEach(lead => {
      lead.followUps
        .filter(fu => fu.type === 'meeting' || fu.type === 'appointment')
        .forEach(fu => appointments.push(fu))
    })
    return appointments
  }, [state.leads])

  const calendarConnected = isCalendarConnected()

  // Check for URL params: action, id, or selected
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setShowAddModal(true)
    }

    // Handle patient selection from other pages (id or selected param)
    const patientId = searchParams.get('id') || searchParams.get('selected')
    if (patientId && state.leads.length > 0) {
      const patient = state.leads.find(l => l.id === patientId)
      if (patient) {
        setSelectedPatient(patient)
      }
    }
  }, [searchParams, state.leads])

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
        p.email?.toLowerCase().includes(query) ||
        p.identificationNumber?.toLowerCase().includes(query)
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
      })
    })

    return items.sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [selectedPatient, t])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: state.leads.length }
    statusOptions.forEach(s => {
      counts[s.value] = state.leads.filter(l => l.status === s.value).length
    })
    return counts
  }, [state.leads])

  return (
    <AppShell>
      <div className="flex flex-col h-[calc(100vh-4rem)] lg:h-screen overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-slate-200 px-4 py-4 lg:px-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-slate-900">{t.patients.title}</h1>
              <p className="text-sm text-slate-500 hidden sm:block">
                {state.leads.length} {t.patients.totalPatients}
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary-500/25"
            >
              <UserPlus className="w-5 h-5" />
              <span className="hidden sm:inline">{t.patients.newPatient}</span>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="flex-1">
              <Input
                placeholder={t.patients.searchPatients}
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
                {t.common.all} ({statusCounts.all})
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
                  {searchQuery ? t.common.noResults : t.patients.noPatients}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {searchQuery ? t.patients.searchPatients : t.patients.addFirstPatient}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
                  >
                    {t.patients.addPatient}
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
                      <p className="font-medium text-slate-900 truncate">{patient.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-sm text-slate-500">
                        {sourceIcons[patient.source]}
                        <span>{patient.phone}</span>
                      </div>
                      {patient.identificationNumber && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {t.appointments.idNumber}: {patient.identificationNumber}
                        </p>
                      )}
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
                        <span>{t.patients.via} {t.sources[selectedPatient.source]}</span>
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
                    <span className="text-xs text-slate-600">{t.actions.call}</span>
                  </a>
                  <a
                    href={getWhatsAppUrl(selectedPatient.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <MessageCircle className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs text-slate-600">{t.actions.whatsapp}</span>
                  </a>
                  {selectedPatient.email && (
                    <a
                      href={getEmailUrl(selectedPatient.email)}
                      className="flex flex-col items-center gap-1 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      <Mail className="w-5 h-5 text-amber-600" />
                      <span className="text-xs text-slate-600">{t.actions.email}</span>
                    </a>
                  )}
                  <button
                    onClick={() => setShowFollowUpModal(true)}
                    className="flex flex-col items-center gap-1 p-3 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors"
                  >
                    <Calendar className="w-5 h-5 text-primary-600" />
                    <span className="text-xs text-primary-700 font-medium">{t.actions.schedule}</span>
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
                    <p className="text-slate-500">{t.patientForm.phone}</p>
                    <p className="font-medium text-slate-900">{selectedPatient.phone}</p>
                  </div>
                  {selectedPatient.email && (
                    <div>
                      <p className="text-slate-500">{t.patientForm.email}</p>
                      <p className="font-medium text-slate-900 truncate">{selectedPatient.email}</p>
                    </div>
                  )}
                </div>
                {selectedPatient.treatments.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm text-slate-500 mb-1">{t.patients.treatmentsOfInterest}</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedPatient.treatments.map((treatment, i) => (
                        <Badge key={i} variant="outline" size="sm">{treatment}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div className="flex-1 overflow-y-auto p-4 lg:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900">{t.patients.activity}</h3>
                  <button
                    onClick={() => setShowNoteModal(true)}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    + {t.patients.addNote}
                  </button>
                </div>

                {timeline.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p>{t.patients.noActivity}</p>
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
                                : item.followUpType === 'appointment'
                                ? item.completed ? 'bg-emerald-100' : 'bg-teal-100'
                                : item.completed ? 'bg-emerald-100' : 'bg-primary-100'
                            )}
                          >
                            {item.type === 'note' ? (
                              <FileText className="w-4 h-4 text-slate-500" />
                            ) : item.completed ? (
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                            ) : item.followUpType === 'meeting' ? (
                              <Video className="w-4 h-4 text-purple-600" />
                            ) : item.followUpType === 'appointment' ? (
                              <MapPin className="w-4 h-4 text-teal-600" />
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
                              ? (item.completed ? `${t.followUp.completed} ` : `${t.followUp.scheduledFor} `) +
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
                              {t.calendar.joinMeet}
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
                <h3 className="text-lg font-semibold text-slate-700">{t.patients.selectPatient}</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {t.patients.selectPatientDesc}
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
            <div className={cn(
              'flex items-center gap-2 p-3 rounded-lg',
              calendarConnected ? 'bg-purple-50 border border-purple-200' : 'bg-slate-50 border border-slate-200'
            )}>
              <Video className={cn('w-5 h-5', calendarConnected ? 'text-purple-600' : 'text-slate-400')} />
              <div className="flex-1">
                <p className={cn('text-sm font-medium', calendarConnected ? 'text-purple-700' : 'text-slate-600')}>
                  {calendarConnected ? t.followUp.calendarConnected : t.followUp.calendarNotConnected}
                </p>
                <p className="text-xs text-slate-500">
                  {calendarConnected
                    ? t.followUp.meetLinkAuto
                    : t.followUp.connectCalendar
                  }
                </p>
              </div>
              {calendarConnected && <CheckCircle className="w-5 h-5 text-purple-600" />}
            </div>
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
              onChange={(value) => setFollowUp({ ...followUp, treatmentId: value })}
              options={[
                { value: '', label: t.followUp.noTreatmentSelected },
                ...state.treatments.map(treatment => ({
                  value: treatment.id,
                  label: `${treatment.name} - $${treatment.price.toLocaleString()}`,
                })),
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
            <Button fullWidth onClick={handleAddFollowUp} disabled={isCreatingFollowUp}>
              {isCreatingFollowUp ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {followUp.type === 'meeting' && calendarConnected ? t.followUp.creatingEvent : t.followUp.saving}
                </span>
              ) : (
                followUp.type === 'meeting' && calendarConnected ? t.followUp.createWithMeet : t.followUp.schedule
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
