'use client'

import { Badge } from '@/components/ui'
import { AppointmentStatus, TreatmentPhase } from '@/types'
import { CheckCircle2, Clock, AlertTriangle, XCircle, PlayCircle, Calendar } from 'lucide-react'

interface AppointmentStatusBadgeProps {
  status: AppointmentStatus
  phase?: TreatmentPhase
  sessionNumber?: number
  totalSessions?: number
  showPhase?: boolean
  size?: 'sm' | 'md'
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
  const getStatusConfig = (status: AppointmentStatus) => {
    const labels = {
      pending: language === 'es' ? 'Pendiente' : 'Pending',
      confirmed: language === 'es' ? 'Confirmada' : 'Confirmed',
      completed: language === 'es' ? 'Completada' : 'Completed',
      'no-show': language === 'es' ? 'No Asistió' : 'No Show',
      cancelled: language === 'es' ? 'Cancelada' : 'Cancelled',
    }

    switch (status) {
      case 'pending':
        return {
          label: labels.pending,
          color: 'primary' as const,
          icon: Calendar,
        }
      case 'confirmed':
        return {
          label: labels.confirmed,
          color: 'success' as const,
          icon: CheckCircle2,
        }
      case 'completed':
        return {
          label: labels.completed,
          color: 'success' as const,
          icon: CheckCircle2,
        }
      case 'no-show':
        return {
          label: labels['no-show'],
          color: 'error' as const,
          icon: XCircle,
        }
      case 'cancelled':
        return {
          label: labels.cancelled,
          color: 'outline' as const,
          icon: XCircle,
        }
      default:
        // Fallback for unexpected status
        return {
          label: status,
          color: 'default' as const,
          icon: Clock,
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
        return { label: labels.consultation, color: 'primary' as const }
      case 'treatment':
        return { label: labels.treatment, color: 'secondary' as const }
      case 'recovery':
        return { label: labels.recovery, color: 'warning' as const }
      case 'completed':
        return { label: labels.completed, color: 'success' as const }
      case 'follow_up':
        return { label: labels.follow_up, color: 'primary' as const }
    }
  }

  const config = getStatusConfig(status)
  const Icon = config.icon

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Badge variant={config.color} size={size}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>

      {sessionNumber && totalSessions && (
        <Badge variant="outline" size={size}>
          {language === 'es' ? 'Sesión' : 'Session'} {sessionNumber}/{totalSessions}
        </Badge>
      )}

      {showPhase && phase && (
        <Badge variant={getPhaseConfig(phase).color} size={size}>
          {getPhaseConfig(phase).label}
        </Badge>
      )}
    </div>
  )
}
