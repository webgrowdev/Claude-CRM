'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  CheckCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/i18n/LanguageContext'

export interface TourStep {
  target: string // CSS selector for the target element
  title: string
  content: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
  highlightPadding?: number
  action?: () => void // Optional action to perform when showing this step
}

interface GuidedTourProps {
  steps: TourStep[]
  isActive: boolean
  onComplete: () => void
  onSkip: () => void
  tourId: string // Unique ID for localStorage
}

export function GuidedTour({
  steps,
  isActive,
  onComplete,
  onSkip,
  tourId,
}: GuidedTourProps) {
  const { language } = useLanguage()
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const t = {
    next: language === 'es' ? 'Siguiente' : 'Next',
    prev: language === 'es' ? 'Anterior' : 'Previous',
    finish: language === 'es' ? 'Finalizar' : 'Finish',
    skip: language === 'es' ? 'Saltar tour' : 'Skip tour',
    stepOf: language === 'es' ? 'de' : 'of',
  }

  const step = steps[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1

  // Find and highlight the target element
  const updateTargetPosition = useCallback(() => {
    if (!step?.target) return

    const element = document.querySelector(step.target)
    if (element) {
      const rect = element.getBoundingClientRect()
      setTargetRect(rect)

      // Scroll element into view if needed
      const isInViewport =
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= window.innerHeight &&
        rect.right <= window.innerWidth

      if (!isInViewport) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        // Update position after scroll
        setTimeout(() => {
          setTargetRect(element.getBoundingClientRect())
        }, 500)
      }
    }
  }, [step?.target])

  useEffect(() => {
    if (!isActive) return

    updateTargetPosition()

    // Execute step action if provided
    if (step?.action) {
      step.action()
    }

    // Listen for window resize and scroll
    window.addEventListener('resize', updateTargetPosition)
    window.addEventListener('scroll', updateTargetPosition, true)

    return () => {
      window.removeEventListener('resize', updateTargetPosition)
      window.removeEventListener('scroll', updateTargetPosition, true)
    }
  }, [isActive, currentStep, step, updateTargetPosition])

  const handleNext = () => {
    if (isLastStep) {
      localStorage.setItem(`tour_${tourId}_completed`, 'true')
      onComplete()
    } else {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentStep(prev => prev + 1)
        setIsAnimating(false)
      }, 200)
    }
  }

  const handlePrev = () => {
    if (!isFirstStep) {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentStep(prev => prev - 1)
        setIsAnimating(false)
      }, 200)
    }
  }

  const handleSkip = () => {
    localStorage.setItem(`tour_${tourId}_completed`, 'true')
    onSkip()
  }

  if (!isActive || !step) return null

  // Calculate tooltip position
  const getTooltipPosition = () => {
    if (!targetRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }

    const padding = step.highlightPadding || 8
    const tooltipWidth = 320
    const tooltipHeight = 180

    let top = 0
    let left = 0

    const placement = step.placement || 'bottom'

    switch (placement) {
      case 'top':
        top = targetRect.top - tooltipHeight - padding - 12
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2
        break
      case 'bottom':
        top = targetRect.bottom + padding + 12
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2
        break
      case 'left':
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2
        left = targetRect.left - tooltipWidth - padding - 12
        break
      case 'right':
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2
        left = targetRect.right + padding + 12
        break
    }

    // Keep tooltip within viewport
    if (left < 16) left = 16
    if (left + tooltipWidth > window.innerWidth - 16) left = window.innerWidth - tooltipWidth - 16
    if (top < 16) top = 16
    if (top + tooltipHeight > window.innerHeight - 16) top = window.innerHeight - tooltipHeight - 16

    return { top: `${top}px`, left: `${left}px` }
  }

  const tooltipPosition = getTooltipPosition()

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      {/* Overlay with cutout */}
      <svg className="fixed inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - (step.highlightPadding || 8)}
                y={targetRect.top - (step.highlightPadding || 8)}
                width={targetRect.width + (step.highlightPadding || 8) * 2}
                height={targetRect.height + (step.highlightPadding || 8) * 2}
                rx="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.75)"
          mask="url(#tour-mask)"
          className="pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        />
      </svg>

      {/* Highlight border */}
      {targetRect && (
        <div
          className="fixed border-2 border-primary-500 rounded-lg pointer-events-none animate-pulse"
          style={{
            top: targetRect.top - (step.highlightPadding || 8),
            left: targetRect.left - (step.highlightPadding || 8),
            width: targetRect.width + (step.highlightPadding || 8) * 2,
            height: targetRect.height + (step.highlightPadding || 8) * 2,
            boxShadow: '0 0 0 4px rgba(var(--primary-500), 0.2), 0 0 20px rgba(var(--primary-500), 0.3)',
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={cn(
          'fixed w-80 bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300',
          isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        )}
        style={tooltipPosition}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600">
          <div className="flex items-center gap-2 text-white">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">
              {currentStep + 1} {t.stepOf} {steps.length}
            </span>
          </div>
          <button
            onClick={handleSkip}
            className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-slate-800 mb-2">{step.title}</h3>
          <p className="text-sm text-slate-600 leading-relaxed">{step.content}</p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 pb-3">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={cn(
                'w-2 h-2 rounded-full transition-all',
                index === currentStep
                  ? 'w-4 bg-primary-500'
                  : index < currentStep
                  ? 'bg-primary-300'
                  : 'bg-slate-200 hover:bg-slate-300'
              )}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-4 pb-4">
          <button
            onClick={handlePrev}
            disabled={isFirstStep}
            className={cn(
              'flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isFirstStep
                ? 'text-slate-300 cursor-not-allowed'
                : 'text-slate-600 hover:bg-slate-100'
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            {t.prev}
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {isLastStep ? (
              <>
                <CheckCircle className="w-4 h-4" />
                {t.finish}
              </>
            ) : (
              <>
                {t.next}
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Skip link */}
        {!isLastStep && (
          <div className="px-4 pb-4 text-center border-t border-slate-100 pt-3">
            <button
              onClick={handleSkip}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              {t.skip}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

// Hook to manage tour state
export function useTour(tourId: string) {
  const [isActive, setIsActive] = useState(false)
  const [hasCompleted, setHasCompleted] = useState(true)

  useEffect(() => {
    const completed = localStorage.getItem(`tour_${tourId}_completed`)
    setHasCompleted(!!completed)
  }, [tourId])

  const startTour = useCallback(() => {
    setIsActive(true)
  }, [])

  const completeTour = useCallback(() => {
    setIsActive(false)
    setHasCompleted(true)
  }, [])

  const skipTour = useCallback(() => {
    setIsActive(false)
    setHasCompleted(true)
  }, [])

  const resetTour = useCallback(() => {
    localStorage.removeItem(`tour_${tourId}_completed`)
    setHasCompleted(false)
  }, [tourId])

  return {
    isActive,
    hasCompleted,
    startTour,
    completeTour,
    skipTour,
    resetTour,
  }
}

// Preset tour configurations
export const dashboardTourSteps: TourStep[] = [
  {
    target: '[data-tour="stats-cards"]',
    title: 'Panel de Estadísticas',
    content: 'Aquí puedes ver un resumen rápido de tus leads, citas y conversiones del día.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="insights"]',
    title: 'Acciones Recomendadas',
    content: 'Te mostramos los leads que necesitan atención urgente y las acciones sugeridas para mejorar tus conversiones.',
    placement: 'top',
  },
  {
    target: '[data-tour="quick-actions"]',
    title: 'Acciones Rápidas',
    content: 'Usa estos botones para realizar acciones comunes sin navegar a otras páginas.',
    placement: 'left',
  },
]

export const inboxTourSteps: TourStep[] = [
  {
    target: '[data-tour="inbox-filters"]',
    title: 'Filtros de Inbox',
    content: 'Filtra tus leads por estado para enfocarte en los que necesitan atención.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="lead-card"]',
    title: 'Tarjeta de Lead',
    content: 'Cada tarjeta muestra información clave del lead. Toca para ver los detalles completos.',
    placement: 'bottom',
  },
]
