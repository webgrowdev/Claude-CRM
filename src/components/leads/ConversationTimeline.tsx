'use client'

import { useState, useMemo } from 'react'
import {
  Phone,
  PhoneOutgoing,
  PhoneIncoming,
  PhoneMissed,
  MessageCircle,
  Mail,
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  Video,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Plus,
  Send,
  User,
  Bot,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/i18n/LanguageContext'
import { formatTimeAgo, formatRelativeDate } from '@/lib/utils'
import { Button, Badge } from '@/components/ui'

// Types for timeline events
export type TimelineEventType =
  | 'note'
  | 'call_outgoing'
  | 'call_incoming'
  | 'call_missed'
  | 'whatsapp_sent'
  | 'whatsapp_received'
  | 'email_sent'
  | 'email_received'
  | 'appointment_scheduled'
  | 'appointment_completed'
  | 'appointment_cancelled'
  | 'status_change'
  | 'followup_scheduled'
  | 'followup_completed'
  | 'meeting'
  | 'system'

export interface TimelineEvent {
  id: string
  type: TimelineEventType
  content: string
  date: Date
  metadata?: {
    duration?: string
    status?: string
    previousStatus?: string
    newStatus?: string
    meetLink?: string
    attachments?: string[]
    from?: string
    to?: string
  }
  user?: string
}

interface ConversationTimelineProps {
  events: TimelineEvent[]
  onAddNote?: () => void
  onAddFollowUp?: () => void
  showFilters?: boolean
  compact?: boolean
}

export function ConversationTimeline({
  events,
  onAddNote,
  onAddFollowUp,
  showFilters = true,
  compact = false,
}: ConversationTimelineProps) {
  const { language } = useLanguage()
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())
  const [filterType, setFilterType] = useState<'all' | 'calls' | 'messages' | 'notes' | 'appointments'>('all')
  const [showAll, setShowAll] = useState(false)

  const t = {
    noActivity: language === 'es' ? 'No hay actividad todavía' : 'No activity yet',
    addNote: language === 'es' ? 'Agregar nota' : 'Add note',
    schedule: language === 'es' ? 'Programar' : 'Schedule',
    showMore: language === 'es' ? 'Ver más' : 'Show more',
    showLess: language === 'es' ? 'Ver menos' : 'Show less',
    all: language === 'es' ? 'Todo' : 'All',
    calls: language === 'es' ? 'Llamadas' : 'Calls',
    messages: language === 'es' ? 'Mensajes' : 'Messages',
    notes: language === 'es' ? 'Notas' : 'Notes',
    appointments: language === 'es' ? 'Citas' : 'Appointments',
    today: language === 'es' ? 'Hoy' : 'Today',
    yesterday: language === 'es' ? 'Ayer' : 'Yesterday',
    joinMeet: language === 'es' ? 'Unirse a Meet' : 'Join Meet',
    scheduled: language === 'es' ? 'Programado' : 'Scheduled',
    completed: language === 'es' ? 'Completado' : 'Completed',
    missed: language === 'es' ? 'Perdida' : 'Missed',
    duration: language === 'es' ? 'Duración' : 'Duration',
  }

  // Filter events
  const filteredEvents = useMemo(() => {
    if (filterType === 'all') return events

    const typeMap: Record<string, TimelineEventType[]> = {
      calls: ['call_outgoing', 'call_incoming', 'call_missed'],
      messages: ['whatsapp_sent', 'whatsapp_received', 'email_sent', 'email_received'],
      notes: ['note'],
      appointments: ['appointment_scheduled', 'appointment_completed', 'appointment_cancelled', 'meeting'],
    }

    return events.filter(e => typeMap[filterType]?.includes(e.type))
  }, [events, filterType])

  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups: { label: string; events: TimelineEvent[] }[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    let currentGroup: { label: string; events: TimelineEvent[] } | null = null

    const sortedEvents = [...filteredEvents].sort((a, b) => b.date.getTime() - a.date.getTime())
    const visibleEvents = showAll ? sortedEvents : sortedEvents.slice(0, 5)

    visibleEvents.forEach(event => {
      const eventDate = new Date(event.date)
      eventDate.setHours(0, 0, 0, 0)

      let dateLabel: string
      if (eventDate.getTime() === today.getTime()) {
        dateLabel = t.today
      } else if (eventDate.getTime() === yesterday.getTime()) {
        dateLabel = t.yesterday
      } else {
        dateLabel = eventDate.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        })
      }

      if (!currentGroup || currentGroup.label !== dateLabel) {
        currentGroup = { label: dateLabel, events: [] }
        groups.push(currentGroup)
      }

      currentGroup.events.push(event)
    })

    return groups
  }, [filteredEvents, showAll, language, t.today, t.yesterday])

  // Get icon and colors for event type
  const getEventStyle = (type: TimelineEventType) => {
    const styles: Record<TimelineEventType, { icon: React.ReactNode; bg: string; text: string }> = {
      note: {
        icon: <FileText className="w-4 h-4" />,
        bg: 'bg-slate-100',
        text: 'text-slate-600',
      },
      call_outgoing: {
        icon: <PhoneOutgoing className="w-4 h-4" />,
        bg: 'bg-blue-100',
        text: 'text-blue-600',
      },
      call_incoming: {
        icon: <PhoneIncoming className="w-4 h-4" />,
        bg: 'bg-green-100',
        text: 'text-green-600',
      },
      call_missed: {
        icon: <PhoneMissed className="w-4 h-4" />,
        bg: 'bg-red-100',
        text: 'text-red-600',
      },
      whatsapp_sent: {
        icon: <Send className="w-4 h-4" />,
        bg: 'bg-green-100',
        text: 'text-green-600',
      },
      whatsapp_received: {
        icon: <MessageCircle className="w-4 h-4" />,
        bg: 'bg-green-100',
        text: 'text-green-600',
      },
      email_sent: {
        icon: <Mail className="w-4 h-4" />,
        bg: 'bg-amber-100',
        text: 'text-amber-600',
      },
      email_received: {
        icon: <Mail className="w-4 h-4" />,
        bg: 'bg-amber-100',
        text: 'text-amber-600',
      },
      appointment_scheduled: {
        icon: <Calendar className="w-4 h-4" />,
        bg: 'bg-purple-100',
        text: 'text-purple-600',
      },
      appointment_completed: {
        icon: <CheckCircle className="w-4 h-4" />,
        bg: 'bg-green-100',
        text: 'text-green-600',
      },
      appointment_cancelled: {
        icon: <Calendar className="w-4 h-4" />,
        bg: 'bg-red-100',
        text: 'text-red-600',
      },
      status_change: {
        icon: <Bot className="w-4 h-4" />,
        bg: 'bg-slate-100',
        text: 'text-slate-500',
      },
      followup_scheduled: {
        icon: <Clock className="w-4 h-4" />,
        bg: 'bg-primary-100',
        text: 'text-primary-600',
      },
      followup_completed: {
        icon: <CheckCircle className="w-4 h-4" />,
        bg: 'bg-green-100',
        text: 'text-green-600',
      },
      meeting: {
        icon: <Video className="w-4 h-4" />,
        bg: 'bg-purple-100',
        text: 'text-purple-600',
      },
      system: {
        icon: <Bot className="w-4 h-4" />,
        bg: 'bg-slate-100',
        text: 'text-slate-500',
      },
    }

    return styles[type] || styles.note
  }

  const toggleExpanded = (id: string) => {
    setExpandedEvents(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
          <MessageCircle className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-slate-500 mb-4">{t.noActivity}</p>
        <div className="flex gap-2 justify-center">
          {onAddNote && (
            <Button size="sm" variant="outline" onClick={onAddNote}>
              <FileText className="w-4 h-4 mr-1" />
              {t.addNote}
            </Button>
          )}
          {onAddFollowUp && (
            <Button size="sm" onClick={onAddFollowUp}>
              <Plus className="w-4 h-4 mr-1" />
              {t.schedule}
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      {showFilters && (
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
          {(['all', 'calls', 'messages', 'notes', 'appointments'] as const).map(filter => (
            <button
              key={filter}
              onClick={() => setFilterType(filter)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
                filterType === filter
                  ? 'bg-primary-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {t[filter]}
            </button>
          ))}
        </div>
      )}

      {/* Quick actions */}
      {(onAddNote || onAddFollowUp) && (
        <div className="flex gap-2">
          {onAddNote && (
            <Button size="sm" variant="outline" className="flex-1" onClick={onAddNote}>
              <FileText className="w-4 h-4 mr-1" />
              {t.addNote}
            </Button>
          )}
          {onAddFollowUp && (
            <Button size="sm" className="flex-1" onClick={onAddFollowUp}>
              <Plus className="w-4 h-4 mr-1" />
              {t.schedule}
            </Button>
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-6">
        {groupedEvents.map(group => (
          <div key={group.label}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {group.label}
              </span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <div className="space-y-3">
              {group.events.map((event, index) => {
                const style = getEventStyle(event.type)
                const isExpanded = expandedEvents.has(event.id)
                const isLongContent = event.content.length > 100

                return (
                  <div
                    key={event.id}
                    className={cn(
                      'flex gap-3 group',
                      compact && 'py-1'
                    )}
                  >
                    {/* Timeline connector */}
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                        style.bg,
                        style.text
                      )}>
                        {style.icon}
                      </div>
                      {index < group.events.length - 1 && (
                        <div className="flex-1 w-px bg-slate-200 mt-2" />
                      )}
                    </div>

                    {/* Content */}
                    <div className={cn(
                      'flex-1 min-w-0 pb-3',
                      index < group.events.length - 1 && 'border-b border-slate-100'
                    )}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            'text-sm text-slate-800',
                            !isExpanded && isLongContent && 'line-clamp-2'
                          )}>
                            {event.content}
                          </p>

                          {/* Metadata */}
                          {event.metadata && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {event.metadata.duration && (
                                <Badge variant="outline" className="text-xs">
                                  {t.duration}: {event.metadata.duration}
                                </Badge>
                              )}
                              {event.metadata.status && (
                                <Badge
                                  variant={
                                    event.metadata.status === 'completed' ? 'success' :
                                    event.metadata.status === 'missed' ? 'error' :
                                    'default'
                                  }
                                  className="text-xs"
                                >
                                  {event.metadata.status === 'completed' ? t.completed :
                                   event.metadata.status === 'missed' ? t.missed :
                                   t.scheduled}
                                </Badge>
                              )}
                              {event.metadata.meetLink && (
                                <a
                                  href={event.metadata.meetLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-medium rounded transition-colors"
                                >
                                  <Video className="w-3 h-3" />
                                  {t.joinMeet}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          )}

                          {/* Expand button for long content */}
                          {isLongContent && (
                            <button
                              onClick={() => toggleExpanded(event.id)}
                              className="text-xs text-primary-600 hover:text-primary-700 mt-1 flex items-center gap-1"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="w-3 h-3" />
                                  {t.showLess}
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-3 h-3" />
                                  {t.showMore}
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">
                          {event.date.toLocaleTimeString(language === 'es' ? 'es-ES' : 'en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {/* User attribution */}
                      {event.user && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                          <User className="w-3 h-3" />
                          {event.user}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Show more button */}
      {filteredEvents.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full py-2 text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center gap-1"
        >
          {showAll ? (
            <>
              <ChevronUp className="w-4 h-4" />
              {t.showLess}
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              {t.showMore} ({filteredEvents.length - 5} {language === 'es' ? 'más' : 'more'})
            </>
          )}
        </button>
      )}
    </div>
  )
}

/**
 * Helper to convert lead notes and follow-ups to timeline events
 */
export function convertToTimelineEvents(
  notes: Array<{ id: string; content: string; createdAt: Date }>,
  followUps: Array<{
    id: string
    type: string
    scheduledAt: Date
    completed: boolean
    notes?: string
    meetLink?: string
  }>,
  statusChanges?: Array<{
    id: string
    from: string
    to: string
    date: Date
  }>
): TimelineEvent[] {
  const events: TimelineEvent[] = []

  // Convert notes
  notes.forEach(note => {
    events.push({
      id: note.id,
      type: 'note',
      content: note.content,
      date: new Date(note.createdAt),
    })
  })

  // Convert follow-ups
  followUps.forEach(fu => {
    let type: TimelineEventType = 'followup_scheduled'
    if (fu.completed) {
      type = fu.type === 'meeting' ? 'appointment_completed' : 'followup_completed'
    } else if (fu.type === 'meeting') {
      type = 'meeting'
    } else if (fu.type === 'call') {
      type = 'call_outgoing'
    } else if (fu.type === 'email') {
      type = 'email_sent'
    } else if (fu.type === 'message') {
      type = 'whatsapp_sent'
    }

    const typeLabels: Record<string, string> = {
      call: 'Llamada',
      message: 'Mensaje WhatsApp',
      email: 'Email',
      meeting: 'Reunión',
    }

    events.push({
      id: fu.id,
      type,
      content: `${typeLabels[fu.type] || fu.type}${fu.notes ? `: ${fu.notes}` : ''}`,
      date: new Date(fu.scheduledAt),
      metadata: {
        status: fu.completed ? 'completed' : 'scheduled',
        meetLink: fu.meetLink,
      },
    })
  })

  // Convert status changes
  statusChanges?.forEach(change => {
    events.push({
      id: change.id,
      type: 'status_change',
      content: `Estado cambiado de ${change.from} a ${change.to}`,
      date: new Date(change.date),
      metadata: {
        previousStatus: change.from,
        newStatus: change.to,
      },
    })
  })

  return events.sort((a, b) => b.date.getTime() - a.date.getTime())
}
