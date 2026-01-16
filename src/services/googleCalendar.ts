// Google Calendar Integration Service
// This service handles synchronization with Google Calendar and Google Meet

import { CalendarEvent, FollowUp, Lead, GoogleCalendarSettings } from '@/types'

// Get client ID at runtime (not at module load time)
function getGoogleClientId(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
}

const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
]

// Storage key for settings
const SETTINGS_KEY = 'clinic_google_calendar_settings'

// Default settings
const defaultSettings: GoogleCalendarSettings = {
  connected: false,
  autoCreateMeetLinks: true,
  syncFollowUps: true,
}

// Extended settings with expiration
interface ExtendedGoogleSettings extends GoogleCalendarSettings {
  expiresAt?: number
}

// Get current settings from localStorage
export function getGoogleCalendarSettings(): ExtendedGoogleSettings {
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
export function saveGoogleCalendarSettings(settings: ExtendedGoogleSettings): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

// Check if token is expired
export function isTokenExpired(): boolean {
  const settings = getGoogleCalendarSettings()
  if (!settings.expiresAt) return true
  // Consider expired 5 minutes before actual expiration
  return Date.now() > settings.expiresAt - (5 * 60 * 1000)
}

// Generate OAuth URL for Google Calendar
export function getGoogleAuthUrl(): string {
  const clientId = getGoogleClientId()
  const redirectUri = `${window.location.origin}/api/auth/callback/google`

  console.log('Generating OAuth URL with:', {
    clientId: clientId ? clientId.substring(0, 20) + '...' : 'NOT SET',
    redirectUri,
  })

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GOOGLE_CALENDAR_SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

// Connect to Google Calendar (redirects to Google OAuth)
export function connectGoogleCalendar(): void {
  const clientId = getGoogleClientId()

  console.log('connectGoogleCalendar called')
  console.log('NEXT_PUBLIC_GOOGLE_CLIENT_ID:', clientId ? 'SET' : 'NOT SET')

  if (!clientId) {
    console.error('Google Client ID not configured!')
    throw new Error('Google Calendar integration not configured. Please add NEXT_PUBLIC_GOOGLE_CLIENT_ID to your environment variables.')
  }

  const authUrl = getGoogleAuthUrl()
  console.log('Redirecting to:', authUrl)
  window.location.href = authUrl
}

// Disconnect from Google Calendar
export function disconnectGoogleCalendar(): void {
  saveGoogleCalendarSettings(defaultSettings)
}

// Make authenticated request to Google Calendar API
async function googleCalendarRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const settings = getGoogleCalendarSettings()

  if (!settings.connected || !settings.accessToken) {
    throw new Error('Google Calendar not connected')
  }

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3${endpoint}`,
    {
      ...options,
      headers: {
        Authorization: `Bearer ${settings.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    }
  )

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired, need to reconnect
      disconnectGoogleCalendar()
      throw new Error('Token expired. Please reconnect to Google Calendar.')
    }
    throw new Error(`Google Calendar API error: ${response.statusText}`)
  }

  return response.json()
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

  const duration = followUp.duration || 30 // Use follow-up duration or default 30 min
  const endTime = new Date(followUp.scheduledAt)
  endTime.setMinutes(endTime.getMinutes() + duration)

  const eventData: any = {
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
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 1 day before
        { method: 'popup', minutes: 30 }, // 30 minutes before
        { method: 'popup', minutes: 10 }, // 10 minutes before
      ],
    },
  }

  // Add Google Meet for meetings
  if (settings.autoCreateMeetLinks && followUp.type === 'meeting') {
    eventData.conferenceData = {
      createRequest: {
        requestId: `clinic-crm-${followUp.id}-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    }
  }

  try {
    const calendarId = settings.calendarId || 'primary'
    const googleEvent = await googleCalendarRequest<any>(
      `/calendars/${calendarId}/events?conferenceDataVersion=1`,
      {
        method: 'POST',
        body: JSON.stringify(eventData),
      }
    )

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
    const calendarId = settings.calendarId || 'primary'
    await googleCalendarRequest(
      `/calendars/${calendarId}/events/${googleEventId}`,
      {
        method: 'PATCH',
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

    return true
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
    const calendarId = settings.calendarId || 'primary'
    await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${googleEventId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${settings.accessToken}`,
        },
      }
    )

    return true
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
    const calendarId = settings.calendarId || 'primary'
    const now = new Date().toISOString()

    const data = await googleCalendarRequest<any>(
      `/calendars/${calendarId}/events?timeMin=${encodeURIComponent(now)}&maxResults=${maxResults}&orderBy=startTime&singleEvents=true`
    )

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

