'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Instagram,
  MessageCircle,
  Phone,
  Clock,
  Calendar,
  DollarSign,
  ChevronRight,
  MoreHorizontal,
  Globe,
  Users,
} from 'lucide-react'
import { AppShell } from '@/components/layout'
import { Avatar } from '@/components/ui'
import { useApp } from '@/contexts/AppContext'
import { useLanguage } from '@/i18n'
import { formatTimeAgo, formatCurrency, getSourceLabel, cn } from '@/lib/utils'
import { Lead, LeadStatus, LeadSource } from '@/types'

// Column definitions with new design
const columns: { id: LeadStatus; title: string; color: string; borderColor: string; bgColor: string }[] = [
  { id: 'new', title: 'Nuevo', color: '#3B82F6', borderColor: 'border-t-blue-500', bgColor: 'bg-blue-50/50' },
  { id: 'contacted', title: 'Contactado', color: '#F59E0B', borderColor: 'border-t-amber-500', bgColor: 'bg-amber-50/50' },
  { id: 'scheduled', title: 'Turno Agendado', color: '#8B5CF6', borderColor: 'border-t-purple-500', bgColor: 'bg-purple-50/50' },
  { id: 'closed', title: 'Cerrado', color: '#22C55E', borderColor: 'border-t-success-500', bgColor: 'bg-success-50/50' },
  { id: 'lost', title: 'Perdido', color: '#6B7280', borderColor: 'border-t-gray-400', bgColor: 'bg-gray-50' },
]

// Get channel icon
function getSourceIcon(source: LeadSource) {
  switch (source) {
    case 'instagram':
      return <Instagram className="w-3.5 h-3.5 text-pink-500" />
    case 'whatsapp':
      return <MessageCircle className="w-3.5 h-3.5 text-green-500" />
    case 'phone':
      return <Phone className="w-3.5 h-3.5 text-blue-500" />
    case 'website':
      return <Globe className="w-3.5 h-3.5 text-indigo-500" />
    case 'referral':
      return <Users className="w-3.5 h-3.5 text-purple-500" />
    default:
      return <Phone className="w-3.5 h-3.5 text-gray-500" />
  }
}

// Sortable Lead Card Component
function SortableLeadCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="touch-manipulation"
    >
      <LeadCard lead={lead} onClick={onClick} />
    </div>
  )
}

