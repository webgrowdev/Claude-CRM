'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  X,
  ChevronRight,
  ChevronLeft,
  UserPlus,
  Phone,
  Calendar,
  CheckCircle,
  MessageCircle,
  TrendingUp,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/i18n'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  tip?: string
}

interface OnboardingProps {
  onComplete: () => void
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const { t } = useLanguage()

  const onboardingSteps: OnboardingStep[] = useMemo(() => [
    {
      id: 'welcome',
      title: t.onboarding.welcome,
      description: t.onboarding.welcomeDesc,
      icon: <Sparkles className="w-8 h-8" />,
      tip: t.onboarding.tipSkip,
    },
    {
      id: 'add-patient',
      title: t.onboarding.addPatients,
      description: t.onboarding.addPatientsDesc,
      icon: <UserPlus className="w-8 h-8" />,
      tip: t.onboarding.tipNew,
    },
    {
      id: 'contact',
      title: t.onboarding.contactPatients,
      description: t.onboarding.contactPatientsDesc,
      icon: <Phone className="w-8 h-8" />,
      tip: t.onboarding.tipContacted,
    },
    {
      id: 'schedule',
      title: t.onboarding.scheduleAppointments,
      description: t.onboarding.scheduleAppointmentsDesc,
      icon: <Calendar className="w-8 h-8" />,
      tip: t.onboarding.tipScheduled,
    },
    {
      id: 'followup',
      title: t.onboarding.followUp,
      description: t.onboarding.followUpDesc,
      icon: <MessageCircle className="w-8 h-8" />,
      tip: t.onboarding.tipNotes,
    },
    {
      id: 'close',
      title: t.onboarding.closeSales,
      description: t.onboarding.closeSalesDesc,
      icon: <CheckCircle className="w-8 h-8" />,
      tip: t.onboarding.tipReports,
    },
    {
      id: 'done',
      title: t.onboarding.ready,
      description: t.onboarding.readyDesc,
      icon: <TrendingUp className="w-8 h-8" />,
      tip: t.onboarding.tipCalendar,
    },
  ], [t])

  const step = onboardingSteps[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === onboardingSteps.length - 1

  const handleNext = () => {
    if (isLastStep) {
      handleComplete()
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleComplete = () => {
    setIsVisible(false)
    setTimeout(() => {
      localStorage.setItem('clinic_onboarding_completed', 'true')
      onComplete()
    }, 300)
  }

  const handleSkip = () => {
    handleComplete()
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-500"
            style={{ width: `${((currentStep + 1) / onboardingSteps.length) * 100}%` }}
          />
        </div>

        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-8 pt-10">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
              {step.icon}
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex justify-center gap-1.5 mb-6">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-300',
                  index === currentStep
                    ? 'w-6 bg-primary-500'
                    : index < currentStep
                    ? 'bg-primary-300'
                    : 'bg-slate-200'
                )}
              />
            ))}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-3">
            {step.title}
          </h2>

          {/* Description */}
          <p className="text-slate-600 text-center leading-relaxed mb-4">
            {step.description}
          </p>

          {/* Tip */}
          {step.tip && (
            <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 mb-6">
              <p className="text-sm text-primary-700 text-center">
                <span className="font-semibold">💡 {t.onboarding.tip}:</span> {step.tip}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-8 pb-8 flex items-center justify-between gap-4">
          <button
            onClick={handlePrev}
            disabled={isFirstStep}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all',
              isFirstStep
                ? 'text-slate-300 cursor-not-allowed'
                : 'text-slate-600 hover:bg-slate-100'
            )}
          >
            <ChevronLeft className="w-5 h-5" />
            {t.common.previous}
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary-500/25"
          >
            {isLastStep ? t.onboarding.start : t.common.next}
            {!isLastStep && <ChevronRight className="w-5 h-5" />}
          </button>
        </div>

        {/* Skip link */}
        {!isLastStep && (
          <div className="px-8 pb-6 text-center">
            <button
              onClick={handleSkip}
              className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
            >
              {t.onboarding.skipTutorial}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Hook to check if onboarding should be shown
export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const completed = localStorage.getItem('clinic_onboarding_completed')
    setShowOnboarding(!completed)
    setIsLoaded(true)
  }, [])

  const completeOnboarding = () => {
    setShowOnboarding(false)
  }

  const resetOnboarding = () => {
    localStorage.removeItem('clinic_onboarding_completed')
    setShowOnboarding(true)
  }

  return { showOnboarding, isLoaded, completeOnboarding, resetOnboarding }
}
