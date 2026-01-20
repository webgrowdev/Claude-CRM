'use client'

import { useState } from 'react'
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Send,
  Check,
  Smile,
  Meh,
  Frown,
} from 'lucide-react'
import { Button, TextArea, Modal } from '@/components/ui'
import { useLanguage } from '@/i18n/LanguageContext'
import { SurveyResponse } from '@/types'
import { cn } from '@/lib/utils'

interface SatisfactionSurveyProps {
  patientName: string
  treatmentName?: string
  appointmentId?: string
  onSubmit: (response: Omit<SurveyResponse, 'id' | 'createdAt'>) => void
  onClose?: () => void
}

export function SatisfactionSurvey({
  patientName,
  treatmentName,
  appointmentId,
  onSubmit,
  onClose,
}: SatisfactionSurveyProps) {
  const { language } = useLanguage()
  const [step, setStep] = useState(1)
  const [overallRating, setOverallRating] = useState<number>(0)
  const [npsScore, setNpsScore] = useState<number | null>(null)
  const [feedback, setFeedback] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const t = {
    title: language === 'es' ? 'Encuesta de Satisfacción' : 'Satisfaction Survey',
    hello: language === 'es' ? 'Hola' : 'Hello',
    thankYou: language === 'es'
      ? 'Gracias por visitarnos. Tu opinión es muy importante para nosotros.'
      : 'Thank you for visiting us. Your feedback is very important to us.',
    rateExperience: language === 'es'
      ? '¿Cómo calificarías tu experiencia general?'
      : 'How would you rate your overall experience?',
    recommendQuestion: language === 'es'
      ? '¿Qué tan probable es que nos recomiendes a un amigo o familiar?'
      : 'How likely are you to recommend us to a friend or family member?',
    notLikely: language === 'es' ? 'Nada probable' : 'Not likely',
    veryLikely: language === 'es' ? 'Muy probable' : 'Very likely',
    feedbackQuestion: language === 'es'
      ? '¿Tienes algún comentario adicional o sugerencia?'
      : 'Do you have any additional comments or suggestions?',
    feedbackPlaceholder: language === 'es'
      ? 'Cuéntanos cómo podemos mejorar...'
      : 'Tell us how we can improve...',
    submit: language === 'es' ? 'Enviar' : 'Submit',
    next: language === 'es' ? 'Siguiente' : 'Next',
    skip: language === 'es' ? 'Omitir' : 'Skip',
    thankYouSubmit: language === 'es'
      ? '¡Gracias por tu feedback!'
      : 'Thank you for your feedback!',
    close: language === 'es' ? 'Cerrar' : 'Close',
    treatment: language === 'es' ? 'Tratamiento' : 'Treatment',
    poor: language === 'es' ? 'Malo' : 'Poor',
    fair: language === 'es' ? 'Regular' : 'Fair',
    good: language === 'es' ? 'Bueno' : 'Good',
    veryGood: language === 'es' ? 'Muy bueno' : 'Very Good',
    excellent: language === 'es' ? 'Excelente' : 'Excellent',
  }

  const ratingLabels = [t.poor, t.fair, t.good, t.veryGood, t.excellent]

  const handleSubmit = () => {
    const response: Omit<SurveyResponse, 'id' | 'createdAt'> = {
      leadId: '', // Will be filled by parent
      appointmentId,
      responses: [
        { questionId: 'overall_rating', answer: overallRating },
        { questionId: 'nps', answer: npsScore ?? 0 },
      ],
      npsScore: npsScore ?? undefined,
      overallRating,
      feedback: feedback || undefined,
      sentAt: new Date(),
      completedAt: new Date(),
    }

    onSubmit(response)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">{t.thankYouSubmit}</h3>
        <p className="text-slate-600 mb-6">
          {language === 'es'
            ? 'Tu opinión nos ayuda a mejorar cada día.'
            : 'Your feedback helps us improve every day.'}
        </p>
        {onClose && (
          <Button onClick={onClose}>{t.close}</Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-800">{t.title}</h2>
        <p className="text-slate-600 mt-1">
          {t.hello}, {patientName}! {t.thankYou}
        </p>
        {treatmentName && (
          <p className="text-sm text-primary-600 mt-2">
            {t.treatment}: {treatmentName}
          </p>
        )}
      </div>

      {/* Step 1: Overall Rating */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-center font-medium text-slate-700">{t.rateExperience}</p>

          {/* Star Rating */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                onClick={() => setOverallRating(rating)}
                className={cn(
                  'p-2 transition-all',
                  overallRating >= rating
                    ? 'text-amber-400 scale-110'
                    : 'text-slate-300 hover:text-amber-300'
                )}
              >
                <Star
                  className="w-10 h-10"
                  fill={overallRating >= rating ? 'currentColor' : 'none'}
                />
              </button>
            ))}
          </div>

          {overallRating > 0 && (
            <p className="text-center text-lg font-medium text-slate-700">
              {ratingLabels[overallRating - 1]}
            </p>
          )}

          {/* Emoji indicators */}
          <div className="flex justify-center gap-8 pt-4">
            <div className={cn(
              'flex flex-col items-center transition-opacity',
              overallRating > 0 && overallRating <= 2 ? 'opacity-100' : 'opacity-30'
            )}>
              <Frown className="w-8 h-8 text-red-400" />
            </div>
            <div className={cn(
              'flex flex-col items-center transition-opacity',
              overallRating === 3 ? 'opacity-100' : 'opacity-30'
            )}>
              <Meh className="w-8 h-8 text-amber-400" />
            </div>
            <div className={cn(
              'flex flex-col items-center transition-opacity',
              overallRating >= 4 ? 'opacity-100' : 'opacity-30'
            )}>
              <Smile className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              fullWidth
              onClick={() => {
                setOverallRating(3)
                setStep(2)
              }}
            >
              {t.skip}
            </Button>
            <Button
              fullWidth
              onClick={() => setStep(2)}
              disabled={overallRating === 0}
            >
              {t.next}
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: NPS Score */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-center font-medium text-slate-700">{t.recommendQuestion}</p>

          {/* NPS Scale 0-10 */}
          <div className="flex justify-center gap-1 flex-wrap">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
              <button
                key={score}
                onClick={() => setNpsScore(score)}
                className={cn(
                  'w-10 h-10 rounded-lg text-sm font-bold transition-all',
                  npsScore === score
                    ? score <= 6
                      ? 'bg-red-500 text-white'
                      : score <= 8
                      ? 'bg-amber-500 text-white'
                      : 'bg-green-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {score}
              </button>
            ))}
          </div>

          <div className="flex justify-between text-xs text-slate-500 px-2">
            <span>{t.notLikely}</span>
            <span>{t.veryLikely}</span>
          </div>

          {/* NPS Category Display */}
          {npsScore !== null && (
            <div className={cn(
              'text-center py-2 px-4 rounded-lg',
              npsScore <= 6
                ? 'bg-red-50 text-red-700'
                : npsScore <= 8
                ? 'bg-amber-50 text-amber-700'
                : 'bg-green-50 text-green-700'
            )}>
              {npsScore <= 6
                ? (language === 'es' ? 'Detractor' : 'Detractor')
                : npsScore <= 8
                ? (language === 'es' ? 'Pasivo' : 'Passive')
                : (language === 'es' ? 'Promotor' : 'Promoter')}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" fullWidth onClick={() => setStep(1)}>
              {language === 'es' ? 'Atrás' : 'Back'}
            </Button>
            <Button fullWidth onClick={() => setStep(3)}>
              {t.next}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Open Feedback */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-center font-medium text-slate-700">{t.feedbackQuestion}</p>

          <TextArea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder={t.feedbackPlaceholder}
            className="min-h-[120px]"
          />

          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setStep(2)}>
              {language === 'es' ? 'Atrás' : 'Back'}
            </Button>
            <Button fullWidth onClick={handleSubmit}>
              <Send className="w-4 h-4 mr-2" />
              {t.submit}
            </Button>
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="flex justify-center gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={cn(
              'w-2 h-2 rounded-full transition-colors',
              step >= s ? 'bg-primary-500' : 'bg-slate-200'
            )}
          />
        ))}
      </div>
    </div>
  )
}

