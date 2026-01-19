'use client'

import { useMemo } from 'react'
import { Flame, Thermometer, Snowflake, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/i18n'
import { getScoreLabel, getScoreLabelES } from '@/services/leadScoring'

interface LeadScoreBadgeProps {
  score: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

export function LeadScoreBadge({
  score,
  showLabel = true,
  size = 'md',
  showIcon = true,
  className,
}: LeadScoreBadgeProps) {
  const { language } = useLanguage()

  const scoreInfo = useMemo(() => {
    return language === 'es' ? getScoreLabelES(score) : getScoreLabel(score)
  }, [score, language])

  const Icon = useMemo(() => {
    if (score >= 80) return Flame
    if (score >= 60) return TrendingUp
    if (score >= 40) return Thermometer
    return Snowflake
  }, [score])

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-1',
    md: 'text-sm px-2 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2',
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full font-medium transition-all',
        sizeClasses[size],
        scoreInfo.bgColor,
        scoreInfo.color,
        className
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      <span className="font-bold">{score}</span>
      {showLabel && <span className="opacity-80">• {scoreInfo.label}</span>}
    </div>
  )
}

interface LeadScoreDetailProps {
  score: {
    total: number
    engagement: number
    value: number
    timing: number
    fit: number
  }
  className?: string
}

export function LeadScoreDetail({ score, className }: LeadScoreDetailProps) {
  const { language } = useLanguage()

  const labels = language === 'es'
    ? {
        engagement: 'Interacción',
        value: 'Valor',
        timing: 'Timing',
        fit: 'Perfil',
      }
    : {
        engagement: 'Engagement',
        value: 'Value',
        timing: 'Timing',
        fit: 'Fit',
      }

  const categories = [
    { key: 'engagement', label: labels.engagement, value: score.engagement, max: 30, color: 'bg-purple-500' },
    { key: 'value', label: labels.value, value: score.value, max: 25, color: 'bg-green-500' },
    { key: 'timing', label: labels.timing, value: score.timing, max: 25, color: 'bg-blue-500' },
    { key: 'fit', label: labels.fit, value: score.fit, max: 20, color: 'bg-amber-500' },
  ]

  return (
    <div className={cn('space-y-3', className)}>
      {/* Total Score */}
      <div className="text-center">
        <LeadScoreBadge score={score.total} size="lg" />
      </div>

      {/* Category Breakdown */}
      <div className="space-y-2">
        {categories.map(cat => {
          const percentage = (cat.value / cat.max) * 100
          return (
            <div key={cat.key}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-600">{cat.label}</span>
                <span className="font-medium text-slate-800">{cat.value}/{cat.max}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', cat.color)}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
