import { Lead, LeadScore, Treatment } from '@/types'
import { differenceInDays } from 'date-fns'

/**
 * Calculate lead score based on various factors
 * Score ranges from 0-100
 */
export function calculateLeadScore(lead: Lead, treatments: Treatment[]): LeadScore {
  let engagement = 0
  let value = 0
  let timing = 0
  let fit = 0

  // === ENGAGEMENT SCORE (max 30) ===

  // Responded to messages/follow-ups
  const completedFollowUps = lead.followUps.filter(f => f.completed).length
  engagement += Math.min(completedFollowUps * 5, 15)

  // Attended appointments
  const attendedAppointments = lead.followUps.filter(
    f => f.type === 'appointment' && f.attendanceStatus === 'attended'
  ).length
  engagement += Math.min(attendedAppointments * 10, 20)

  // Penalty for no-shows
  const noShows = lead.followUps.filter(
    f => f.type === 'appointment' && f.attendanceStatus === 'noshow'
  ).length
  engagement -= Math.min(noShows * 10, 20)

  // Has notes (indicates conversations)
  if (lead.notes.length > 0) {
    engagement += Math.min(lead.notes.length * 2, 10)
  }

  engagement = Math.max(0, Math.min(30, engagement))

  // === VALUE SCORE (max 25) ===

  // Check treatment interest value
  const interestedTreatments = treatments.filter(t =>
    lead.treatments.includes(t.name) || lead.treatments.includes(t.id)
  )

  if (interestedTreatments.length > 0) {
    const maxPrice = Math.max(...interestedTreatments.map(t => t.price))
    if (maxPrice >= 5000) value += 25
    else if (maxPrice >= 2000) value += 20
    else if (maxPrice >= 1000) value += 15
    else if (maxPrice >= 500) value += 10
    else value += 5
  }

  // Already paid something
  if (lead.totalPaid && lead.totalPaid > 0) {
    value += 10
  }

  value = Math.min(25, value)

  // === TIMING SCORE (max 25) ===

  // Recent activity
  const daysSinceCreation = differenceInDays(new Date(), new Date(lead.createdAt))
  const lastActivity = lead.lastContactAt || lead.updatedAt || lead.createdAt
  const daysSinceLastActivity = differenceInDays(new Date(), new Date(lastActivity))

  // Fresh leads get bonus
  if (daysSinceCreation <= 1) timing += 15
  else if (daysSinceCreation <= 3) timing += 12
  else if (daysSinceCreation <= 7) timing += 8
  else if (daysSinceCreation <= 14) timing += 5

  // Recent activity bonus
  if (daysSinceLastActivity <= 1) timing += 10
  else if (daysSinceLastActivity <= 3) timing += 8
  else if (daysSinceLastActivity <= 7) timing += 5
  else if (daysSinceLastActivity > 30) timing -= 10

  // Has upcoming appointments
  const upcomingAppointments = lead.followUps.filter(
    f => !f.completed && new Date(f.scheduledAt) > new Date()
  ).length
  if (upcomingAppointments > 0) timing += 5

  timing = Math.max(0, Math.min(25, timing))

  // === FIT SCORE (max 20) ===

  // Profile completeness
  if (lead.email) fit += 3
  if (lead.phone) fit += 3
  if (lead.identificationNumber) fit += 4
  if (lead.instagram) fit += 2
  if (lead.treatments.length > 0) fit += 3

  // Source quality
  if (lead.source === 'referral') fit += 5
  else if (lead.source === 'instagram') fit += 3
  else if (lead.source === 'whatsapp') fit += 3
  else if (lead.source === 'website') fit += 2

  fit = Math.min(20, fit)

  // === TOTAL SCORE ===
  const total = Math.round(engagement + value + timing + fit)

  return {
    total: Math.max(0, Math.min(100, total)),
    engagement: Math.round(engagement),
    value: Math.round(value),
    timing: Math.round(timing),
    fit: Math.round(fit),
    lastCalculated: new Date(),
  }
}

/**
 * Get score category label
 */
export function getScoreLabel(score: number): { label: string; color: string; bgColor: string } {
  if (score >= 80) {
    return { label: 'Hot', color: 'text-red-700', bgColor: 'bg-red-100' }
  } else if (score >= 60) {
    return { label: 'Warm', color: 'text-orange-700', bgColor: 'bg-orange-100' }
  } else if (score >= 40) {
    return { label: 'Neutral', color: 'text-yellow-700', bgColor: 'bg-yellow-100' }
  } else if (score >= 20) {
    return { label: 'Cool', color: 'text-blue-700', bgColor: 'bg-blue-100' }
  } else {
    return { label: 'Cold', color: 'text-slate-700', bgColor: 'bg-slate-100' }
  }
}

/**
 * Get score category in Spanish
 */
export function getScoreLabelES(score: number): { label: string; color: string; bgColor: string } {
  if (score >= 80) {
    return { label: 'Caliente', color: 'text-red-700', bgColor: 'bg-red-100' }
  } else if (score >= 60) {
    return { label: 'Tibio', color: 'text-orange-700', bgColor: 'bg-orange-100' }
  } else if (score >= 40) {
    return { label: 'Neutral', color: 'text-yellow-700', bgColor: 'bg-yellow-100' }
  } else if (score >= 20) {
    return { label: 'Frío', color: 'text-blue-700', bgColor: 'bg-blue-100' }
  } else {
    return { label: 'Muy Frío', color: 'text-slate-700', bgColor: 'bg-slate-100' }
  }
}

/**
 * Sort leads by score (highest first)
 */
export function sortLeadsByScore(leads: Lead[]): Lead[] {
  return [...leads].sort((a, b) => {
    const scoreA = a.score?.total || 0
    const scoreB = b.score?.total || 0
    return scoreB - scoreA
  })
}

/**
 * Get high-priority leads (score >= 60)
 */
export function getHighPriorityLeads(leads: Lead[]): Lead[] {
  return leads.filter(lead => (lead.score?.total || 0) >= 60)
}

/**
 * Get leads needing attention (low score but recent)
 */
export function getLeadsNeedingAttention(leads: Lead[]): Lead[] {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  return leads.filter(lead => {
    const score = lead.score?.total || 0
    const createdAt = new Date(lead.createdAt)
    return score < 40 && createdAt > sevenDaysAgo && lead.status !== 'closed' && lead.status !== 'lost'
  })
}
