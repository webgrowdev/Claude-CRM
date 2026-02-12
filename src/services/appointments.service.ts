/**
 * Appointments Service
 * 
 * Handles appointment-specific operations separate from general follow-ups.
 * Appointments are in-person clinic visits stored in the appointments table.
 */

import { Appointment, AppointmentStatus } from '@/types'

/**
 * Get appointments from the API
 */
export async function getAppointments(
  clinicId: string,
  filters?: {
    status?: AppointmentStatus
    doctorId?: string
    date?: Date
    patientId?: string
  }
): Promise<Appointment[]> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  
  if (!token) {
    console.warn('No authentication token found')
    return []
  }

  try {
    const params = new URLSearchParams()
    params.append('limit', '1000')
    
    if (filters?.status) params.append('status', filters.status)
    if (filters?.doctorId) params.append('doctor_id', filters.doctorId)
    if (filters?.patientId) params.append('patient_id', filters.patientId)
    if (filters?.date) {
      const dateStr = filters.date.toISOString().split('T')[0]
      params.append('date', dateStr)
    }

    const response = await fetch(`/api/appointments?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch appointments')
    }

    const data = await response.json()
    
    return (data.appointments || []).map((a: any) => ({
      id: a.id,
      patientId: a.patient_id,
      patientName: a.patient?.name || '',
      doctorId: a.doctor_id || '',
      doctorName: a.doctor?.name || '',
      treatmentId: a.treatment_id,
      treatmentName: a.treatment?.name || '',
      scheduledAt: new Date(a.scheduled_at),
      duration: a.duration,
      status: a.status,
      notes: a.notes,
      googleEventId: a.google_event_id,
      meetLink: a.meet_link,
      confirmedAt: a.confirmed_at ? new Date(a.confirmed_at) : undefined,
      completedAt: a.completed_at ? new Date(a.completed_at) : undefined,
      color: a.doctor?.color,
    }))
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return []
  }
}

/**
 * Create a new appointment
 * This creates an appointment in the appointments table, NOT as a followUp
 */
export async function createAppointment(data: {
  patientId: string
  doctorId?: string
  treatmentId?: string
  scheduledAt: Date
  duration: number
  notes?: string
}): Promise<Appointment | null> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  
  if (!token) {
    console.warn('No authentication token found')
    return null
  }

  try {
    const response = await fetch('/api/appointments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        patient_id: data.patientId,
        doctor_id: data.doctorId,
        treatment_id: data.treatmentId,
        scheduled_at: data.scheduledAt.toISOString(),
        duration: data.duration,
        status: 'pending',
        notes: data.notes,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to create appointment')
    }

    const result = await response.json()
    const a = result.appointment

    return {
      id: a.id,
      patientId: a.patient_id,
      patientName: a.patient?.name || '',
      doctorId: a.doctor_id || '',
      doctorName: a.doctor?.name || '',
      treatmentId: a.treatment_id,
      treatmentName: a.treatment?.name || '',
      scheduledAt: new Date(a.scheduled_at),
      duration: a.duration,
      status: a.status,
      notes: a.notes,
      googleEventId: a.google_event_id,
      meetLink: a.meet_link,
      confirmedAt: a.confirmed_at ? new Date(a.confirmed_at) : undefined,
      completedAt: a.completed_at ? new Date(a.completed_at) : undefined,
      color: a.doctor?.color,
    }
  } catch (error) {
    console.error('Error creating appointment:', error)
    return null
  }
}

/**
 * Update appointment status (check-in, complete, no-show, etc.)
 */
export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
  notes?: string
): Promise<boolean> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  
  if (!token) {
    console.warn('No authentication token found')
    return false
  }

  try {
    const response = await fetch(`/api/appointments/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status,
        notes,
        completed_at: status === 'completed' ? new Date().toISOString() : undefined,
      }),
    })

    return response.ok
  } catch (error) {
    console.error('Error updating appointment status:', error)
    return false
  }
}

/**
 * Reschedule an appointment
 */
export async function rescheduleAppointment(
  id: string,
  newScheduledAt: Date
): Promise<boolean> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  
  if (!token) {
    console.warn('No authentication token found')
    return false
  }

  try {
    const response = await fetch(`/api/appointments/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scheduled_at: newScheduledAt.toISOString(),
      }),
    })

    return response.ok
  } catch (error) {
    console.error('Error rescheduling appointment:', error)
    return false
  }
}

/**
 * Delete/cancel an appointment
 */
export async function cancelAppointment(id: string): Promise<boolean> {
  return updateAppointmentStatus(id, 'cancelled')
}
