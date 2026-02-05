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
  language?: 'es' | 'en'
}

export function AppointmentStatusBadge({
  status,
  phase,
  sessionNumber,
  totalSessions,
  showPhase = false,
  size = 'md',
  language = 'es',
}: AppointmentStatusBadgeProps) {
  const getStatusConfig = (status: AppointmentLevelStatus) => {
    const labels = {
      scheduled: language === 'es' ? 'Agendada' : 'Scheduled',
      confirmed: language === 'es' ? 'Confirmada' : 'Confirmed',
      in_progress: language === 'es' ? 'En Curso' : 'In Progress',
      completed: language === 'es' ? 'Completada' : 'Completed',
      noshow: language === 'es' ? 'No Asistió' : 'No Show',
      cancelled: language === 'es' ? 'Cancelada' : 'Cancelled',
    }

    switch (status) {
      case 'scheduled':
        return {
          label: labels.scheduled,
          color: 'blue',
          icon: Calendar,
        }
      case 'confirmed':
        return {
          label: labels.confirmed,
          color: 'green',
          icon: CheckCircle2,
        }
      case 'in_progress':
        return {
          label: labels.in_progress,
          color: 'purple',
          icon: PlayCircle,
        }
      case 'completed':
        return {
          label: labels.completed,
          color: 'green',
          icon: CheckCircle2,
        }
      case 'noshow':
        return {
          label: labels.noshow,
          color: 'red',
          icon: XCircle,
        }
      case 'cancelled':
        return {
          label: labels.cancelled,
          color: 'gray',
          icon: XCircle,
        }
    }
  }

  const getPhaseConfig = (phase: TreatmentPhase) => {
    const labels = {
      consultation: language === 'es' ? 'Consulta' : 'Consultation',
      treatment: language === 'es' ? 'Tratamiento' : 'Treatment',
      recovery: language === 'es' ? 'Recuperación' : 'Recovery',
      completed: language === 'es' ? 'Finalizado' : 'Completed',
      follow_up: language === 'es' ? 'Seguimiento' : 'Follow-up',
    }

    switch (phase) {
      case 'consultation':
        return { label: labels.consultation, color: 'blue' }
      case 'treatment':
        return { label: labels.treatment, color: 'purple' }
      case 'recovery':
        return { label: labels.recovery, color: 'orange' }
      case 'completed':
        return { label: labels.completed, color: 'green' }
      case 'follow_up':
        return { label: labels.follow_up, color: 'indigo' }
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
          {language === 'es' ? 'Sesión' : 'Session'} {sessionNumber}/{totalSessions}
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