// Lead Card Component
function LeadCard({
  lead,
  overlay = false,
  onClick,
}: {
  lead: Lead
  overlay?: boolean
  onClick?: () => void
}) {
  const { t } = useLanguage()
  const hasFollowUp = lead.followUps.some((f) => !f.completed)
  const nextFollowUp = lead.followUps.find((f) => !f.completed)

  const handleClick = (e: React.MouseEvent) => {
    if (onClick && !overlay) {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        'bg-white rounded-xl p-3 shadow-card border border-gray-100',
        overlay
          ? 'shadow-lg scale-105 ring-2 ring-primary-500/20'
          : 'hover:shadow-card-hover hover:border-gray-200 cursor-grab active:cursor-grabbing',
        'transition-all'
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <Avatar name={lead.name} size="md" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 text-sm truncate">{lead.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {getSourceIcon(lead.source)}
            <span className="text-xs text-slate-500">{getSourceLabel(lead.source)}</span>
          </div>
        </div>
        <button
          className="p-1 text-slate-400 hover:text-slate-600 hover:bg-gray-100 rounded-lg transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Treatments */}
      {lead.treatments.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {lead.treatments.slice(0, 2).map((treatment, i) => (
            <span
              key={i}
              className="text-xs px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full font-medium"
            >
              {treatment}
            </span>
          ))}
          {lead.treatments.length > 2 && (
            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
              +{lead.treatments.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Value & Follow-up */}
      <div className="mt-3 flex items-center justify-between text-xs">
        {lead.value ? (
          <div className="flex items-center gap-1 text-success-600 font-medium">
            <DollarSign className="w-3.5 h-3.5" />
            {formatCurrency(lead.value)}
          </div>
        ) : (
          <span className="text-slate-400">{formatTimeAgo(new Date(lead.createdAt))}</span>
        )}

        {hasFollowUp && nextFollowUp && (
          <div className="flex items-center gap-1 text-primary-600">
            <Calendar className="w-3.5 h-3.5" />
            <span className="font-medium">
              {new Date(nextFollowUp.scheduledAt).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          </div>
        )}
      </div>

      {/* Quick indicator for urgent items */}
      {lead.status === 'new' &&
        new Date().getTime() - new Date(lead.createdAt).getTime() > 48 * 60 * 60 * 1000 && (
          <div className="mt-2 px-2 py-1 bg-error-50 rounded-lg">
            <span className="text-xs text-error-700 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" />
              +48h sin contactar
            </span>
          </div>
        )}
    </div>
  )
}

// Column Component
function Column({
  column,
  leads,
  onLeadClick,
}: {
  column: (typeof columns)[0]
  leads: Lead[]
  onLeadClick: (id: string) => void
}) {
  const { t } = useLanguage()

  return (
    <div className="flex-shrink-0 w-[280px] lg:w-[300px] lg:min-w-[280px] flex flex-col h-full">
      {/* Column Header */}
      <div
        className={cn(
          'flex items-center justify-between px-4 py-3 bg-white rounded-t-xl border-t-4',
          column.borderColor
        )}
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800">{column.title}</span>
          <span
            className="flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold rounded-full text-white"
            style={{ backgroundColor: column.color }}
          >
            {leads.length}
          </span>
        </div>
      </div>

      {/* Column Body */}
      <div
        className={cn(
          'flex-1 rounded-b-xl p-3 overflow-y-auto scrollbar-thin',
          column.bgColor
        )}
      >
        <SortableContext
          items={leads.map((l) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {leads.map((lead) => (
              <SortableLeadCard
                key={lead.id}
                lead={lead}
                onClick={() => onLeadClick(lead.id)}
              />
            ))}
          </div>
        </SortableContext>

        {leads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 bg-gray-200/50 rounded-full flex items-center justify-center mb-3">
              <Users className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm text-slate-400">
              {t.patients.noPatients}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function KanbanPage() {
  const router = useRouter()
  const { state, updateLeadStatus } = useApp()
  const { t } = useLanguage()
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  )

  const leadsByStatus = useMemo(() => {
    const grouped: Record<LeadStatus, Lead[]> = {
      new: [],
      contacted: [],
      scheduled: [],
      closed: [],
      lost: [],
    }

    state.leads.forEach((lead) => {
      grouped[lead.status].push(lead)
    })

    // Sort each group by date (newest first for new, otherwise by update)
    Object.keys(grouped).forEach((status) => {
      grouped[status as LeadStatus].sort((a, b) => {
        if (status === 'new') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        }
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      })
    })

    return grouped
  }, [state.leads])

  const activeLead = useMemo(() => {
    if (!activeId) return null
    return state.leads.find((l) => l.id === activeId)
  }, [activeId, state.leads])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const leadId = active.id as string
    const lead = state.leads.find((l) => l.id === leadId)
    if (!lead) return

    // Check if dropped on a column
    const overColumn = columns.find((c) => c.id === over.id)
    if (overColumn && lead.status !== overColumn.id) {
      updateLeadStatus(leadId, overColumn.id)
      return
    }

    // Check if dropped on another lead
    const overLead = state.leads.find((l) => l.id === over.id)
    if (overLead && lead.status !== overLead.status) {
      updateLeadStatus(leadId, overLead.status)
    }
  }

  const handleLeadClick = (id: string) => {
    router.push(`/pacientes?id=${id}`)
  }

  // Calculate totals for header
  const totals = useMemo(() => {
    const activeLeads = state.leads.filter(
      (l) => l.status !== 'closed' && l.status !== 'lost'
    ).length
    const totalValue = state.leads
      .filter((l) => l.status === 'closed')
      .reduce((sum, l) => sum + (l.value || 0), 0)
    return { activeLeads, totalValue }
  }, [state.leads])

  return (
    <AppShell>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4 lg:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-display font-bold text-slate-800">
                {t.nav.pipeline}
              </h1>
              <p className="text-sm text-slate-500">
                {totals.activeLeads} {t.patients.totalPatients.replace('en total', 'activos')}
              </p>
            </div>
            {totals.totalValue > 0 && (
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  {t.dashboard.closedSales}
                </p>
                <p className="text-lg font-bold text-success-600">
                  {formatCurrency(totals.totalValue)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="h-[calc(100vh-120px-64px)] lg:h-[calc(100vh-120px)] overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 h-full overflow-x-auto scrollbar-hide px-4 py-4 lg:px-6">
            {columns.map((column) => (
              <Column
                key={column.id}
                column={column}
                leads={leadsByStatus[column.id]}
                onLeadClick={handleLeadClick}
              />
            ))}
          </div>

          <DragOverlay>
            {activeLead ? <LeadCard lead={activeLead} overlay /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </AppShell>
  )
}
