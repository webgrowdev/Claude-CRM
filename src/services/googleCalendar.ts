// Google Calendar Integration Service
// This service handles synchronization with Google Calendar and Google Meet

import { CalendarEvent, FollowUp, Lead, GoogleCalendarSettings } from '@/types'

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
]

// Storage key for settings
const SETTINGS_KEY = 'clinic_google_calendar_settings'

// Default settings
const defaultSettings: GoogleCalendarSettings = {
  connected: false,
  autoCreateMeetLinks: true,
  syncFollowUps: true,
}

// Get current settings from localStorage
export function getGoogleCalendarSettings(): GoogleCalendarSettings {
  if (typeof window === 'undefined') return defaultSettings
  const stored = localStorage.getItem(SETTINGS_KEY)
  if (!stored) return defaultSettings
  try {
    return JSON.parse(stored)
  } catch {
    return defaultSettings
  }
}

// Save settings to localStorage
export function saveGoogleCalendarSettings(settings: GoogleCalendarSettings): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

// Initialize Google OAuth
export async function initializeGoogleAuth(): Promise<void> {
  if (!GOOGLE_CLIENT_ID) {
    console.warn('Google Client ID not configured')
    return
  }

  // Load the Google API client library
  await new Promise<void>((resolve) => {
    if (typeof window === 'undefined') {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://apis.google.com/js/api.js'
    script.onload = () => {
      window.gapi?.load('client:auth2', () => {
        resolve()
      })
    }
    document.body.appendChild(script)
  })
}

// Connect to Google Calendar
export async function connectGoogleCalendar(): Promise<GoogleCalendarSettings> {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Google Calendar integration not configured. Please add NEXT_PUBLIC_GOOGLE_CLIENT_ID to your environment variables.')
  }

  try {
    // Initialize gapi client
    await window.gapi?.client.init({
      clientId: GOOGLE_CLIENT_ID,
      scope: GOOGLE_CALENDAR_SCOPES.join(' '),
    })

    // Sign in
    const authInstance = window.gapi?.auth2.getAuthInstance()
    const user = await authInstance?.signIn()

    if (!user) {
      throw new Error('Failed to authenticate with Google')
    }

    const authResponse = user.getAuthResponse()
    const profile = user.getBasicProfile()

    const settings: GoogleCalendarSettings = {
      connected: true,
      email: profile?.getEmail(),
      accessToken: authResponse.access_token,
      calendarId: 'primary',
      autoCreateMeetLinks: true,
      syncFollowUps: true,
    }

    saveGoogleCalendarSettings(settings)
    return settings
  } catch (error) {
    console.error('Failed to connect to Google Calendar:', error)
    throw error
  }
}

// Disconnect from Google Calendar
export function disconnectGoogleCalendar(): void {
  const authInstance = window.gapi?.auth2.getAuthInstance()
  authInstance?.signOut()

  saveGoogleCalendarSettings(defaultSettings)
}

// Create a calendar event from a follow-up
export async function createCalendarEvent(
  followUp: FollowUp,
  lead: Lead
): Promise<CalendarEvent | null> {
  const settings = getGoogleCalendarSettings()

  if (!settings.connected || !settings.accessToken) {
    console.warn('Google Calendar not connected')
    return null
  }

  const endTime = new Date(followUp.scheduledAt)
  endTime.setMinutes(endTime.getMinutes() + 30) // Default 30 min duration

  const eventData = {
    summary: `${getFollowUpTitle(followUp.type)} - ${lead.name}`,
    description: `
Lead: ${lead.name}
Teléfono: ${lead.phone}
${lead.email ? `Email: ${lead.email}` : ''}
Tratamientos de interés: ${lead.treatments.join(', ') || 'No especificado'}

${followUp.notes || ''}

---
Creado automáticamente por Clinic CRM
    `.trim(),
    start: {
      dateTime: new Date(followUp.scheduledAt).toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    attendees: lead.email ? [{ email: lead.email }] : [],
    conferenceData: settings.autoCreateMeetLinks && followUp.type === 'meeting' ? {
      createRequest: {
        requestId: `clinic-crm-${followUp.id}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    } : undefined,
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${settings.calendarId || 'primary'}/events?conferenceDataVersion=1`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${settings.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      }
    )

    if (!response.ok) {
      throw new Error('Failed to create calendar event')
    }

    const googleEvent = await response.json()

    const calendarEvent: CalendarEvent = {
      id: `cal-${Date.now()}`,
      title: eventData.summary,
      description: eventData.description,
      start: new Date(followUp.scheduledAt),
      end: endTime,
      meetLink: googleEvent.conferenceData?.entryPoints?.[0]?.uri || undefined,
      attendees: lead.email ? [lead.email] : [],
      leadId: lead.id,
      followUpId: followUp.id,
      syncedWithGoogle: true,
      googleEventId: googleEvent.id,
    }

    return calendarEvent
  } catch (error) {
    console.error('Failed to create calendar event:', error)
    return null
  }
}

// Update a calendar event
export async function updateCalendarEvent(
  googleEventId: string,
  updates: Partial<CalendarEvent>
): Promise<boolean> {
  const settings = getGoogleCalendarSettings()

  if (!settings.connected || !settings.accessToken) {
    return false
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${settings.calendarId || 'primary'}/events/${googleEventId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${settings.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: updates.title,
          description: updates.description,
          start: updates.start ? {
            dateTime: updates.start.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          } : undefined,
          end: updates.end ? {
            dateTime: updates.end.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          } : undefined,
        }),
      }
    )

    return response.ok
  } catch (error) {
    console.error('Failed to update calendar event:', error)
    return false
  }
}

