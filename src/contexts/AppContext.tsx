'use client'

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { Lead, LeadStatus, Treatment, User, Notification, Note, FollowUp, Settings, Appointment } from '@/types'
import { initialLeads, treatments as initialTreatments, currentUser, notifications as initialNotifications } from '@/data/mockData'
import { generateId } from '@/lib/utils'
import {
  getGoogleCalendarSettings,
  createCalendarEvent,
  deleteCalendarEvent,
} from '@/services/googleCalendar'

// State interface
interface AppState {
  leads: Lead[]
  treatments: Treatment[]
  user: User
  notifications: Notification[]
  settings: Settings
  isLoading: boolean
  appointments: Appointment[]   // 👈 agregar

}

// Action types
type AppAction =
  | { type: 'SET_LEADS'; payload: Lead[] }
  | { type: 'ADD_LEAD'; payload: Lead }
  | { type: 'UPDATE_LEAD'; payload: Lead }
  | { type: 'DELETE_LEAD'; payload: string }
  | { type: 'UPDATE_LEAD_STATUS'; payload: { id: string; status: LeadStatus } }
  | { type: 'ADD_NOTE'; payload: { leadId: string; note: Note } }
  | { type: 'ADD_FOLLOWUP'; payload: { leadId: string; followUp: FollowUp } }
  | { type: 'COMPLETE_FOLLOWUP'; payload: { leadId: string; followUpId: string } }
  | { type: 'SET_TREATMENTS'; payload: Treatment[] }
  | { type: 'ADD_TREATMENT'; payload: Treatment }
  | { type: 'UPDATE_TREATMENT'; payload: Treatment }
  | { type: 'DELETE_TREATMENT'; payload: string }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<Settings> }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_APPOINTMENTS'; payload: Appointment[] }
  | { type: 'ADD_APPOINTMENT'; payload: Appointment }
  | { type: 'UPDATE_APPOINTMENT'; payload: Appointment }
  | { type: 'DELETE_APPOINTMENT'; payload: string }

// Initial state
const initialSettings: Settings = {
  clinicName: 'Glow Beauty Clinic',
  clinicAddress: 'Av. Reforma 123, Col. Juárez, CDMX',
  clinicPhone: '+52 55 1234 5678',
  clinicEmail: 'contacto@glowclinic.com',
  notificationsEnabled: true,
  reminderTime: 30,
}

const initialState: AppState = {
  leads: [],
  treatments: [],
  appointments: [],
  user: currentUser,
  notifications: [],
  settings: initialSettings,
  isLoading: true,
}

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LEADS':
      return { ...state, leads: action.payload }

    case 'ADD_LEAD':
      return { ...state, leads: [action.payload, ...state.leads] }

    case 'UPDATE_LEAD':
      return {
        ...state,
        leads: state.leads.map((lead) =>
          lead.id === action.payload.id ? { ...action.payload, updatedAt: new Date() } : lead
        ),
      }

    case 'DELETE_LEAD':
      return {
        ...state,
        leads: state.leads.filter((lead) => lead.id !== action.payload),
      }

    case 'UPDATE_LEAD_STATUS':
      return {
        ...state,
        leads: state.leads.map((lead) =>
          lead.id === action.payload.id
            ? {
                ...lead,
                status: action.payload.status,
                updatedAt: new Date(),
                closedAt: action.payload.status === 'closed' ? new Date() : lead.closedAt,
              }
            : lead
        ),
      }

    case 'ADD_NOTE':
      return {
        ...state,
        leads: state.leads.map((lead) =>
          lead.id === action.payload.leadId
            ? {
                ...lead,
                notes: [action.payload.note, ...lead.notes],
                updatedAt: new Date(),
              }
            : lead
        ),
      }
      
    case 'SET_APPOINTMENTS':
      return { ...state, appointments: action.payload }

    case 'ADD_APPOINTMENT':
      return { ...state, appointments: [...state.appointments, action.payload] }

    case 'UPDATE_APPOINTMENT':
      return {
        ...state,
        appointments: state.appointments.map((apt) =>
          apt.id === action.payload.id ? action.payload : apt
        ),
      }

    case 'DELETE_APPOINTMENT':
      return {
        ...state,
        appointments: state.appointments.filter((apt) => apt.id !== action.payload),
      }

    case 'ADD_FOLLOWUP':
      return {
        ...state,
        leads: state.leads.map((lead) =>
          lead.id === action.payload.leadId
            ? {
                ...lead,
                followUps: [...lead.followUps, action.payload.followUp],
                updatedAt: new Date(),
              }
            : lead
        ),
      }

    case 'COMPLETE_FOLLOWUP':
      return {
        ...state,
        leads: state.leads.map((lead) =>
          lead.id === action.payload.leadId
            ? {
                ...lead,
                followUps: lead.followUps.map((fu) =>
                  fu.id === action.payload.followUpId
                    ? { ...fu, completed: true, completedAt: new Date() }
                    : fu
                ),
                updatedAt: new Date(),
              }
            : lead
        ),
      }

    case 'SET_TREATMENTS':
      return { ...state, treatments: action.payload }

    case 'ADD_TREATMENT':
      return { ...state, treatments: [...state.treatments, action.payload] }

    case 'UPDATE_TREATMENT':
      return {
        ...state,
        treatments: state.treatments.map((t) =>
          t.id === action.payload.id ? action.payload : t
        ),
      }

    case 'DELETE_TREATMENT':
      return {
        ...state,
        treatments: state.treatments.filter((t) => t.id !== action.payload),
      }

    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.payload ? { ...n, read: true } : n
        ),
      }

    case 'CLEAR_NOTIFICATIONS':
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      }

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      }

    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      }

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }

    default:
      return state
  }
}

