import { Patient, LeadScore, Treatment } from '@/types'
import { differenceInDays } from 'date-fns'

/**
 * Calculate patient score based on various factors
 * Score ranges from 0-100
 */
export function calculatePatientScore(patient: Patient, treatments: Treatment[]): LeadScore {
  let engagement = 0
  let value = 0
  let timing = 0
  let fit = 0

  // === ENGAGEMENT SCORE (max 30) ===

  // Responded to messages/follow-ups
  const completedFollowUps = patient.followUps.filter(f => f.completed).length
  engagement += Math.min(completedFollowUps * 5, 15)

  // Attended appointments
  const attendedAppointments = patient.followUps.filter(
    f => f.type === 'appointment' && f.attendanceStatus === 'attended'
  ).length
  engagement += Math.min(attendedAppointments * 10, 20)

  // Penalty for no-shows
  const noShows = patient.followUps.filter(
    f => f.type === 'appointment' && f.attendanceStatus === 'noshow'
  ).length
  engagement -= Math.min(noShows * 10, 20)

  // Has notes (indicates conversations)
  if (patient.notes.length > 0) {
    engagement += Math.min(patient.notes.length * 2, 10)
  }

  engagement = Math.max(0, Math.min(30, engagement))

  // === VALUE SCORE (max 25) ===

  // Check treatment interest value
  const interestedTreatments = treatments.filter(t =>
    patient.treatments.includes(t.name) || patient.treatments.includes(t.id)
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
  if (patient.totalPaid && patient.totalPaid > 0) {
    value += 10
  }

  value = Math.min(25, value)

  // === TIMING SCORE (max 25) ===

  // Recent activity
  const daysSinceCreation = differenceInDays(new Date(), new Date(patient.createdAt))
  const lastActivity = patient.lastContactAt || patient.updatedAt || patient.createdAt
  const daysSinceLastActivity = differenceInDays(new Date(), new Date(lastActivity))

  // Fresh patients get bonus
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
  const upcomingAppointments = patient.followUps.filter(
    f => !f.completed && new Date(f.scheduledAt) > new Date()
  ).length
  if (upcomingAppointments > 0) timing += 5

  timing = Math.max(0, Math.min(25, timing))

  // === FIT SCORE (max 20) ===

  // Profile completeness
  if (patient.email) fit += 3
  if (patient.phone) fit += 3
  if (patient.identificationNumber) fit += 4
  if (patient.instagram) fit += 2
  if (patient.treatments.length > 0) fit += 3

  // Source quality
  if (patient.source === 'referral') fit += 5
  else if (patient.source === 'instagram') fit += 3
  else if (patient.source === 'whatsapp') fit += 3
  else if (patient.source === 'website') fit += 2

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
 * @deprecated Use calculatePatientScore instead
 */
export const calculateLeadScore = calculatePatientScore

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
 * Sort patients by score (highest first)
 */
export function sortPatientsByScore(patients: Patient[]): Patient[] {
  return [...patients].sort((a, b) => {
    const scoreA = a.score?.total || 0
    const scoreB = b.score?.total || 0
    return scoreB - scoreA
  })
}

/**
 * @deprecated Use sortPatientsByScore instead
 */
export const sortLeadsByScore = sortPatientsByScore

/**
 * Get high-priority patients (score >= 60)
 */
export function getHighPriorityPatients(patients: Patient[]): Patient[] {
  return patients.filter(patient => (patient.score?.total || 0) >= 60)
}

/**
 * @deprecated Use getHighPriorityPatients instead
 */
export const getHighPriorityLeads = getHighPriorityPatients

/**
 * Get patients needing attention (low score but recent)
 */
export function getPatientsNeedingAttention(patients: Patient[]): Patient[] {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  return patients.filter(patient => {
    const score = patient.score?.total || 0
    const createdAt = new Date(patient.createdAt)
    return score < 40 && createdAt > sevenDaysAgo && patient.status !== 'closed' && patient.status !== 'lost'
  })
}

/**
 * @deprecated Use getPatientsNeedingAttention instead
 */
export const getLeadsNeedingAttention = getPatientsNeedingAttention
