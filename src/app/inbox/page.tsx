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
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Avatar, Card, Badge, Button, Modal } from '@/components/ui'
import { useApp } from '@/contexts/AppContext'
import { useLanguage } from '@/i18n'
import { cn, formatTimeAgo, formatRelativeDate, getSourceLabel } from '@/lib/utils'
import { Lead, LeadSource, LeadStatus } from '@/types'
import { format, isAfter, subHours, addHours, isToday, startOfDay, endOfDay } from 'date-fns'

type InboxFilter = 'all' | 'new' | 'urgent' | 'today'

export default function InboxPage() {
  const router = useRouter()
  const { state, updateLeadStatus, addFollowUp } = useApp()
  const { t } = useLanguage()

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<InboxFilter>('all')
  const [channelFilter, setChannelFilter] = useState<LeadSource | 'all'>('all')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [showFilterMenu, setShowFilterMenu] = useState(false)

  // Get filtered leads
  const filteredLeads = useMemo(() => {
    let leads = [...state.leads]

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase()
      leads = leads.filter(
        (lead) =>
          lead.name.toLowerCase().includes(searchLower) ||
          lead.phone.includes(search) ||
          lead.email?.toLowerCase().includes(searchLower) ||
          lead.treatments.some((t) => t.toLowerCase().includes(searchLower))
      )
    }

    // Channel filter
    if (channelFilter !== 'all') {
      leads = leads.filter((lead) => lead.source === channelFilter)
    }

    // Status/time filter
    const now = new Date()
    const fortyEightHoursAgo = subHours(now, 48)

    switch (filter) {
      case 'new':
        leads = leads.filter((lead) => lead.status === 'new')
        break
      case 'urgent':
        // Leads that are new and waiting more than 48 hours
        leads = leads.filter(
          (lead) =>
            lead.status === 'new' &&
            new Date(lead.createdAt) < fortyEightHoursAgo
        )
        break
      case 'today':
        // Leads with follow-ups scheduled for today
        leads = leads.filter((lead) =>
          lead.followUps.some(
            (f) =>
              !f.completed &&
              isToday(new Date(f.scheduledAt))
          )
        )
        break
      default:
        // All leads, sorted by status priority
        leads = leads.sort((a, b) => {
          const statusPriority: Record<LeadStatus, number> = {
            new: 0,
            contacted: 1,
            scheduled: 2,
            closed: 3,
            lost: 4,
          }
          return statusPriority[a.status] - statusPriority[b.status]
        })
    }

    // Sort by date (newest first for 'new' filter, otherwise by next action)
    return leads.sort((a, b) => {
      if (filter === 'new' || filter === 'urgent') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  }, [state.leads, search, filter, channelFilter])

  // Stats
  const stats = useMemo(() => {
    const now = new Date()
    const fortyEightHoursAgo = subHours(now, 48)
    const newLeads = state.leads.filter((l) => l.status === 'new')
    const urgentLeads = newLeads.filter(
      (l) => new Date(l.createdAt) < fortyEightHoursAgo
    )
    const todayFollowUps = state.leads.filter((l) =>
      l.followUps.some((f) => !f.completed && isToday(new Date(f.scheduledAt)))
    )

    return {
      newCount: newLeads.length,
      urgentCount: urgentLeads.length,
      todayCount: todayFollowUps.length,
      totalActive: state.leads.filter(
        (l) => l.status !== 'closed' && l.status !== 'lost'
      ).length,
    }
  }, [state.leads])

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
  const getStatusBadge = (lead: Lead) => {
    const now = new Date()
    const fortyEightHoursAgo = subHours(now, 48)
    const isUrgent =
      lead.status === 'new' && new Date(lead.createdAt) < fortyEightHoursAgo

    if (isUrgent) {
      return (
        <Badge variant="error" size="sm" className="animate-pulse">
          <AlertCircle className="w-3 h-3 mr-1" />
          +48h
        </Badge>
      )
    }

    const statusConfig: Record<LeadStatus, { variant: string; label: string }> = {
      new: { variant: 'primary', label: t.funnel.new },
      contacted: { variant: 'warning', label: t.funnel.contacted },
      scheduled: { variant: 'secondary', label: t.funnel.appointment },
      closed: { variant: 'success', label: t.funnel.closed },
      lost: { variant: 'default', label: t.funnel.lost },
    }

    const config = statusConfig[lead.status]
    return (
      <Badge variant={config.variant as 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'default'} size="sm">
        {config.label}
      </Badge>
    )
  }

  // Quick actions
  const handleCall = (lead: Lead, e: React.MouseEvent) => {
    e.stopPropagation()
    window.open(`tel:${lead.phone}`, '_self')
  }

  const handleWhatsApp = (lead: Lead, e: React.MouseEvent) => {
    e.stopPropagation()
    const phone = lead.phone.replace(/\D/g, '')
    window.open(`https://wa.me/${phone}`, '_blank')
  }

  const handleEmail = (lead: Lead, e: React.MouseEvent) => {
    e.stopPropagation()
    if (lead.email) {
      window.open(`mailto:${lead.email}`, '_self')
    }
  }

  const handleSchedule = (lead: Lead, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedLead(lead)
    setShowScheduleModal(true)
  }

  const handleMarkContacted = async (lead: Lead, e: React.MouseEvent) => {
    e.stopPropagation()
    if (lead.status === 'new') {
      await updateLeadStatus(lead.id, 'contacted')
    }
  }

  const filterTabs = [
    { id: 'all' as InboxFilter, label: t.inbox.allLeads, count: stats.totalActive },
    { id: 'new' as InboxFilter, label: t.inbox.newLeads, count: stats.newCount },
    { id: 'urgent' as InboxFilter, label: t.inbox.urgent, count: stats.urgentCount },
    { id: 'today' as InboxFilter, label: t.inbox.toCallToday, count: stats.todayCount },
  ]

  const channelOptions: { value: LeadSource | 'all'; label: string }[] = [
    { value: 'all', label: t.common.all },
    { value: 'instagram', label: 'Instagram' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'phone', label: getSourceLabel('phone') },
    { value: 'website', label: 'Web' },
    { value: 'referral', label: getSourceLabel('referral') },
  ]

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

        {/* Lead List */}
        <div className="divide-y divide-gray-100">
          {filteredLeads.length === 0 ? (
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
              {filter === 'new' && (
                <Button variant="outline" onClick={() => setFilter('all')}>
                  {t.inbox.allLeads}
                </Button>
              )}
            </div>
          ) : (
            filteredLeads.map((lead) => (
              <div
                key={lead.id}
                onClick={() => router.push(`/pacientes?id=${lead.id}`)}
                className={cn(
                  'flex items-start gap-4 p-4 bg-white hover:bg-gray-50 cursor-pointer transition-colors',
                  lead.status === 'new' && 'border-l-4 border-l-blue-500'
                )}
              >
                {/* Avatar */}
                <Avatar name={lead.name} size="lg" />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-800 truncate">
                        {lead.name}
                      </h3>
                      {getChannelIcon(lead.source)}
                    </div>
                    {getStatusBadge(lead)}
                  </div>

                  {/* Treatment interest */}
                  {lead.treatments.length > 0 && (
                    <p className="text-sm text-slate-600 truncate mb-1">
                      {lead.treatments.join(', ')}
                    </p>
                  )}

                  {/* Meta info */}
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatTimeAgo(new Date(lead.createdAt))}
                    </span>
                    {lead.followUps.some((f) => !f.completed) && (
                      <span className="flex items-center gap-1 text-primary-600">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatRelativeDate(
                          new Date(
                            lead.followUps.find((f) => !f.completed)!.scheduledAt
                          )
                        )}
                      </span>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={(e) => handleCall(lead, e)}
                      className="btn-action"
                      title="Llamar"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleWhatsApp(lead, e)}
                      className="btn-action"
                      title="WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    {lead.email && (
                      <button
                        onClick={(e) => handleEmail(lead, e)}
                        className="btn-action"
                        title="Email"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleSchedule(lead, e)}
                      className="btn-action-primary"
                      title={t.nav.scheduleAppointment}
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                    {lead.status === 'new' && (
                      <button
                        onClick={(e) => handleMarkContacted(lead, e)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-success-50 text-success-700 rounded-full text-xs font-medium hover:bg-success-100 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {t.inbox.markAsContacted}
                      </button>
                    )}
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0 mt-2" />
              </div>
            ))
          )}
        </div>

        {/* Spacer for bottom nav */}
        <div className="h-20 lg:hidden" />
      </div>

      {/* Schedule Modal - Simple placeholder */}
      <Modal
        isOpen={showScheduleModal}
        onClose={() => {
          setShowScheduleModal(false)
          setSelectedLead(null)
        }}
        title={t.nav.scheduleAppointment}
      >
        {selectedLead && (
          <div className="p-4">
            <p className="text-slate-600 mb-4">
              {t.nav.scheduleAppointment}: <strong>{selectedLead.name}</strong>
            </p>
            <div className="flex gap-2">
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => {
                  router.push(`/pacientes?id=${selectedLead.id}&action=schedule`)
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
