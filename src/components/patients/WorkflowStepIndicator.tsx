'use client'

import React from 'react'
import { Check, Circle, Clock, Phone, Calendar, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ActivityStatus } from '@/types'

interface WorkflowStep {
  id: ActivityStatus
  label: string
  labelEs: string
  icon: React.ElementType
  description: string
  descriptionEs: string
}

interface WorkflowStepIndicatorProps {
  currentStatus: ActivityStatus
  language?: 'en' | 'es'
  className?: string
}

const workflowSteps: WorkflowStep[] = [
  {
    id: 'new',
    label: 'New Lead',
    labelEs: 'Lead Nuevo',
    icon: Circle,
    description: 'Lead received',
    descriptionEs: 'Lead recibido',
  },
  {
    id: 'contacted',
    label: 'Contact Made',
    labelEs: 'Contactado',
    icon: Phone,
    description: 'First contact established',
    descriptionEs: 'Primer contacto establecido',
  },
  {
    id: 'scheduled',
    label: 'Scheduled',
    labelEs: 'Agendado',
    icon: Calendar,
    description: 'Appointment scheduled',
    descriptionEs: 'Cita agendada',
  },
  {
    id: 'completed',
    label: 'Completed',
    labelEs: 'Completado',
    icon: CheckCircle2,
    description: 'Service completed',
    descriptionEs: 'Servicio completado',
  },
]

const statusOrder: ActivityStatus[] = ['new', 'contacted', 'scheduled', 'completed', 'dropped', 'lost']