// Delete a calendar event
export async function deleteCalendarEvent(googleEventId: string): Promise<boolean> {
  const settings = getGoogleCalendarSettings()

  if (!settings.connected || !settings.accessToken) {
    return false
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${settings.calendarId || 'primary'}/events/${googleEventId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${settings.accessToken}`,
        },
      }
    )

    return response.ok || response.status === 404 // Success or already deleted
  } catch (error) {
    console.error('Failed to delete calendar event:', error)
    return false
  }
}

// Get upcoming events from Google Calendar
export async function getUpcomingEvents(maxResults: number = 10): Promise<CalendarEvent[]> {
  const settings = getGoogleCalendarSettings()

  if (!settings.connected || !settings.accessToken) {
    return []
  }

  try {
    const now = new Date().toISOString()
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${settings.calendarId || 'primary'}/events?` +
      `timeMin=${now}&maxResults=${maxResults}&orderBy=startTime&singleEvents=true`,
      {
        headers: {
          Authorization: `Bearer ${settings.accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch events')
    }

    const data = await response.json()

    return data.items?.map((item: any) => ({
      id: item.id,
      title: item.summary || 'Sin título',
      description: item.description,
      start: new Date(item.start?.dateTime || item.start?.date),
      end: new Date(item.end?.dateTime || item.end?.date),
      location: item.location,
      meetLink: item.conferenceData?.entryPoints?.[0]?.uri,
      attendees: item.attendees?.map((a: any) => a.email) || [],
      syncedWithGoogle: true,
      googleEventId: item.id,
    })) || []
  } catch (error) {
    console.error('Failed to fetch calendar events:', error)
    return []
  }
}

// Helper function to get follow-up type title
function getFollowUpTitle(type: string): string {
  switch (type) {
    case 'call':
      return 'Llamada'
    case 'message':
      return 'Mensaje'
    case 'meeting':
      return 'Reunión'
    case 'email':
      return 'Email'
    default:
      return 'Seguimiento'
  }
}

// Generate a Google Meet link
export async function generateMeetLink(): Promise<string | null> {
  const settings = getGoogleCalendarSettings()

  if (!settings.connected || !settings.accessToken) {
    return null
  }

  // Create a temporary event to get a Meet link
  const tempEvent = {
    summary: 'Clinic CRM - Videollamada',
    start: {
      dateTime: new Date().toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    conferenceData: {
      createRequest: {
        requestId: `clinic-meet-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${settings.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tempEvent),
      }
    )

    if (!response.ok) {
      throw new Error('Failed to generate Meet link')
    }

    const event = await response.json()
    const meetLink = event.conferenceData?.entryPoints?.[0]?.uri

    // Delete the temporary event
    await deleteCalendarEvent(event.id)

    return meetLink || null
  } catch (error) {
    console.error('Failed to generate Meet link:', error)
    return null
  }
}

// Declare gapi on window
declare global {
  interface Window {
    gapi?: {
      load: (api: string, callback: () => void) => void
      client: {
        init: (config: any) => Promise<void>
      }
      auth2: {
        getAuthInstance: () => {
          signIn: () => Promise<any>
          signOut: () => void
        }
      }
    }
  }
}
