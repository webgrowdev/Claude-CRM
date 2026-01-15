'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
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
import { Instagram, MessageCircle, Phone, Clock } from 'lucide-react'
import { Header, BottomNav, PageContainer } from '@/components/layout'
import { Avatar, Badge } from '@/components/ui'
import { useApp } from '@/contexts/AppContext'
import { formatTimeAgo, getSourceLabel } from '@/lib/utils'
import { Lead, LeadStatus } from '@/types'

const columns: { id: LeadStatus; title: string; color: string; bgColor: string }[] = [
  { id: 'new', title: 'Nuevos', color: '#6366F1', bgColor: 'bg-primary-50' },
  { id: 'contacted', title: 'Contactados', color: '#F59E0B', bgColor: 'bg-warning-50' },
  { id: 'scheduled', title: 'Agendados', color: '#8B5CF6', bgColor: 'bg-purple-50' },
  { id: 'closed', title: 'Cerrados', color: '#10B981', bgColor: 'bg-success-50' },
  { id: 'lost', title: 'Perdidos', color: '#EF4444', bgColor: 'bg-error-50' },
]

// Sortable Lead Card Component
function SortableLeadCard({ lead }: { lead: Lead }) {
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
      <LeadCard lead={lead} />
    </div>
  )
}

// Lead Card Component
function LeadCard({ lead, overlay = false }: { lead: Lead; overlay?: boolean }) {
  const hasFollowUp = lead.followUps.some(f => !f.completed)

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'instagram':
        return <Instagram className="w-3 h-3" />
      case 'whatsapp':
        return <MessageCircle className="w-3 h-3" />
      default:
        return <Phone className="w-3 h-3" />
    }
  }

  const CardContent = (
    <div
      className={`bg-white rounded-lg p-3 shadow-card ${
        overlay ? 'shadow-lg scale-105' : 'hover:shadow-card-hover'
      } transition-shadow cursor-grab active:cursor-grabbing`}
    >
      <div className="flex items-start gap-2">
        <Avatar name={lead.name} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-800 text-sm truncate">{lead.name}</p>
          <div className="flex items-center gap-1 mt-0.5 text-slate-500">
            {getSourceIcon(lead.source)}
            <span className="text-xs">{getSourceLabel(lead.source)}</span>
          </div>
        </div>
        {hasFollowUp && (
          <div className="flex-shrink-0">
            <Clock className="w-4 h-4 text-primary-500" />
          </div>
        )}
      </div>

      {lead.treatments.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {lead.treatments.slice(0, 2).map((t, i) => (
            <span
              key={i}
              className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded"
            >
              {t}
            </span>
          ))}
          {lead.treatments.length > 2 && (
            <span className="text-xs text-slate-400">
              +{lead.treatments.length - 2}
            </span>
          )}
        </div>
      )}

      <p className="text-xs text-slate-400 mt-2">
        {formatTimeAgo(new Date(lead.createdAt))}
      </p>
    </div>
  )

  if (overlay) {
    return CardContent
  }

  return (
    <Link href={`/leads/${lead.id}`}>
      {CardContent}
    </Link>
  )
}

// Column Component
function Column({
  column,
  leads,
}: {
  column: { id: LeadStatus; title: string; color: string; bgColor: string }
  leads: Lead[]
}) {
  return (
    <div className="flex-shrink-0 w-[280px] flex flex-col h-full">
      {/* Column Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 bg-white rounded-t-lg border-l-4"
        style={{ borderLeftColor: column.color }}
      >
        <span className="font-semibold text-slate-800">{column.title}</span>
        <span
          className="px-2 py-0.5 text-xs font-medium rounded-full text-white"
          style={{ backgroundColor: column.color }}
        >
          {leads.length}
        </span>
      </div>

      {/* Column Body */}
      <div className={`flex-1 ${column.bgColor} rounded-b-lg p-2 overflow-y-auto`}>
        <SortableContext
          items={leads.map(l => l.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {leads.map((lead) => (
              <SortableLeadCard key={lead.id} lead={lead} />
            ))}
          </div>
        </SortableContext>

        {leads.length === 0 && (
          <div className="text-center py-8 text-slate-400 text-sm">
            Sin leads
          </div>
        )}
      </div>
    </div>
  )
}

export default function KanbanPage() {
  const { state, updateLeadStatus } = useApp()
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

    // Sort each group by date
    Object.keys(grouped).forEach((status) => {
      grouped[status as LeadStatus].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
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

  return (
    <>
      <Header title="Pipeline" />

      <PageContainer noPadding className="h-[calc(100vh-56px-64px)] overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-3 h-full overflow-x-auto scrollbar-hide px-4 py-4">
            {columns.map((column) => (
              <Column
                key={column.id}
                column={column}
                leads={leadsByStatus[column.id]}
              />
            ))}
          </div>

          <DragOverlay>
            {activeLead ? <LeadCard lead={activeLead} overlay /> : null}
          </DragOverlay>
        </DndContext>
      </PageContainer>

      <BottomNav />
    </>
  )
}