// Context
interface AppContextType {
  state: AppState
  dispatch: React.Dispatch<AppAction>
  // Lead actions
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'notes' | 'followUps'>) => void
  updateLead: (lead: Lead) => void
  deleteLead: (id: string) => void
  updateLeadStatus: (id: string, status: LeadStatus) => void
  addNote: (leadId: string, content: string) => void
  addFollowUp: (leadId: string, followUp: Omit<FollowUp, 'id' | 'leadId' | 'completed'>, syncWithCalendar?: boolean) => Promise<FollowUp | null>
  completeFollowUp: (leadId: string, followUpId: string) => void
  getLeadById: (id: string) => Lead | undefined
  // Treatment actions
  addTreatment: (treatment: Omit<Treatment, 'id'>) => void
  updateTreatment: (treatment: Treatment) => void
  deleteTreatment: (id: string) => void
  // Notification actions
  markNotificationRead: (id: string) => void
  clearNotifications: () => void
  // Settings actions
  updateSettings: (settings: Partial<Settings>) => void
  // User actions
  updateUser: (user: User) => void
  // Computed values
  getLeadsByStatus: (status: LeadStatus) => Lead[]
  getUpcomingFollowUps: () => { lead: Lead; followUp: FollowUp }[]
  getRecentLeads: (count: number) => Lead[]
  getUnreadNotificationsCount: () => number
  // Calendar integration
  isCalendarConnected: () => boolean
  // Appointment helpers
  getPatientCurrentStatus: (leadId: string) => 'active' | 'inactive' | 'scheduled' | 'completed'
  getAvailableSlots: (date: Date, durationMinutes?: number) => { time: string; available: boolean }[]
  // NEW: Appointment-based status derivation
  getDerivedPatientStatus: (leadId: string) => 'new' | 'scheduled' | 'active' | 'inactive' | 'lost'
  getPatientAppointmentCounts: (leadId: string) => {
    pending: number
    confirmed: number
    completed: number
    noShow: number
    cancelled: number
    total: number
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined)

