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
import { Patient, FunnelStatus, LeadSource } from '@/types'

// Column definitions with new design
const columns: { id: FunnelStatus; title: string; color: string; borderColor: string; bgColor: string }[] = [
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

// Sortable Patient Card Component
function SortablePatientCard({ patient, onClick }: { patient: Patient; onClick: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: patient.id })

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
      <PatientCard patient={patient} onClick={onClick} />
    </div>
  )
}

// Patient Card Component
function PatientCard({
  patient,
  overlay = false,
  onClick,
}: {
  patient: Patient
  overlay?: boolean
  onClick?: () => void
}) {
  const { t } = useLanguage()
  const hasFollowUp = patient.followUps.some((f) => !f.completed)
  const nextFollowUp = patient.followUps.find((f) => !f.completed)

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
        <Avatar name={patient.name} size="md" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 text-sm truncate">{patient.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {getSourceIcon(patient.source)}
            <span className="text-xs text-slate-500">{getSourceLabel(patient.source)}</span>
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
      {patient.treatments.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {patient.treatments.slice(0, 2).map((treatment, i) => (
            <span
              key={i}
              className="text-xs px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full font-medium"
            >
              {treatment}
            </span>
          ))}
          {patient.treatments.length > 2 && (
            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
              +{patient.treatments.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Value & Follow-up */}
      <div className="mt-3 flex items-center justify-between text-xs">
        {patient.value ? (
          <div className="flex items-center gap-1 text-success-600 font-medium">
            <DollarSign className="w-3.5 h-3.5" />
            {formatCurrency(patient.value)}
          </div>
        ) : (
          <span className="text-slate-400">{formatTimeAgo(new Date(patient.createdAt))}</span>
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
      {patient.status === 'new' &&
        new Date().getTime() - new Date(patient.createdAt).getTime() > 48 * 60 * 60 * 1000 && (
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
  patients,
  onPatientClick,
}: {
  column: (typeof columns)[0]
  patients: Patient[]
  onPatientClick: (id: string) => void
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
            {patients.length}
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
          items={patients.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {patients.map((patient) => (
              <SortablePatientCard
                key={patient.id}
                patient={patient}
                onClick={() => onPatientClick(patient.id)}
              />
            ))}
          </div>
        </SortableContext>

        {patients.length === 0 && (
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
  const { state, updatePatientStatus } = useApp()
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

  const patientsByStatus = useMemo(() => {
    const grouped: Record<FunnelStatus, Patient[]> = {
      new: [],
      contacted: [],
      scheduled: [],
      closed: [],
      lost: [],
    }

    state.patients.forEach((patient) => {
      grouped[patient.status].push(patient)
    })

    // Sort each group by date (newest first for new, otherwise by update)
    Object.keys(grouped).forEach((status) => {
      grouped[status as FunnelStatus].sort((a, b) => {
        if (status === 'new') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        }
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      })
    })

    return grouped
  }, [state.patients])

  const activePatient = useMemo(() => {
    if (!activeId) return null
    return state.patients.find((p) => p.id === activeId)
  }, [activeId, state.patients])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const patientId = active.id as string
    const patient = state.patients.find((p) => p.id === patientId)
    if (!patient) return

    // Check if dropped on a column
    const overColumn = columns.find((c) => c.id === over.id)
    if (overColumn && patient.status !== overColumn.id) {
      updatePatientStatus(patientId, overColumn.id)
      return
    }

    // Check if dropped on another patient
    const overPatient = state.patients.find((p) => p.id === over.id)
    if (overPatient && patient.status !== overPatient.status) {
      updatePatientStatus(patientId, overPatient.status)
    }
  }

  const handlePatientClick = (id: string) => {
    router.push(`/pacientes?id=${id}`)
  }

  // Calculate totals for header
  const totals = useMemo(() => {
    const activePatients = state.patients.filter(
      (p) => p.status !== 'closed' && p.status !== 'lost'
    ).length
    const totalValue = state.patients
      .filter((p) => p.status === 'closed')
      .reduce((sum, p) => sum + (p.value || 0), 0)
    return { activePatients, totalValue }
  }, [state.patients])

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
                {totals.activePatients} {t.patients.totalPatients.replace('en total', 'activos')}
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
                patients={patientsByStatus[column.id]}
                onPatientClick={handlePatientClick}
              />
            ))}
          </div>

          <DragOverlay>
            {activePatient ? <PatientCard patient={activePatient} overlay /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </AppShell>
  )
}