// Generate a Google Meet link by creating a temporary event
export async function generateMeetLink(): Promise<string | null> {
  const settings = getGoogleCalendarSettings()

  if (!settings.connected || !settings.accessToken) {
    return null
  }

  const now = new Date()
  const end = new Date(now.getTime() + 30 * 60 * 1000)

  const tempEvent = {
    summary: 'Clinic CRM - Videollamada',
    start: {
      dateTime: now.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: end.toISOString(),
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
    const calendarId = settings.calendarId || 'primary'
    const event = await googleCalendarRequest<any>(
      `/calendars/${calendarId}/events?conferenceDataVersion=1`,
      {
        method: 'POST',
        body: JSON.stringify(tempEvent),
      }
    )

    const meetLink = event.conferenceData?.entryPoints?.[0]?.uri

    // Delete the temporary event
    if (event.id) {
      await deleteCalendarEvent(event.id)
    }

    return meetLink || null
  } catch (error) {
    console.error('Failed to generate Meet link:', error)
    return null
  }
}

// Create event for a meeting with a lead
export async function createMeetingEvent(
  lead: Lead,
  scheduledAt: Date,
  duration: number = 30, // minutes
  notes?: string
): Promise<{ event: CalendarEvent | null; meetLink: string | null }> {
  const settings = getGoogleCalendarSettings()

  if (!settings.connected || !settings.accessToken) {
    return { event: null, meetLink: null }
  }

  const endTime = new Date(scheduledAt)
  endTime.setMinutes(endTime.getMinutes() + duration)

  const eventData = {
    summary: `Cita - ${lead.name}`,
    description: `
Cliente: ${lead.name}
Teléfono: ${lead.phone}
${lead.email ? `Email: ${lead.email}` : ''}
Tratamientos de interés: ${lead.treatments.join(', ') || 'No especificado'}

${notes || ''}

---
Creado por Clinic CRM
    `.trim(),
    start: {
      dateTime: scheduledAt.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    attendees: lead.email ? [{ email: lead.email }] : [],
    conferenceData: {
      createRequest: {
        requestId: `clinic-meeting-${lead.id}-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 1 day before
        { method: 'popup', minutes: 30 }, // 30 minutes before
      ],
    },
  }

  try {
    const calendarId = settings.calendarId || 'primary'
    const googleEvent = await googleCalendarRequest<any>(
      `/calendars/${calendarId}/events?conferenceDataVersion=1&sendUpdates=all`,
      {
        method: 'POST',
        body: JSON.stringify(eventData),
      }
    )

    const meetLink = googleEvent.conferenceData?.entryPoints?.[0]?.uri || null

    const calendarEvent: CalendarEvent = {
      id: `cal-${Date.now()}`,
      title: eventData.summary,
      description: eventData.description,
      start: scheduledAt,
      end: endTime,
      meetLink,
      attendees: lead.email ? [lead.email] : [],
      leadId: lead.id,
      syncedWithGoogle: true,
      googleEventId: googleEvent.id,
    }

    return { event: calendarEvent, meetLink }
  } catch (error) {
    console.error('Failed to create meeting event:', error)
    return { event: null, meetLink: null }
  }
}