// Provider
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Load initial data
  useEffect(() => {
    // Simulate loading from storage/API
    const loadData = () => {
      // Try to load from localStorage first
      const savedLeads = localStorage.getItem('clinic_leads')
      const savedTreatments = localStorage.getItem('clinic_treatments')
      const savedSettings = localStorage.getItem('clinic_settings')
      const savedUser = localStorage.getItem('clinic_user')

      dispatch({
        type: 'SET_LEADS',
        payload: savedLeads ? JSON.parse(savedLeads, dateReviver) : initialLeads,
      })

      dispatch({
        type: 'SET_TREATMENTS',
        payload: savedTreatments ? JSON.parse(savedTreatments) : initialTreatments,
      })

      if (savedSettings) {
        dispatch({ type: 'UPDATE_SETTINGS', payload: JSON.parse(savedSettings) })
      }

      if (savedUser) {
        dispatch({ type: 'UPDATE_USER', payload: JSON.parse(savedUser) })
      }

      dispatch({ type: 'SET_LOADING', payload: false })
    }

    loadData()
  }, [])

  // Save to localStorage when data changes
  useEffect(() => {
    if (!state.isLoading) {
      localStorage.setItem('clinic_leads', JSON.stringify(state.leads))
    }
  }, [state.leads, state.isLoading])

  useEffect(() => {
    if (!state.isLoading) {
      localStorage.setItem('clinic_treatments', JSON.stringify(state.treatments))
    }
  }, [state.treatments, state.isLoading])

  useEffect(() => {
    if (!state.isLoading) {
      localStorage.setItem('clinic_settings', JSON.stringify(state.settings))
    }
  }, [state.settings, state.isLoading])

  useEffect(() => {
    if (!state.isLoading) {
      localStorage.setItem('clinic_user', JSON.stringify(state.user))
    }
  }, [state.user, state.isLoading])

  // Actions
  const addLead = (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'notes' | 'followUps'>) => {
    const newLead: Lead = {
      ...leadData,
      id: `lead-${generateId()}`,
      notes: [],
      followUps: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    dispatch({ type: 'ADD_LEAD', payload: newLead })
  }

  const updateLead = (lead: Lead) => {
    dispatch({ type: 'UPDATE_LEAD', payload: lead })
  }

  const deleteLead = (id: string) => {
    dispatch({ type: 'DELETE_LEAD', payload: id })
  }

  const updateLeadStatus = (id: string, status: LeadStatus) => {
    dispatch({ type: 'UPDATE_LEAD_STATUS', payload: { id, status } })
  }

  const addNote = (leadId: string, content: string) => {
    const note: Note = {
      id: `note-${generateId()}`,
      content,
      createdAt: new Date(),
      createdBy: state.user.id,
    }
    dispatch({ type: 'ADD_NOTE', payload: { leadId, note } })
  }

  const addFollowUp = async (
    leadId: string,
    followUpData: Omit<FollowUp, 'id' | 'leadId' | 'completed'>,
    syncWithCalendar: boolean = true
  ): Promise<FollowUp | null> => {
    const lead = state.leads.find(l => l.id === leadId)
    if (!lead) return null

    const followUp: FollowUp = {
      ...followUpData,
      id: `fu-${generateId()}`,
      leadId,
      completed: false,
      duration: followUpData.duration || 30, // default 30 min
    }

    // Sync with Google Calendar if connected and it's a meeting
    const calendarSettings = getGoogleCalendarSettings()
    if (syncWithCalendar && calendarSettings.connected && followUpData.type === 'meeting') {
      try {
        const calendarEvent = await createCalendarEvent(followUp, lead)
        if (calendarEvent) {
          followUp.googleEventId = calendarEvent.googleEventId
          followUp.meetLink = calendarEvent.meetLink
          console.log('Created Google Calendar event with Meet link:', calendarEvent.meetLink)
        }
      } catch (error) {
        console.error('Failed to create calendar event:', error)
        // Continue without calendar sync
      }
    }

    dispatch({ type: 'ADD_FOLLOWUP', payload: { leadId, followUp } })

    // Automatically change status to 'scheduled' if it's a meeting or call and status is new/contacted
    if ((followUpData.type === 'meeting' || followUpData.type === 'call') &&
        (lead.status === 'new' || lead.status === 'contacted')) {
      dispatch({ type: 'UPDATE_LEAD_STATUS', payload: { id: leadId, status: 'scheduled' } })
    }

    return followUp
  }

  const isCalendarConnected = (): boolean => {
    const settings = getGoogleCalendarSettings()
    return settings.connected
  }

  const completeFollowUp = (leadId: string, followUpId: string) => {
    dispatch({ type: 'COMPLETE_FOLLOWUP', payload: { leadId, followUpId } })
  }

  const getLeadById = (id: string) => {
    return state.leads.find((lead) => lead.id === id)
  }

  const addTreatment = (treatmentData: Omit<Treatment, 'id'>) => {
    const treatment: Treatment = {
      ...treatmentData,
      id: `treat-${generateId()}`,
    }
    dispatch({ type: 'ADD_TREATMENT', payload: treatment })
  }

  const updateTreatment = (treatment: Treatment) => {
    dispatch({ type: 'UPDATE_TREATMENT', payload: treatment })
  }

  const deleteTreatment = (id: string) => {
    dispatch({ type: 'DELETE_TREATMENT', payload: id })
  }

  const markNotificationRead = (id: string) => {
    dispatch({ type: 'MARK_NOTIFICATION_READ', payload: id })
  }

  const clearNotifications = () => {
    dispatch({ type: 'CLEAR_NOTIFICATIONS' })
  }

  const updateSettings = (settings: Partial<Settings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings })
  }

  const updateUser = (user: User) => {
    dispatch({ type: 'UPDATE_USER', payload: user })
  }

  const getLeadsByStatus = (status: LeadStatus) => {
    return state.leads.filter((lead) => lead.status === status)
  }

  const getUpcomingFollowUps = () => {
    const upcoming: { lead: Lead; followUp: FollowUp }[] = []
    state.leads.forEach((lead) => {
      lead.followUps
        .filter((fu) => !fu.completed)
        .forEach((followUp) => {
          upcoming.push({ lead, followUp })
        })
    })
    return upcoming.sort(
      (a, b) => new Date(a.followUp.scheduledAt).getTime() - new Date(b.followUp.scheduledAt).getTime()
    )
  }

  const getRecentLeads = (count: number) => {
    return [...state.leads]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, count)
  }

  const getUnreadNotificationsCount = () => {
    return state.notifications.filter((n) => !n.read).length
  }

  // Helper: Derive patient current status from their appointments
  const getPatientCurrentStatus = (leadId: string): 'active' | 'inactive' | 'scheduled' | 'completed' => {
    const lead = state.leads.find((l) => l.id === leadId)
    if (!lead || lead.followUps.length === 0) return 'inactive'

    const now = new Date()
    const appointments = lead.followUps.filter((fu) => fu.type === 'appointment' || fu.type === 'meeting')

    // Check for upcoming appointments
    const upcomingAppointments = appointments.filter(
      (fu) => !fu.completed && new Date(fu.scheduledAt) > now
    )
    if (upcomingAppointments.length > 0) return 'scheduled'

    // Check for recent completed appointments (within last 30 days)
    const recentCompleted = appointments.filter(
      (fu) =>
        fu.completed &&
        fu.completedAt &&
        (now.getTime() - new Date(fu.completedAt).getTime()) / (1000 * 60 * 60 * 24) <= 30
    )
    if (recentCompleted.length > 0) return 'active'

    // Check if all appointments are completed
    const allCompleted = appointments.length > 0 && appointments.every((fu) => fu.completed)
    if (allCompleted) return 'completed'

    return 'inactive'
  }

  // Helper: Get available time slots for a given date
  const getAvailableSlots = (date: Date, durationMinutes: number = 30) => {
    const slots: { time: string; available: boolean }[] = []
    const workingHours = state.settings.workingHours || { start: '09:00', end: '18:00', days: [1, 2, 3, 4, 5] }

    // Check if the date is a working day
    const dayOfWeek = date.getDay()
    if (!workingHours.days.includes(dayOfWeek)) {
      return slots // Return empty array for non-working days
    }

    // Get all appointments for the selected date
    const appointmentsOnDate: Date[] = []
    state.leads.forEach((lead) => {
      lead.followUps
        .filter((fu) => !fu.completed && (fu.type === 'appointment' || fu.type === 'meeting'))
        .forEach((fu) => {
          const fuDate = new Date(fu.scheduledAt)
          if (
            fuDate.getFullYear() === date.getFullYear() &&
            fuDate.getMonth() === date.getMonth() &&
            fuDate.getDate() === date.getDate()
          ) {
            appointmentsOnDate.push(fuDate)
          }
        })
    })

    // Generate slots from working hours
    const [startHour, startMin] = workingHours.start.split(':').map(Number)
    const [endHour, endMin] = workingHours.end.split(':').map(Number)

    let currentHour = startHour
    let currentMin = startMin

    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`
      const slotDate = new Date(date)
      slotDate.setHours(currentHour, currentMin, 0, 0)

      // Check if slot is occupied
      const isOccupied = appointmentsOnDate.some((apptDate) => {
        const diff = Math.abs(slotDate.getTime() - apptDate.getTime()) / (1000 * 60)
        return diff < durationMinutes
      })

      slots.push({ time: timeStr, available: !isOccupied })

      // Move to next slot
      currentMin += durationMinutes
      if (currentMin >= 60) {
        currentHour++
        currentMin = 0
      }
    }

    return slots
  }

  // Helper: Get appointment counts for a patient
  const getPatientAppointmentCounts = (leadId: string) => {
    const lead = state.leads.find((l) => l.id === leadId)
    if (!lead) {
      return { pending: 0, confirmed: 0, completed: 0, noShow: 0, cancelled: 0, total: 0 }
    }

    const appointments = lead.followUps.filter((fu) => fu.type === 'appointment' || fu.type === 'meeting')
    
    return {
      pending: appointments.filter((fu) => fu.appointmentStatus === 'pending').length,
      confirmed: appointments.filter((fu) => fu.appointmentStatus === 'confirmed').length,
      completed: appointments.filter((fu) => fu.appointmentStatus === 'completed').length,
      noShow: appointments.filter((fu) => fu.appointmentStatus === 'no-show').length,
      cancelled: appointments.filter((fu) => fu.appointmentStatus === 'cancelled').length,
      total: appointments.length,
    }
  }

  // Helper: Derive patient status from their appointments
  const getDerivedPatientStatus = (leadId: string): 'new' | 'scheduled' | 'active' | 'inactive' | 'lost' => {
    const lead = state.leads.find((l) => l.id === leadId)
    if (!lead) return 'new'

    const appointments = lead.followUps.filter((fu) => fu.type === 'appointment' || fu.type === 'meeting')
    
    // No appointments = New patient
    if (appointments.length === 0) return 'new'

    const counts = getPatientAppointmentCounts(leadId)
    const now = new Date()

    // Has pending or confirmed appointments = Scheduled
    if (counts.pending > 0 || counts.confirmed > 0) return 'scheduled'

    // Has recent completed appointments (within last 30 days) = Active
    const recentCompleted = appointments.filter((fu) => {
      if (fu.appointmentStatus !== 'completed' || !fu.completedAt) return false
      const daysSince = (now.getTime() - new Date(fu.completedAt).getTime()) / (1000 * 60 * 60 * 24)
      return daysSince <= 30
    })
    if (recentCompleted.length > 0) return 'active'

    // Only no-show or cancelled appointments = Lost
    // Logic: A patient is lost if they have cancellations/no-shows AND no completed appointments
    // If they have completed appointments, they're considered active (recently) or inactive (long ago)
    if (counts.noShow > 0 || counts.cancelled > 0) {
      const hasCompleted = counts.completed > 0
      if (!hasCompleted) return 'lost'
    }

    // Has old completed appointments = Inactive
    if (counts.completed > 0) return 'inactive'

    return 'inactive'
  }

  const value: AppContextType = {
    state,
    dispatch,
    addLead,
    updateLead,
    deleteLead,
    updateLeadStatus,
    addNote,
    addFollowUp,
    completeFollowUp,
    getLeadById,
    addTreatment,
    updateTreatment,
    deleteTreatment,
    markNotificationRead,
    clearNotifications,
    updateSettings,
    updateUser,
    getLeadsByStatus,
    getUpcomingFollowUps,
    getRecentLeads,
    getUnreadNotificationsCount,
    isCalendarConnected,
    getPatientCurrentStatus,
    getAvailableSlots,
    getDerivedPatientStatus,
    getPatientAppointmentCounts,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// Hook
export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

// Helper to revive dates from JSON
function dateReviver(key: string, value: unknown) {
  if (typeof value === 'string') {
    const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    if (dateRegex.test(value)) {
      return new Date(value)
    }
  }
  return value
}
