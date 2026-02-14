'use client'

import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react'
import { Patient, FunnelStatus, Treatment, User, Notification, Note, FollowUp, Settings, Appointment, AppointmentStatus } from '@/types'
import { generateId } from '@/lib/utils'
import {
  getGoogleCalendarSettings,
  createCalendarEvent,
  deleteCalendarEvent,
} from '@/services/googleCalendar'

// State interface
interface AppState {
  patients: Patient[]
  treatments: Treatment[]
  user: User
  notifications: Notification[]
  settings: Settings
  isLoading: boolean
  appointments: Appointment[]
}

// Action types
type AppAction =
  | { type: 'SET_PATIENTS'; payload: Patient[] }
  | { type: 'ADD_PATIENT'; payload: Patient }
  | { type: 'UPDATE_PATIENT'; payload: Patient }
  | { type: 'DELETE_PATIENT'; payload: string }
  | { type: 'UPDATE_PATIENT_STATUS'; payload: { id: string; status: FunnelStatus } }
  | { type: 'ADD_NOTE'; payload: { patientId: string; note: Note } }
  | { type: 'ADD_FOLLOWUP'; payload: { patientId: string; followUp: FollowUp } }
  | { type: 'COMPLETE_FOLLOWUP'; payload: { patientId: string; followUpId: string } }
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

const initialUser: User = {
  id: '',
  name: '',
  email: '',
  role: 'owner',
}

