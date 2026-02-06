'use client'

import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react'
import { Lead, LeadStatus, Treatment, User, Notification, Note, FollowUp, Settings, Appointment, AppointmentStatus } from '@/types'
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
  // ManyChat integration
  syncManyChatData: () => Promise<any>
  isManyChatConnected: () => boolean
}

const AppContext = createContext<AppContextType | undefined>(undefined)

// Provider
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Helper to get JWT token from cookie
  const getAuthToken = (): string | null => {
    if (typeof document === 'undefined') return null
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1]
    return token || null
  }

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      const token = getAuthToken()

      if (!token) {
        console.warn('No authentication token found, using cached data')
        // Fallback to localStorage if no token
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
        return
      }

      // Load data from APIs
      try {
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }

        // Load patients/leads from API
        // Note: Using limit=1000 for initial load. For large datasets, consider:
        // - Implementing pagination (load on-demand)
        // - Using virtualized lists
        // - Filtering to recent/active patients only
        const patientsResponse = await fetch('/api/patients?limit=1000', { headers })
        let leads: Lead[] = []
        
        if (patientsResponse.ok) {
          const patientsData = await patientsResponse.json()
          leads = (patientsData.patients || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            email: p.email || '',
            phone: p.phone,
            identificationNumber: p.identification_number,
            identificationType: p.identification_type,
            source: p.source || 'other',
            status: p.status || 'new',
            funnelStatus: p.funnel_status,
            // TODO: Load treatments from patient_treatments junction table once implemented
            treatments: [],
            // TODO: Load notes from notes table once implemented
            notes: [],
            // Will be populated with appointments below
            followUps: [],
            assignedTo: p.assigned_to,
            createdAt: new Date(p.created_at),
            updatedAt: new Date(p.updated_at),
            closedAt: p.closed_at ? new Date(p.closed_at) : undefined,
            value: p.value,
            instagram: p.instagram_handle,
            preferredTime: p.preferred_time,
            campaign: p.campaign,
            tags: p.tags || [],
            lastContactAt: p.last_contact_at ? new Date(p.last_contact_at) : undefined,
            nextActionAt: p.next_action_at ? new Date(p.next_action_at) : undefined,
            nextAction: p.next_action,
            totalPaid: p.total_paid,
            totalPending: p.total_pending,
            npsScore: p.nps_score,
          }))
        } else {
          // Fallback to localStorage on API error
          const savedLeads = localStorage.getItem('clinic_leads')
          leads = savedLeads ? JSON.parse(savedLeads, dateReviver) : initialLeads
        }

        // Load appointments from API and merge into leads
        // Note: Using limit=1000 for initial load. For large datasets, consider:
        // - Loading appointments for a specific date range only (e.g., current month ± 1 month)
        // - Implementing on-demand loading when viewing calendar/appointments pages
        // - Using pagination with cursor-based approach
        const appointmentsResponse = await fetch('/api/appointments?limit=1000', { headers })
        if (appointmentsResponse.ok) {
          const appointmentsData = await appointmentsResponse.json()
          const appointments = (appointmentsData.appointments || []).map((a: any) => ({
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
          dispatch({ type: 'SET_APPOINTMENTS', payload: appointments })

          // Merge appointments into leads as followUps
          leads = leads.map(lead => {
            const leadAppointments = appointments
              .filter((apt: any) => apt.patientId === lead.id)
              .map((apt: any) => ({
                id: apt.id,
                leadId: lead.id,
                type: 'appointment' as const,
                scheduledAt: apt.scheduledAt,
                completed: apt.status === 'completed',
                completedAt: apt.completedAt,
                notes: apt.notes,
                googleEventId: apt.googleEventId,
                meetLink: apt.meetLink,
                duration: apt.duration,
                treatmentId: apt.treatmentId,
                treatmentName: apt.treatmentName,
                assignedTo: apt.doctorId,
                appointmentStatus: apt.status as AppointmentStatus,
              }))
            return {
              ...lead,
              followUps: [...(lead.followUps || []), ...leadAppointments],
            }
          })
        }

        dispatch({ type: 'SET_LEADS', payload: leads })
        // Cache in localStorage
        localStorage.setItem('clinic_leads', JSON.stringify(leads))

        // Keep treatments from localStorage for now (until we have a treatments API endpoint)
        const savedTreatments = localStorage.getItem('clinic_treatments')
        dispatch({
          type: 'SET_TREATMENTS',
          payload: savedTreatments ? JSON.parse(savedTreatments) : initialTreatments,
        })

        const savedSettings = localStorage.getItem('clinic_settings')
        if (savedSettings) {
          dispatch({ type: 'UPDATE_SETTINGS', payload: JSON.parse(savedSettings) })
        }

        const savedUser = localStorage.getItem('clinic_user')
        if (savedUser) {
          dispatch({ type: 'UPDATE_USER', payload: JSON.parse(savedUser) })
        }
      } catch (error) {
        console.error('Error loading data from APIs:', error)
        // Fallback to localStorage on error
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
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
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
  const addLead = async (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'notes' | 'followUps'>) => {
    const token = getAuthToken()
    
    if (!token) {
      console.warn('No token, using local-only mode')
      const newLead: Lead = {
        ...leadData,
        id: `lead-${generateId()}`,
        notes: [],
        followUps: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      dispatch({ type: 'ADD_LEAD', payload: newLead })
      return
    }

    try {
      // Call API to create patient
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: leadData.name,
          email: leadData.email,
          phone: leadData.phone,
          identification_number: leadData.identificationNumber,
          identification_type: leadData.identificationType,
          source: leadData.source,
          status: leadData.status,
          funnel_status: leadData.funnelStatus,
          instagram_handle: leadData.instagram,
          preferred_time: leadData.preferredTime,
          campaign: leadData.campaign,
          tags: leadData.tags,
          assigned_to: leadData.assignedTo,
          value: leadData.value,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const patient = data.patient
        const newLead: Lead = {
          id: patient.id,
          name: patient.name,
          email: patient.email || '',
          phone: patient.phone,
          identificationNumber: patient.identification_number,
          identificationType: patient.identification_type,
          source: patient.source,
          status: patient.status,
          funnelStatus: patient.funnel_status,
          treatments: leadData.treatments || [],
          notes: [],
          followUps: [],
          assignedTo: patient.assigned_to,
          createdAt: new Date(patient.created_at),
          updatedAt: new Date(patient.updated_at),
          closedAt: patient.closed_at ? new Date(patient.closed_at) : undefined,
          value: patient.value,
          instagram: patient.instagram_handle,
          preferredTime: patient.preferred_time,
          campaign: patient.campaign,
          tags: patient.tags || [],
          totalPaid: patient.total_paid,
          totalPending: patient.total_pending,
        }
        dispatch({ type: 'ADD_LEAD', payload: newLead })
      } else {
        console.error('Failed to create patient via API')
        // Fallback to local-only
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
    } catch (error) {
      console.error('Error calling API:', error)
      // Fallback to local-only
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
  }

  const updateLead = async (lead: Lead) => {
    const token = getAuthToken()
    
    // Update local state immediately
    dispatch({ type: 'UPDATE_LEAD', payload: lead })

    if (!token) {
      console.warn('No token, local-only update')
      return
    }

    try {
      // Call API to update patient
      await fetch(`/api/patients?id=${lead.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          identification_number: lead.identificationNumber,
          identification_type: lead.identificationType,
          source: lead.source,
          status: lead.status,
          funnel_status: lead.funnelStatus,
          instagram_handle: lead.instagram,
          preferred_time: lead.preferredTime,
          campaign: lead.campaign,
          tags: lead.tags,
          assigned_to: lead.assignedTo,
          value: lead.value,
          last_contact_at: lead.lastContactAt,
          next_action_at: lead.nextActionAt,
          next_action: lead.nextAction,
        }),
      })
    } catch (error) {
      console.error('Error updating patient via API:', error)
    }
  }

  const deleteLead = async (id: string) => {
    const token = getAuthToken()
    
    // Update local state immediately
    dispatch({ type: 'DELETE_LEAD', payload: id })

    if (!token) {
      console.warn('No token, local-only delete')
      return
    }

    try {
      // Call API to delete patient
      await fetch(`/api/patients?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
    } catch (error) {
      console.error('Error deleting patient via API:', error)
    }
  }

  const updateLeadStatus = async (id: string, status: LeadStatus) => {
    const token = getAuthToken()
    
    // Update local state immediately
    dispatch({ type: 'UPDATE_LEAD_STATUS', payload: { id, status } })

    if (!token) {
      console.warn('No token, local-only status update')
      return
    }

    try {
      // Call API to update patient status
      await fetch(`/api/patients?id=${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          closed_at: status === 'closed' ? new Date().toISOString() : null,
        }),
      })
    } catch (error) {
      console.error('Error updating patient status via API:', error)
    }
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

  // ManyChat Integration Functions
  const syncManyChatData = useCallback(async () => {
    try {
      const response = await fetch('/api/sync/manychat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: 1, limit: 100 }),
      })

      if (response.ok) {
        const data = await response.json()
        // Reload leads after sync
        // In production, this would refetch from the API
        console.log('ManyChat sync completed:', data.results)
        return data.results
      } else {
        console.error('ManyChat sync failed')
        return null
      }
    } catch (error) {
      console.error('Error syncing ManyChat:', error)
      return null
    }
  }, [])

  const isManyChatConnected = useCallback(() => {
    try {
      const stored = localStorage.getItem('manychat_settings')
      if (stored) {
        const settings = JSON.parse(stored)
        return settings.connected === true
      }
    } catch {
      return false
    }
    return false
  }, [])

  // Auto-sync ManyChat data on interval (if enabled)
  useEffect(() => {
    const checkAutoSync = () => {
      try {
        const stored = localStorage.getItem('manychat_settings')
        if (stored) {
          const settings = JSON.parse(stored)
          if (settings.connected && settings.auto_sync_enabled) {
            const intervalHours = settings.sync_interval_hours || 24
            const lastSync = settings.last_sync_at ? new Date(settings.last_sync_at) : null
            
            if (!lastSync) {
              // Never synced before, sync now
              syncManyChatData()
            } else {
              const hoursSinceLastSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60)
              if (hoursSinceLastSync >= intervalHours) {
                syncManyChatData()
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking auto-sync:', error)
      }
    }

    // Check on mount and every hour
    checkAutoSync()
    const interval = setInterval(checkAutoSync, 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [syncManyChatData])

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
    syncManyChatData,
    isManyChatConnected,
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