interface SatisfactionSurveyModalProps {
  isOpen: boolean
  onClose: () => void
  patientName: string
  treatmentName?: string
  appointmentId?: string
  leadId: string
  onSubmit: (response: Omit<SurveyResponse, 'id' | 'createdAt'>) => void
}

export function SatisfactionSurveyModal({
  isOpen,
  onClose,
  patientName,
  treatmentName,
  appointmentId,
  leadId,
  onSubmit,
}: SatisfactionSurveyModalProps) {
  const { language } = useLanguage()

  const handleSubmit = (response: Omit<SurveyResponse, 'id' | 'createdAt'>) => {
    onSubmit({
      ...response,
      leadId,
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="md"
    >
      <SatisfactionSurvey
        patientName={patientName}
        treatmentName={treatmentName}
        appointmentId={appointmentId}
        onSubmit={handleSubmit}
        onClose={onClose}
      />
    </Modal>
  )
}

/**
 * Calculate NPS score from survey responses
 */
export function calculateNPS(responses: SurveyResponse[]): number {
  if (responses.length === 0) return 0

  const npsResponses = responses.filter(r => r.npsScore !== undefined)
  if (npsResponses.length === 0) return 0

  const promoters = npsResponses.filter(r => (r.npsScore ?? 0) >= 9).length
  const detractors = npsResponses.filter(r => (r.npsScore ?? 0) <= 6).length

  const promoterPercentage = (promoters / npsResponses.length) * 100
  const detractorPercentage = (detractors / npsResponses.length) * 100

  return Math.round(promoterPercentage - detractorPercentage)
}

/**
 * Get NPS label and color
 */
export function getNPSLabel(nps: number, language: 'en' | 'es' = 'es'): {
  label: string
  color: string
  bgColor: string
} {
  if (nps >= 50) {
    return {
      label: language === 'es' ? 'Excelente' : 'Excellent',
      color: 'text-green-700',
      bgColor: 'bg-green-100',
    }
  } else if (nps >= 0) {
    return {
      label: language === 'es' ? 'Bueno' : 'Good',
      color: 'text-amber-700',
      bgColor: 'bg-amber-100',
    }
  } else {
    return {
      label: language === 'es' ? 'Necesita mejorar' : 'Needs improvement',
      color: 'text-red-700',
      bgColor: 'bg-red-100',
    }
  }
}
