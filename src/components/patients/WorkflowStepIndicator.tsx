'use client'

import React from 'react'
import { Check, Circle, Clock, Phone, Calendar, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ActivityStatus } from '@/types'
import { useLanguage } from '@/i18n/LanguageContext'

interface WorkflowStep {
  id: ActivityStatus
  icon: React.ElementType
}

interface WorkflowStepIndicatorProps {
  currentStatus: ActivityStatus
  className?: string
}

const workflowSteps: WorkflowStep[] = [
  { id: 'new', icon: Circle },
  { id: 'contacted', icon: Phone },
  { id: 'scheduled', icon: Calendar },
  { id: 'completed', icon: CheckCircle2 },
]

const statusOrder: ActivityStatus[] = ['new', 'contacted', 'scheduled', 'completed', 'dropped', 'lost']

export function WorkflowStepIndicator({ currentStatus, className }: WorkflowStepIndicatorProps) {
  const { t, language } = useLanguage()
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
              {currentStatus === 'dropped' ? t.workflow.droppedTitle : t.workflow.lostTitle}
            </p>
            <p className="text-sm text-slate-500">
              {currentStatus === 'dropped' ? t.workflow.droppedDesc : t.workflow.lostDesc}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200', className)}>
      <h3 className="text-sm font-semibold text-slate-700 mb-3">
        {t.workflow.title}
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
            
            // Get translated labels using activityStatus from i18n
            const statusKey = step.id as keyof typeof t.activityStatus
            const label = t.activityStatus[statusKey]
            const descKey = `${step.id}Desc` as keyof typeof t.workflow
            const description = t.workflow[descKey] as string || ''

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
                    {label}
                  </p>
                  {isCurrent && description && (
                    <p className="text-xs text-blue-600 mt-0.5">
                      {description}
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
  onContact,
  onSchedule,
  onComplete,
  className,
}: WorkflowCTAProps) {
  const { t } = useLanguage()
  
  const getCTAContent = () => {
    switch (currentStatus) {
      case 'new':
        return {
          title: t.workflow.nextStep,
          description: t.workflow.contactLeadDesc,
          buttonText: t.workflow.contactLeadCTA,
          buttonIcon: Phone,
          buttonColor: 'bg-blue-500 hover:bg-blue-600 text-white',
          onClick: onContact,
        }
      case 'contacted':
        return {
          title: t.workflow.nextStep,
          description: t.workflow.scheduleAppointmentDesc,
          buttonText: t.workflow.scheduleAppointmentCTA,
          buttonIcon: Calendar,
          buttonColor: 'bg-purple-500 hover:bg-purple-600 text-white',
          onClick: onSchedule,
        }
      case 'scheduled':
        return {
          title: t.workflow.appointmentScheduled,
          description: t.workflow.markCompletedDesc,
          buttonText: t.workflow.markCompletedCTA,
          buttonIcon: CheckCircle2,
          buttonColor: 'bg-success-500 hover:bg-success-600 text-white',
          onClick: onComplete,
        }
      case 'completed':
        return {
          title: t.workflow.activityCompleted,
          description: t.workflow.activityCompletedDesc,
          buttonText: t.workflow.newActivity,
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
  onAction?: () => void
  className?: string
}

export function WorkflowEmptyState({ currentStatus, onAction, className }: WorkflowEmptyStateProps) {
  const { t } = useLanguage()
  
  const getEmptyStateContent = () => {
    switch (currentStatus) {
      case 'new':
        return {
          icon: Phone,
          title: t.workflow.noActivitiesTitle,
          description: t.workflow.noActivitiesDesc,
          actionText: t.workflow.contactNow,
        }
      case 'contacted':
        return {
          icon: Calendar,
          title: t.workflow.noFollowUpsTitle,
          description: t.workflow.noFollowUpsDesc,
          actionText: t.workflow.scheduleFollowUp,
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
