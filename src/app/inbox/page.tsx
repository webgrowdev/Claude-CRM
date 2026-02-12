'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Filter,
  Phone,
  MessageCircle,
  Mail,
  Calendar,
  Clock,
  ChevronRight,
  Instagram,
  AlertCircle,
  CheckCircle2,
  Users,
  TrendingUp,
  Plus,
  Flame,
  Sparkles,
  Zap,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Avatar, Card, Badge, Button, Modal, LeadScoreBadge, InboxFAB } from '@/components/ui'
import { useApp } from '@/contexts/AppContext'
import { useLanguage } from '@/i18n'
import { cn, formatTimeAgo, formatRelativeDate, getSourceLabel, getWhatsAppUrl, getPhoneUrl } from '@/lib/utils'
import { Patient, LeadSource, FunnelStatus } from '@/types'
import { calculateLeadScore } from '@/services/leadScoring'
import { format, isAfter, subHours, addHours, isToday, startOfDay, endOfDay } from 'date-fns'

type InboxFilter = 'all' | 'new' | 'urgent' | 'today' | 'hot'

export default function InboxPage() {
  const router = useRouter()
  const { state, updatePatientStatus, addFollowUp } = useApp()
  const { t, language } = useLanguage()

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<InboxFilter>('all')
  const [channelFilter, setChannelFilter] = useState<LeadSource | 'all'>('all')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['urgent', 'hot', 'new']))

  // Calculate scores for all patients
  const patientsWithScores = useMemo(() => {
    return state.patients.map(patient => ({
      ...patient,
      calculatedScore: calculateLeadScore(patient, state.treatments)
    }))
  }, [state.patients, state.treatments])

  // Categorize patients by priority
  const categorizedPatients = useMemo(() => {
    const now = new Date()
    const fortyEightHoursAgo = subHours(now, 48)

    // Urgent: New patients waiting 48+ hours
    const urgent = patientsWithScores.filter(
      patient => patient.status === 'new' && new Date(patient.createdAt) < fortyEightHoursAgo
    ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

    // Hot patients: High score (70+), not closed/lost
    const hot = patientsWithScores.filter(
      patient => patient.calculatedScore.total >= 70 &&
              patient.status !== 'closed' &&
              patient.status !== 'lost' &&
              !urgent.some(u => u.id === patient.id)
    ).sort((a, b) => b.calculatedScore.total - a.calculatedScore.total)

    // New patients (not urgent)
    const newPatients = patientsWithScores.filter(
      patient => patient.status === 'new' &&
              !urgent.some(u => u.id === patient.id)
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Today's follow-ups
    const todayFollowUps = patientsWithScores.filter(patient =>
      patient.followUps.some(f => !f.completed && isToday(new Date(f.scheduledAt)))
    )

    // All other active patients
    const other = patientsWithScores.filter(
      patient => patient.status !== 'closed' &&
              patient.status !== 'lost' &&
              !urgent.some(u => u.id === patient.id) &&
              !hot.some(h => h.id === patient.id) &&
              !newPatients.some(n => n.id === patient.id)
    )

    return { urgent, hot, new: newPatients, today: todayFollowUps, other }
  }, [patientsWithScores])

  // Get filtered patients based on current filter and search
  const filteredPatients = useMemo(() => {
    let patients = [...patientsWithScores]

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase()
      patients = patients.filter(
        (patient) =>
          patient.name.toLowerCase().includes(searchLower) ||
          patient.phone.includes(search) ||
          patient.email?.toLowerCase().includes(searchLower) ||
          patient.treatments.some((t) => t.toLowerCase().includes(searchLower))
      )
    }

    // Channel filter
    if (channelFilter !== 'all') {
      patients = patients.filter((patient) => patient.source === channelFilter)
    }

    // Status/time filter
    const now = new Date()
    const fortyEightHoursAgo = subHours(now, 48)

    switch (filter) {
      case 'new':
        patients = patients.filter((patient) => patient.status === 'new')
        break
      case 'urgent':
        patients = patients.filter(
          (patient) =>
            patient.status === 'new' &&
            new Date(patient.createdAt) < fortyEightHoursAgo
        )
        break
      case 'hot':
        patients = patients.filter(
          (patient) =>
            patient.calculatedScore.total >= 70 &&
            patient.status !== 'closed' &&
            patient.status !== 'lost'
        )
        break
      case 'today':
        patients = patients.filter((patient) =>
          patient.followUps.some(
            (f) =>
              !f.completed &&
              isToday(new Date(f.scheduledAt))
          )
        )
        break
      default:
        patients = patients.filter(p => p.status !== 'closed' && p.status !== 'lost')
    }

    // Sort by score for most filters
    if (filter === 'hot' || filter === 'all') {
      return patients.sort((a, b) => b.calculatedScore.total - a.calculatedScore.total)
    }

    return patients.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [patientsWithScores, search, filter, channelFilter])

  // Stats
  const stats = useMemo(() => {
    return {
      urgentCount: categorizedPatients.urgent.length,
      hotCount: categorizedPatients.hot.length,
      newCount: categorizedPatients.new.length,
      todayCount: categorizedPatients.today.length,
      totalActive: patientsWithScores.filter(
        (p) => p.status !== 'closed' && p.status !== 'lost'
      ).length,
    }
  }, [categorizedPatients, patientsWithScores])

  // Get channel icon
  const getChannelIcon = (source: LeadSource) => {
    switch (source) {
      case 'instagram':
        return <Instagram className="w-4 h-4 text-pink-500" />
      case 'whatsapp':
        return <MessageCircle className="w-4 h-4 text-green-500" />
      case 'phone':
        return <Phone className="w-4 h-4 text-blue-500" />
      default:
        return <Users className="w-4 h-4 text-gray-500" />
    }
  }

  // Get status badge
  const getStatusBadge = (patient: Patient & { calculatedScore: any }) => {
    const now = new Date()
    const fortyEightHoursAgo = subHours(now, 48)
    const isUrgent =
      patient.status === 'new' && new Date(patient.createdAt) < fortyEightHoursAgo

    if (isUrgent) {
      return (
        <Badge variant="error" size="sm" className="animate-pulse">
          <AlertCircle className="w-3 h-3 mr-1" />
          +48h
        </Badge>
      )
    }

    const statusConfig: Record<FunnelStatus, { variant: string; label: string }> = {
      new: { variant: 'primary', label: t.funnel.new },
      contacted: { variant: 'warning', label: t.funnel.contacted },
      appointment: { variant: 'secondary', label: t.funnel.appointment },
      closed: { variant: 'success', label: t.funnel.closed },
      lost: { variant: 'default', label: t.funnel.lost },
    }

    const config = statusConfig[patient.status]
    return (
      <Badge variant={config.variant as any} size="sm">
        {config.label}
      </Badge>
    )
  }

  // Quick actions
  const handleCall = (patient: Patient, e: React.MouseEvent) => {
    e.stopPropagation()
    window.open(getPhoneUrl(patient.phone), '_self')
  }

  const handleWhatsApp = (patient: Patient, e: React.MouseEvent) => {
    e.stopPropagation()
    window.open(getWhatsAppUrl(patient.phone), '_blank')
  }

  const handleEmail = (patient: Patient, e: React.MouseEvent) => {
    e.stopPropagation()
    if (patient.email) {
      window.open(`mailto:${patient.email}`, '_self')
    }
  }

  const handleSchedule = (patient: Patient, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedPatient(patient)
    setShowScheduleModal(true)
  }

  const handleMarkContacted = async (patient: Patient, e: React.MouseEvent) => {
    e.stopPropagation()
    if (patient.status === 'new') {
      await updatePatientStatus(patient.id, 'contacted')
    }
  }

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const filterTabs = [
    { id: 'all' as InboxFilter, label: language === 'es' ? 'Todos' : 'All', count: stats.totalActive, icon: Users },
    { id: 'urgent' as InboxFilter, label: language === 'es' ? 'Urgente' : 'Urgent', count: stats.urgentCount, icon: AlertCircle, color: 'text-red-500' },
    { id: 'hot' as InboxFilter, label: language === 'es' ? 'Calientes' : 'Hot', count: stats.hotCount, icon: Flame, color: 'text-orange-500' },
    { id: 'new' as InboxFilter, label: language === 'es' ? 'Nuevos' : 'New', count: stats.newCount, icon: Sparkles, color: 'text-blue-500' },
    { id: 'today' as InboxFilter, label: language === 'es' ? 'Hoy' : 'Today', count: stats.todayCount, icon: Calendar, color: 'text-purple-500' },
  ]

  const channelOptions: { value: LeadSource | 'all'; label: string }[] = [
    { value: 'all', label: t.common.all },
    { value: 'instagram', label: 'Instagram' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'phone', label: getSourceLabel('phone') },
    { value: 'website', label: 'Web' },
    { value: 'referral', label: getSourceLabel('referral') },
  ]

  // Patient card component
  const PatientCard = ({ patient }: { patient: Patient & { calculatedScore: any } }) => (
    <div
      onClick={() => router.push(`/pacientes?id=${patient.id}`)}
      className={cn(
        'flex items-start gap-4 p-4 bg-white hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100',
        patient.status === 'new' && 'border-l-4 border-l-blue-500'
      )}
    >
      <Avatar name={patient.name} size="lg" />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-800 truncate">
              {patient.name}
            </h3>
            <LeadScoreBadge score={patient.calculatedScore.total} size="sm" showLabel={false} />
            {getChannelIcon(patient.source)}
          </div>
          {getStatusBadge(patient)}
        </div>

        {patient.treatments.length > 0 && (
          <p className="text-sm text-slate-600 truncate mb-1">
            {patient.treatments.join(', ')}
          </p>
        )}

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formatTimeAgo(new Date(patient.createdAt))}
          </span>
          {patient.followUps.some((f) => !f.completed) && (
            <span className="flex items-center gap-1 text-primary-600">
              <Calendar className="w-3.5 h-3.5" />
              {formatRelativeDate(
                new Date(patient.followUps.find((f) => !f.completed)!.scheduledAt)
              )}
            </span>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 mt-3">
          <a
            href={getPhoneUrl(patient.phone)}
            onClick={(e) => e.stopPropagation()}
            className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
            title={language === 'es' ? 'Llamar' : 'Call'}
          >
            <Phone className="w-4 h-4" />
          </a>
          <a
            href={getWhatsAppUrl(patient.phone)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors"
            title="WhatsApp"
          >
            <MessageCircle className="w-4 h-4" />
          </a>
          {patient.email && (
            <a
              href={`mailto:${patient.email}`}
              onClick={(e) => e.stopPropagation()}
              className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg transition-colors"
              title="Email"
            >
              <Mail className="w-4 h-4" />
            </a>
          )}
          <button
            onClick={(e) => handleSchedule(patient, e)}
            className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg transition-colors"
            title={language === 'es' ? 'Agendar' : 'Schedule'}
          >
            <Calendar className="w-4 h-4" />
          </button>
          {patient.status === 'new' && (
            <button
              onClick={(e) => handleMarkContacted(patient, e)}
              className="flex items-center gap-1 px-3 py-1.5 bg-success-50 text-success-700 rounded-lg text-xs font-medium hover:bg-success-100 transition-colors ml-auto"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {language === 'es' ? 'Contactado' : 'Contacted'}
            </button>
          )}
        </div>
      </div>

      <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0 mt-2" />
    </div>
  )

  // Priority section component
  const PrioritySection = ({
    id,
    title,
    subtitle,
    patients,
    icon: Icon,
    bgColor,
    borderColor,
    iconColor,
  }: {
    id: string
    title: string
    subtitle: string
    patients: (Patient & { calculatedScore: any })[]
    icon: any
    bgColor: string
    borderColor: string
    iconColor: string
  }) => {
    if (patients.length === 0) return null
    const isExpanded = expandedSections.has(id)

    return (
      <div className={cn('mb-4 rounded-2xl overflow-hidden border', borderColor)}>
        <button
          onClick={() => toggleSection(id)}
          className={cn('w-full flex items-center justify-between p-4', bgColor)}
        >
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', bgColor)}>
              <Icon className={cn('w-5 h-5', iconColor)} />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-slate-800">
                {patients.length} {title}
              </h3>
              <p className="text-xs text-slate-500">{subtitle}</p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>
        {isExpanded && (
          <div className="bg-white">
            {patients.map(patient => (
              <PatientCard key={patient.id} patient={patient} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-4 py-4 lg:px-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-display font-bold text-slate-800">
                  {t.inbox.title}
                </h1>
                <p className="text-sm text-slate-500">{t.inbox.subtitle}</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push('/pacientes?action=new')}
                className="hidden lg:flex"
              >
                <Plus className="w-4 h-4 mr-1" />
                {t.nav.newLead}
              </Button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder={t.patients.searchPatients}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-11 pl-10 pr-4 bg-gray-100 border-0 rounded-xl text-sm placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-primary-500/20 transition-all"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {filterTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
                    filter === tab.id
                      ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                      : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                  )}
                >
                  <tab.icon className={cn('w-4 h-4', filter !== tab.id && tab.color)} />
                  {tab.label}
                  {tab.count > 0 && (
                    <span
                      className={cn(
                        'flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold',
                        filter === tab.id
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200 text-slate-600'
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}

              {/* Channel Filter */}
              <div className="relative ml-auto">
                <button
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all',
                    channelFilter !== 'all'
                      ? 'bg-secondary-100 text-secondary-700'
                      : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                  )}
                >
                  <Filter className="w-4 h-4" />
                  {channelFilter !== 'all' && getSourceLabel(channelFilter)}
                </button>

                {showFilterMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowFilterMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-dropdown border border-gray-100 py-2 z-20">
                      {channelOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setChannelFilter(option.value)
                            setShowFilterMenu(false)
                          }}
                          className={cn(
                            'flex items-center gap-3 w-full px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors',
                            channelFilter === option.value &&
                              'bg-primary-50 text-primary-700'
                          )}
                        >
                          {option.value !== 'all' &&
                            getChannelIcon(option.value as LeadSource)}
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 lg:p-6">
          {filter === 'all' && !search ? (
            // Show priority sections when viewing all
            <>
              <PrioritySection
                id="urgent"
                title={language === 'es' ? 'Urgentes' : 'Urgent'}
                subtitle={language === 'es' ? '+48h sin contactar' : '48+ hours not contacted'}
                patients={categorizedPatients.urgent}
                icon={AlertCircle}
                bgColor="bg-red-50"
                borderColor="border-red-200"
                iconColor="text-red-600"
              />

              <PrioritySection
                id="hot"
                title={language === 'es' ? 'Pacientes Calientes' : 'Hot Patients'}
                subtitle={language === 'es' ? 'Alta probabilidad de conversión' : 'High conversion probability'}
                patients={categorizedPatients.hot}
                icon={Flame}
                bgColor="bg-orange-50"
                borderColor="border-orange-200"
                iconColor="text-orange-600"
              />

              <PrioritySection
                id="new"
                title={language === 'es' ? 'Nuevos' : 'New'}
                subtitle={language === 'es' ? 'Recién llegados' : 'Just arrived'}
                patients={categorizedPatients.new}
                icon={Sparkles}
                bgColor="bg-blue-50"
                borderColor="border-blue-200"
                iconColor="text-blue-600"
              />

              {categorizedPatients.other.length > 0 && (
                <PrioritySection
                  id="other"
                  title={language === 'es' ? 'En Seguimiento' : 'In Progress'}
                  subtitle={language === 'es' ? 'Pacientes activos' : 'Active patients'}
                  patients={categorizedPatients.other}
                  icon={Users}
                  bgColor="bg-slate-50"
                  borderColor="border-slate-200"
                  iconColor="text-slate-600"
                />
              )}

              {stats.totalActive === 0 && (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                    <Users className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-700 mb-2">
                    {t.inbox.noNewLeads}
                  </h3>
                  <p className="text-sm text-slate-500 text-center mb-4">
                    {t.patients.addFirstPatient}
                  </p>
                  <Button onClick={() => router.push('/pacientes?action=new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    {language === 'es' ? 'Agregar Paciente' : 'Add Patient'}
                  </Button>
                </div>
              )}
            </>
          ) : (
            // Show flat list when filtering or searching
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-200">
              {filteredPatients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-700 mb-2">
                    {t.inbox.noNewLeads}
                  </h3>
                  <p className="text-sm text-slate-500 text-center mb-4">
                    {filter === 'new'
                      ? t.inbox.checkFollowUp
                      : t.patients.addFirstPatient}
                  </p>
                  {filter !== 'all' && (
                    <Button variant="outline" onClick={() => setFilter('all')}>
                      {t.inbox.allLeads}
                    </Button>
                  )}
                </div>
              ) : (
                filteredPatients.map((patient) => (
                  <PatientCard key={patient.id} patient={patient} />
                ))
              )}
            </div>
          )}
        </div>

        {/* Spacer for bottom nav */}
        <div className="h-24 lg:hidden" />
      </div>

      {/* FAB for mobile */}
      <div className="lg:hidden">
        <InboxFAB />
      </div>

      {/* Schedule Modal */}
      <Modal
        isOpen={showScheduleModal}
        onClose={() => {
          setShowScheduleModal(false)
          setSelectedPatient(null)
        }}
        title={t.nav.scheduleAppointment}
      >
        {selectedPatient && (
          <div className="p-4">
            <p className="text-slate-600 mb-4">
              {t.nav.scheduleAppointment}: <strong>{selectedPatient.name}</strong>
            </p>
            <div className="flex gap-2">
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => {
                  router.push(`/pacientes?id=${selectedPatient.id}&action=schedule`)
                  setShowScheduleModal(false)
                }}
              >
                {t.followUp.schedule}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowScheduleModal(false)}
              >
                {t.common.cancel}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AppShell>
  )
}