const initialState: AppState = {
  patients: [],
  treatments: [],
  appointments: [],
  user: initialUser,
  notifications: [],
  settings: initialSettings,
  isLoading: true,
}

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_PATIENTS':
      return { ...state, patients: action.payload }

    case 'ADD_PATIENT':
      return { ...state, patients: [action.payload, ...state.patients] }

    case 'UPDATE_PATIENT':
      return {
        ...state,
        patients: state.patients.map((patient) =>
          patient.id === action.payload.id ? { ...action.payload, updatedAt: new Date() } : patient
        ),
      }

    case 'DELETE_PATIENT':
      return {
        ...state,
        patients: state.patients.filter((patient) => patient.id !== action.payload),
      }

    case 'UPDATE_PATIENT_STATUS':
      return {
        ...state,
        patients: state.patients.map((patient) =>
          patient.id === action.payload.id
            ? {
                ...patient,
                status: action.payload.status,
                updatedAt: new Date(),
                closedAt: action.payload.status === 'closed' ? new Date() : patient.closedAt,
              }
            : patient
        ),
      }

    case 'ADD_NOTE':
      return {
        ...state,
        patients: state.patients.map((patient) =>
          patient.id === action.payload.patientId
            ? {
                ...patient,
                notes: [action.payload.note, ...patient.notes],
                updatedAt: new Date(),
              }
            : patient
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
        patients: state.patients.map((patient) =>
          patient.id === action.payload.patientId
            ? {
                ...patient,
                followUps: [...patient.followUps, action.payload.followUp],
                updatedAt: new Date(),
              }
            : patient
        ),
      }

    case 'COMPLETE_FOLLOWUP':
      return {
        ...state,
        patients: state.patients.map((patient) =>
          patient.id === action.payload.patientId
            ? {
                ...patient,
                followUps: patient.followUps.map((fu) =>
                  fu.id === action.payload.followUpId
                    ? { ...fu, completed: true, completedAt: new Date() }
                    : fu
                ),
                updatedAt: new Date(),
              }
            : patient
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
  // Patient actions (renamed from Lead actions)
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt' | 'notes' | 'followUps'>) => void
  updatePatient: (patient: Patient) => void
  deletePatient: (id: string) => void
  updatePatientStatus: (id: string, status: FunnelStatus) => void
  addNote: (patientId: string, content: string) => void
  addFollowUp: (patientId: string, followUp: Omit<FollowUp, 'id' | 'patientId' | 'completed'>, syncWithCalendar?: boolean) => Promise<FollowUp | null>
  completeFollowUp: (patientId: string, followUpId: string) => void
  getPatientById: (id: string) => Patient | undefined
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
  getPatientsByStatus: (status: FunnelStatus) => Patient[]
  getUpcomingFollowUps: () => { patient: Patient; followUp: FollowUp }[]
  getRecentPatients: (count: number) => Patient[]
  getUnreadNotificationsCount: () => number
  // Calendar integration
  isCalendarConnected: () => boolean
  // Appointment helpers
  getPatientCurrentStatus: (patientId: string) => 'active' | 'inactive' | 'scheduled' | 'completed'
  getAvailableSlots: (date: Date, durationMinutes?: number) => { time: string; available: boolean }[]
  // NEW: Appointment-based status derivation
  getDerivedPatientStatus: (patientId: string) => 'new' | 'scheduled' | 'active' | 'inactive' | 'lost'
  getPatientAppointmentCounts: (patientId: string) => {
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

  // Helper to get JWT token from localStorage
  const getAuthToken = (): string | null => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('auth_token')
  }

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      const token = getAuthToken()

      if (!token) {
        console.warn('No authentication token found')
        dispatch({ type: 'SET_PATIENTS', payload: [] })
        dispatch({ type: 'SET_TREATMENTS', payload: [] })
        dispatch({ type: 'SET_APPOINTMENTS', payload: [] })
        dispatch({ type: 'UPDATE_USER', payload: initialUser })
        dispatch({ type: 'SET_LOADING', payload: false })
        return
      }

      // Load data from APIs
      try {
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }

        // Load user from API
        const userResponse = await fetch('/api/auth/me', { headers })
        if (userResponse.ok) {
          const userData = await userResponse.json()
          dispatch({ type: 'UPDATE_USER', payload: userData.user })
        }

        // Load treatments from API
        const treatmentsResponse = await fetch('/api/treatments', { headers })
        if (treatmentsResponse.ok) {
          const treatmentsData = await treatmentsResponse.json()
          const treatments = (treatmentsData.treatments || []).map((t: any) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            price: t.price,
            duration: t.duration,
            category: t.category,
          }))
          dispatch({ type: 'SET_TREATMENTS', payload: treatments })
        }

        // Load settings from API
        const settingsResponse = await fetch('/api/clinic', { headers })
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json()
          const clinic = settingsData.clinic
          if (clinic) {
            dispatch({ 
              type: 'UPDATE_SETTINGS', 
              payload: {
                clinicName: clinic.name,
                clinicAddress: clinic.address,
                clinicPhone: clinic.phone,
                clinicEmail: clinic.email,
              }
            })
          }
        }

        // Load patients from API
        const patientsResponse = await fetch('/api/patients?limit=1000', { headers })
        let patients: Patient[] = []
        
        if (patientsResponse.ok) {
          const patientsData = await patientsResponse.json()
          const patientsFromApi = patientsData.patients || []
          
          // Load notes and follow-ups for each patient
          const patientsWithData = await Promise.all(
            patientsFromApi.map(async (p: any) => {
              // Load notes for this patient
              let notes: Note[] = []
              try {
                const notesResponse = await fetch(`/api/notes?patient_id=${p.id}`, { headers })
                if (notesResponse.ok) {
                  const notesData = await notesResponse.json()
                  notes = (notesData.notes || []).map((n: any) => ({
                    id: n.id,
                    content: n.content,
                    createdAt: new Date(n.created_at),
                    createdBy: n.created_by,
                  }))
                }
              } catch (error) {
                console.error(`Error loading notes for patient ${p.id}:`, error)
              }

              // Load follow-ups for this patient
              let followUps: FollowUp[] = []
              try {
                const followUpsResponse = await fetch(`/api/follow-ups?patient_id=${p.id}`, { headers })
                if (followUpsResponse.ok) {
                  const followUpsData = await followUpsResponse.json()
                  followUps = (followUpsData.followUps || []).map((f: any) => ({
                    id: f.id,
                    patientId: p.id,
                    type: f.type,
                    scheduledAt: new Date(f.scheduled_at),
                    completed: f.completed,
                    completedAt: f.completed_at ? new Date(f.completed_at) : undefined,
                    notes: f.notes,
                    assignedTo: f.assigned_to,
                  }))
                }
              } catch (error) {
                console.error(`Error loading follow-ups for patient ${p.id}:`, error)
              }

              // Map old status values to new FunnelStatus
              let mappedStatus: FunnelStatus = 'new'
              if (p.funnel_status) {
                mappedStatus = p.funnel_status
              } else if (p.status) {
                // Map old status values
                if (p.status === 'scheduled') {
                  mappedStatus = 'appointment'
                } else {
                  mappedStatus = p.status
                }
              }

              return {
                id: p.id,
                name: p.name,
                email: p.email || '',
                phone: p.phone,
                identificationNumber: p.identification_number,
                identificationType: p.identification_type,
                source: p.source || 'other',
                status: mappedStatus,
                funnelStatus: p.funnel_status,
                treatments: [],
                notes,
                followUps,
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
              }
            })
          )
          
          patients = patientsWithData
        }

        // Load appointments from API (keep separate, do NOT merge into followUps)
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
          
          // NOTE: Appointments are now kept separate in state.appointments
          // They are NOT merged into patient.followUps anymore
          // This allows proper separation between:
          // - Appointments (in-person clinic visits) → managed in Recepción
          // - FollowUps (calls, messages, meetings) → managed in Agenda
        }

        dispatch({ type: 'SET_PATIENTS', payload: patients })
      } catch (error) {
        console.error('Error loading data from APIs:', error)
        dispatch({ type: 'SET_PATIENTS', payload: [] })
        dispatch({ type: 'SET_TREATMENTS', payload: [] })
        dispatch({ type: 'SET_APPOINTMENTS', payload: [] })
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }

    loadData()
  }, [])



  // Actions
  const addPatient = async (patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt' | 'notes' | 'followUps'>) => {
    const token = getAuthToken()
    
    if (!token) {
      console.warn('No token, using local-only mode')
      const newPatient: Patient = {
        ...patientData,
        id: `patient-${generateId()}`,
        notes: [],
        followUps: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      dispatch({ type: 'ADD_PATIENT', payload: newPatient })
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
          name: patientData.name,
          email: patientData.email,
          phone: patientData.phone,
          identification_number: patientData.identificationNumber,
          identification_type: patientData.identificationType,
          source: patientData.source,
          status: patientData.status,
          instagram_handle: patientData.instagram,
          preferred_time: patientData.preferredTime,
          campaign: patientData.campaign,
          tags: patientData.tags,
          assigned_to: patientData.assignedTo,
          value: patientData.value,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const patient = data.patient
        const newPatient: Patient = {
          id: patient.id,
          name: patient.name,
          email: patient.email || '',
          phone: patient.phone,
          identificationNumber: patient.identification_number,
          identificationType: patient.identification_type,
          source: patient.source,
          status: patient.status,
          funnelStatus: patient.funnel_status,
          treatments: patientData.treatments || [],
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
        dispatch({ type: 'ADD_PATIENT', payload: newPatient })
      } else {
        console.error('Failed to create patient via API')
        // Fallback to local-only
        const newPatient: Patient = {
          ...patientData,
          id: `patient-${generateId()}`,
          notes: [],
          followUps: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        dispatch({ type: 'ADD_PATIENT', payload: newPatient })
      }
    } catch (error) {
      console.error('Error calling API:', error)
      // Fallback to local-only
      const newPatient: Patient = {
        ...patientData,
        id: `patient-${generateId()}`,
        notes: [],
        followUps: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      dispatch({ type: 'ADD_PATIENT', payload: newPatient })
    }
  }

  const updatePatient = async (patient: Patient) => {
    const token = getAuthToken()
    
    // Update local state immediately
    dispatch({ type: 'UPDATE_PATIENT', payload: patient })

    if (!token) {
      console.warn('No token, local-only update')
      return
    }

    try {
      // Call API to update patient
      await fetch(`/api/patients?id=${patient.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: patient.name,
          email: patient.email,
          phone: patient.phone,
          identification_number: patient.identificationNumber,
          identification_type: patient.identificationType,
          source: patient.source,
          status: patient.status,
          funnel_status: patient.funnelStatus,
          instagram_handle: patient.instagram,
          preferred_time: patient.preferredTime,
          campaign: patient.campaign,
          tags: patient.tags,
          assigned_to: patient.assignedTo,
          value: patient.value,
          last_contact_at: patient.lastContactAt,
          next_action_at: patient.nextActionAt,
          next_action: patient.nextAction,
        }),
      })
    } catch (error) {
      console.error('Error updating patient via API:', error)
    }
  }

  const deletePatient = async (id: string) => {
    const token = getAuthToken()
    
    // Update local state immediately
    dispatch({ type: 'DELETE_PATIENT', payload: id })

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

  const updatePatientStatus = async (id: string, status: FunnelStatus) => {
    const token = getAuthToken()
    
    // Update local state immediately
    dispatch({ type: 'UPDATE_PATIENT_STATUS', payload: { id, status } })

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

  const addNote = async (patientId: string, content: string) => {
    const token = getAuthToken()
    
    const note: Note = {
      id: `note-${generateId()}`,
      content,
      createdAt: new Date(),
      createdBy: state.user.id,
    }
    
    // Update local state immediately
    dispatch({ type: 'ADD_NOTE', payload: { patientId, note } })

    if (!token) {
      console.warn('No token, local-only note')
      return
    }

    try {
      // Call API to create note
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_id: patientId,
          content: content,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Update with the actual ID from API
        const apiNote: Note = {
          id: data.note.id,
          content: data.note.content,
          createdAt: new Date(data.note.created_at),
          createdBy: data.note.created_by,
        }
        dispatch({ type: 'ADD_NOTE', payload: { patientId, note: apiNote } })
      }
    } catch (error) {
      console.error('Error creating note via API:', error)
    }
  }

  const addFollowUp = async (
    patientId: string,
    followUpData: Omit<FollowUp, 'id' | 'patientId' | 'completed'>,
    syncWithCalendar: boolean = true
  ): Promise<FollowUp | null> => {
    const token = getAuthToken()
    const patient = state.patients.find(p => p.id === patientId)
    if (!patient) {
      console.error('Patient not found:', patientId)
      return null
    }

    const followUp: FollowUp = {
      ...followUpData,
      id: `fu-${generateId()}`,
      patientId,
      completed: false,
      duration: followUpData.duration || 30,
    }

    // Sync with Google Calendar if connected and it's a meeting
    const calendarSettings = getGoogleCalendarSettings()
    if (syncWithCalendar && calendarSettings.connected && followUpData.type === 'meeting') {
      try {
        const calendarEvent = await createCalendarEvent(followUp, patient)
        if (calendarEvent) {
          followUp.googleEventId = calendarEvent.googleEventId
          followUp.meetLink = calendarEvent.meetLink
          console.log('Created Google Calendar event with Meet link:', calendarEvent.meetLink)
        }
      } catch (error) {
        console.error('Failed to create calendar event:', error)
      }
    }

    if (!token) {
      console.warn('No token, local-only follow-up')
      // Update local state immediately as fallback
      dispatch({ type: 'ADD_FOLLOWUP', payload: { patientId, followUp } })
      return followUp
    }

    try {
      // Call API to create follow-up and persist to database
      const response = await fetch('/api/follow-ups', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_id: patientId,
          type: followUpData.type,
          scheduled_at: followUpData.scheduledAt,
          notes: followUpData.notes,
          assigned_to: followUpData.assignedTo,
          duration: followUpData.duration || 30,
          treatment_id: followUpData.treatmentId,
          treatment_name: followUpData.treatmentName,
          google_event_id: followUp.googleEventId,
          meet_link: followUp.meetLink,
          appointment_status: followUpData.appointmentStatus,
          reminder_sent: followUpData.reminderSent,
          confirmed_by_patient: followUpData.confirmedByPatient,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to create follow-up via API:', response.status, errorData)
        throw new Error(errorData.error || 'Failed to create follow-up')
      }

      const data = await response.json()
      console.log('Follow-up successfully created in database:', data.followUp.id)
      
      // Update with the actual ID from API
      const apiFollowUp: FollowUp = {
        ...followUp,
        id: data.followUp.id,
      }
      
      // Update local state with persisted data
      dispatch({ type: 'ADD_FOLLOWUP', payload: { patientId, followUp: apiFollowUp } })
      
      // Automatically change status to 'appointment' if it's a meeting or appointment and status is new/contacted
      if ((followUpData.type === 'meeting' || followUpData.type === 'appointment') &&
          (patient.status === 'new' || patient.status === 'contacted')) {
        await updatePatientStatus(patientId, 'appointment')
      }
      
      return apiFollowUp
    } catch (error) {
      console.error('Error creating follow-up via API:', error)
      // Fallback: Still add to local state so user doesn't lose their work
      dispatch({ type: 'ADD_FOLLOWUP', payload: { patientId, followUp } })
      // Show error notification
      console.warn('Follow-up saved locally but not persisted to database. Please check your connection.')
      return followUp
    }
  }

  const isCalendarConnected = (): boolean => {
    const settings = getGoogleCalendarSettings()
    return settings.connected
  }

  const completeFollowUp = async (patientId: string, followUpId: string) => {
    const token = getAuthToken()
    
    // Update local state immediately
    dispatch({ type: 'COMPLETE_FOLLOWUP', payload: { patientId, followUpId } })

    if (!token) {
      console.warn('No token, local-only complete')
      return
    }

    try {
      // Call API to complete follow-up
      await fetch(`/api/follow-ups?id=${followUpId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completed: true,
        }),
      })
    } catch (error) {
      console.error('Error completing follow-up via API:', error)
    }
  }

  const getPatientById = (id: string) => {
    return state.patients.find((patient) => patient.id === id)
  }

  const addTreatment = async (treatmentData: Omit<Treatment, 'id'>) => {
    const token = getAuthToken()
    
    const treatment: Treatment = {
      ...treatmentData,
      id: `treat-${generateId()}`,
    }
    
    // Update local state immediately
    dispatch({ type: 'ADD_TREATMENT', payload: treatment })

    if (!token) {
      console.warn('No token, local-only treatment')
      return
    }

    try {
      // Call API to create treatment
      const response = await fetch('/api/treatments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: treatmentData.name,
          description: treatmentData.description,
          price: treatmentData.price,
          duration: treatmentData.duration,
          category: treatmentData.category,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const apiTreatment: Treatment = {
          id: data.treatment.id,
          name: data.treatment.name,
          description: data.treatment.description,
          price: data.treatment.price,
          duration: data.treatment.duration,
          category: data.treatment.category,
        }
        dispatch({ type: 'ADD_TREATMENT', payload: apiTreatment })
      }
    } catch (error) {
      console.error('Error creating treatment via API:', error)
    }
  }

  const updateTreatment = async (treatment: Treatment) => {
    const token = getAuthToken()
    
    // Update local state immediately
    dispatch({ type: 'UPDATE_TREATMENT', payload: treatment })

    if (!token) {
      console.warn('No token, local-only update')
      return
    }

    try {
      // Call API to update treatment
      await fetch(`/api/treatments?id=${treatment.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: treatment.name,
          description: treatment.description,
          price: treatment.price,
          duration: treatment.duration,
          category: treatment.category,
        }),
      })
    } catch (error) {
      console.error('Error updating treatment via API:', error)
    }
  }

  const deleteTreatment = async (id: string) => {
    const token = getAuthToken()
    
    // Update local state immediately
    dispatch({ type: 'DELETE_TREATMENT', payload: id })

    if (!token) {
      console.warn('No token, local-only delete')
      return
    }

    try {
      // Call API to delete treatment
      await fetch(`/api/treatments?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
    } catch (error) {
      console.error('Error deleting treatment via API:', error)
    }
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

  const getPatientsByStatus = (status: FunnelStatus) => {
    return state.patients.filter((patient) => patient.status === status)
  }

  const getUpcomingFollowUps = () => {
    const upcoming: { patient: Patient; followUp: FollowUp }[] = []
    state.patients.forEach((patient) => {
      patient.followUps
        .filter((fu) => !fu.completed)
        // Note: patient.followUps should NOT contain appointments anymore
        // Appointments are stored separately in state.appointments
        .forEach((followUp) => {
          upcoming.push({ patient, followUp })
        })
    })
    return upcoming.sort(
      (a, b) => new Date(a.followUp.scheduledAt).getTime() - new Date(b.followUp.scheduledAt).getTime()
    )
  }

  const getRecentPatients = (count: number) => {
    return [...state.patients]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, count)
  }

  const getUnreadNotificationsCount = () => {
    return state.notifications.filter((n) => !n.read).length
  }

  // Helper: Derive patient current status from their appointments
  const getPatientCurrentStatus = (patientId: string): 'active' | 'inactive' | 'scheduled' | 'completed' => {
    const patient = state.patients.find((p) => p.id === patientId)
    if (!patient || patient.followUps.length === 0) return 'inactive'

    const now = new Date()
    const appointments = patient.followUps.filter((fu) => fu.type === 'appointment' || fu.type === 'meeting')

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
    state.patients.forEach((patient) => {
      patient.followUps
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
  const getPatientAppointmentCounts = (patientId: string) => {
    const patient = state.patients.find((p) => p.id === patientId)
    if (!patient) {
      return { pending: 0, confirmed: 0, completed: 0, noShow: 0, cancelled: 0, total: 0 }
    }

    const appointments = patient.followUps.filter((fu) => fu.type === 'appointment' || fu.type === 'meeting')
    
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
  const getDerivedPatientStatus = (patientId: string): 'new' | 'scheduled' | 'active' | 'inactive' | 'lost' => {
    const patient = state.patients.find((p) => p.id === patientId)
    if (!patient) return 'new'

    const appointments = patient.followUps.filter((fu) => fu.type === 'appointment' || fu.type === 'meeting')
    
    // No appointments = New patient
    if (appointments.length === 0) return 'new'

    const counts = getPatientAppointmentCounts(patientId)
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
        // Reload patients after sync
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
    addPatient,
    updatePatient,
    deletePatient,
    updatePatientStatus,
    addNote,
    addFollowUp,
    completeFollowUp,
    getPatientById,
    addTreatment,
    updateTreatment,
    deleteTreatment,
    markNotificationRead,
    clearNotifications,
    updateSettings,
    updateUser,
    getPatientsByStatus,
    getUpcomingFollowUps,
    getRecentPatients,
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
