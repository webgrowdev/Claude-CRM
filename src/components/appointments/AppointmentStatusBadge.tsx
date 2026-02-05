'use client'

import { Badge } from '@/components/ui'
import { AppointmentLevelStatus, TreatmentPhase } from '@/types'
import { CheckCircle2, Clock, AlertTriangle, XCircle, PlayCircle, Calendar } from 'lucide-react'

interface AppointmentStatusBadgeProps {
  status: AppointmentLevelStatus
  phase?: TreatmentPhase
  sessionNumber?: number
  totalSessions?: number
  showPhase?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function AppointmentStatusBadge({
  status,
  phase,
  sessionNumber,
  totalSessions,
  showPhase = false,
  size = 'md',
}: AppointmentStatusBadgeProps) {
  const getStatusConfig = (status: AppointmentLevelStatus) => {
    switch (status) {
      case 'scheduled':
        return {
          label: 'Agendada',
          color: 'blue',
          icon: Calendar,
        }
      case 'confirmed':
        return {
          label: 'Confirmada',
          color: 'green',
          icon: CheckCircle2,
        }
      case 'in_progress':
        return {
          label: 'En Curso',
          color: 'purple',
          icon: PlayCircle,
        }
      case 'completed':
        return {
          label: 'Completada',
          color: 'green',
          icon: CheckCircle2,
        }
      case 'noshow':
        return {
          label: 'No Asistió',
          color: 'red',
          icon: XCircle,
        }
      case 'cancelled':
        return {
          label: 'Cancelada',
          color: 'gray',
          icon: XCircle,
        }
    }
  }

  const getPhaseConfig = (phase: TreatmentPhase) => {
    switch (phase) {
      case 'consultation':
        return { label: 'Consulta', color: 'blue' }
      case 'treatment':
        return { label: 'Tratamiento', color: 'purple' }
      case 'recovery':
        return { label: 'Recuperación', color: 'orange' }
      case 'completed':
        return { label: 'Finalizado', color: 'green' }
      case 'follow_up':
        return { label: 'Seguimiento', color: 'indigo' }
    }
  }

  const config = getStatusConfig(status)
  const Icon = config.icon

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Badge variant={config.color as any} size={size}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>

      {sessionNumber && totalSessions && (
        <Badge variant="gray" size={size}>
          Sesión {sessionNumber}/{totalSessions}
        </Badge>
      )}

      {showPhase && phase && (
        <Badge variant={getPhaseConfig(phase).color as any} size={size}>
          {getPhaseConfig(phase).label}
        </Badge>
      )}
    </div>
  )
}