export function WorkflowStepIndicator({ currentStatus, language = 'es', className }: WorkflowStepIndicatorProps) {
  const currentIndex = statusOrder.indexOf(currentStatus)
  
  // If status is dropped or lost, show different UI
  if (currentStatus === 'dropped' || currentStatus === 'lost') {
    return (
      <div className={cn('p-4 bg-slate-50 rounded-xl border border-slate-200', className)}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
            <Clock className="w-5 h-5 text-slate-500" />
          </div>
          <div>
            <p className="font-medium text-slate-700">
              {currentStatus === 'dropped'
                ? language === 'es' ? 'Actividad Abandonada' : 'Activity Dropped'
                : language === 'es' ? 'Lead Perdido' : 'Lead Lost'}
            </p>
            <p className="text-sm text-slate-500">
              {currentStatus === 'dropped'
                ? language === 'es' ? 'Sin avance reciente' : 'No recent progress'
                : language === 'es' ? 'No interesado' : 'Not interested'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200', className)}>
      <h3 className="text-sm font-semibold text-slate-700 mb-3">
        {language === 'es' ? 'Progreso del Lead' : 'Lead Progress'}
      </h3>
      <div className="relative">
        {/* Progress bar background */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-slate-200 rounded-full" />
        
        {/* Progress bar fill */}
        <div
          className="absolute top-5 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
          style={{
            width: `${(currentIndex / (workflowSteps.length - 1)) * 100}%`,
          }}
        />
        
        {/* Steps */}
        <div className="relative flex justify-between">
          {workflowSteps.map((step, index) => {
            const isCompleted = statusOrder.indexOf(step.id) < currentIndex
            const isCurrent = step.id === currentStatus
            const isPending = statusOrder.indexOf(step.id) > currentIndex

            const StepIcon = step.icon

            return (
              <div key={step.id} className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 relative z-10',
                    isCompleted && 'bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg shadow-blue-500/30',
                    isCurrent && 'bg-gradient-to-br from-blue-500 to-purple-500 ring-4 ring-blue-200 shadow-xl shadow-blue-500/40 animate-pulse',
                    isPending && 'bg-white border-2 border-slate-300'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <StepIcon
                      className={cn(
                        'w-5 h-5',
                        isCurrent && 'text-white',
                        isPending && 'text-slate-400'
                      )}
                    />
                  )}
                </div>
                <div className="mt-2 text-center max-w-[80px]">
                  <p
                    className={cn(
                      'text-xs font-medium transition-colors',
                      (isCompleted || isCurrent) && 'text-slate-800',
                      isPending && 'text-slate-400'
                    )}
                  >
                    {language === 'es' ? step.labelEs : step.label}
                  </p>
                  {isCurrent && (
                    <p className="text-xs text-blue-600 mt-0.5">
                      {language === 'es' ? step.descriptionEs : step.description}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

interface WorkflowCTAProps {
  currentStatus: ActivityStatus
  patientId: string
  patientName: string
  patientPhone: string
  language?: 'en' | 'es'
  onContact?: () => void
  onSchedule?: () => void
  onComplete?: () => void
  className?: string
}

export function WorkflowCTA({
  currentStatus,
  patientId,
  patientName,
  patientPhone,
  language = 'es',
  onContact,
  onSchedule,
  onComplete,
  className,
}: WorkflowCTAProps) {
  const getCTAContent = () => {
    switch (currentStatus) {
      case 'new':
        return {
          title: language === 'es' ? '¿Siguiente paso?' : 'Next step?',
          description: language === 'es' ? 'Contacta a este lead para iniciar la conversación.' : 'Contact this lead to start the conversation.',
          buttonText: language === 'es' ? 'Contactar Lead' : 'Contact Lead',
          buttonIcon: Phone,
          buttonColor: 'bg-blue-500 hover:bg-blue-600 text-white',
          onClick: onContact,
        }
      case 'contacted':
        return {
          title: language === 'es' ? '¿Siguiente paso?' : 'Next step?',
          description: language === 'es' ? 'Agenda una cita o seguimiento con el paciente.' : 'Schedule an appointment or follow-up with the patient.',
          buttonText: language === 'es' ? 'Agendar Cita' : 'Schedule Appointment',
          buttonIcon: Calendar,
          buttonColor: 'bg-purple-500 hover:bg-purple-600 text-white',
          onClick: onSchedule,
        }
      case 'scheduled':
        return {
          title: language === 'es' ? 'Cita agendada' : 'Appointment scheduled',
          description: language === 'es' ? 'Confirma cuando el paciente haya asistido a la cita.' : 'Confirm once the patient has attended the appointment.',
          buttonText: language === 'es' ? 'Marcar como Completado' : 'Mark as Completed',
          buttonIcon: CheckCircle2,
          buttonColor: 'bg-success-500 hover:bg-success-600 text-white',
          onClick: onComplete,
        }
      case 'completed':
        return {
          title: language === 'es' ? '¡Completado!' : 'Completed!',
          description: language === 'es' ? 'Esta actividad ha sido completada exitosamente.' : 'This activity has been completed successfully.',
          buttonText: language === 'es' ? 'Nueva Actividad' : 'New Activity',
          buttonIcon: Circle,
          buttonColor: 'bg-slate-500 hover:bg-slate-600 text-white',
          onClick: onSchedule, // Can create a new activity
        }
      default:
        return null
    }
  }

  const cta = getCTAContent()

  if (!cta || currentStatus === 'dropped' || currentStatus === 'lost') {
    return null
  }

  const ButtonIcon = cta.buttonIcon

  return (
    <div className={cn('p-4 bg-white rounded-xl border border-slate-200 shadow-sm', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h4 className="font-semibold text-slate-800 mb-1">{cta.title}</h4>
          <p className="text-sm text-slate-600">{cta.description}</p>
        </div>
        {cta.onClick && (
          <button
            onClick={cta.onClick}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap',
              cta.buttonColor
            )}
          >
            <ButtonIcon className="w-4 h-4" />
            {cta.buttonText}
          </button>
        )}
      </div>
    </div>
  )
}

interface WorkflowEmptyStateProps {
  currentStatus: ActivityStatus
  language?: 'en' | 'es'
  onAction?: () => void
  className?: string
}

export function WorkflowEmptyState({ currentStatus, language = 'es', onAction, className }: WorkflowEmptyStateProps) {
  const getEmptyStateContent = () => {
    switch (currentStatus) {
      case 'new':
        return {
          icon: Phone,
          title: language === 'es' ? 'Sin actividades' : 'No activities',
          description: language === 'es' 
            ? 'Este lead aún no tiene actividades. Contacta al paciente para crear la primera actividad.'
            : 'This lead has no activities yet. Contact the patient to create the first activity.',
          actionText: language === 'es' ? 'Contactar ahora' : 'Contact now',
        }
      case 'contacted':
        return {
          icon: Calendar,
          title: language === 'es' ? 'Sin seguimientos agendados' : 'No follow-ups scheduled',
          description: language === 'es'
            ? 'El lead fue contactado pero aún no tiene seguimientos agendados. Programa una cita o llamada.'
            : 'The lead was contacted but has no follow-ups scheduled. Schedule an appointment or call.',
          actionText: language === 'es' ? 'Agendar seguimiento' : 'Schedule follow-up',
        }
      default:
        return null
    }
  }

  const content = getEmptyStateContent()

  if (!content) {
    return null
  }

  const EmptyIcon = content.icon

  return (
    <div className={cn('flex flex-col items-center justify-center py-8 px-4 text-center', className)}>
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
        <EmptyIcon className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-medium text-slate-700 mb-2">{content.title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-4">{content.description}</p>
      {onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
        >
          {content.actionText}
        </button>
      )}
    </div>
  )
}
