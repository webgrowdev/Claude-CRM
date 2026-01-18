// =============================================
// FUNNEL & STATUS TYPES
// =============================================

// Funnel Status Types (expanded for clinic workflow)
export type FunnelStatus =
  | 'new'           // Nuevo - Lead recién llegado
  | 'contacted'     // Contactado - Se le habló
  | 'appointment'   // Turno agendado - Tiene cita
  | 'attended'      // Asistió - Vino a la cita
  | 'closed'        // Cerró tratamiento - Pagó/Compró
  | 'followup'      // Seguimiento - Post-tratamiento
  | 'lost'          // Perdido - No interesado
  | 'noshow'        // No asistió - Faltó a la cita

// Legacy support - maps to new statuses
export type LeadStatus = 'new' | 'contacted' | 'scheduled' | 'closed' | 'lost'

// Lead Source Types
export type LeadSource = 'instagram' | 'whatsapp' | 'phone' | 'website' | 'referral' | 'other'

// Follow-up Types (expanded to include in-person appointments)
export type FollowUpType = 'call' | 'message' | 'email' | 'meeting' | 'appointment'

// =============================================
// USER & ROLE TYPES
// =============================================

export type UserRole = 'owner' | 'manager' | 'doctor' | 'receptionist'

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  role: UserRole
  avatar?: string
  specialty?: string // For doctors/display role
  color?: string // For calendar display
}

// =============================================
// PATIENT / LEAD TYPES
// =============================================

export interface Lead {
  id: string
  name: string
  email?: string
  phone: string
  source: LeadSource
  status: LeadStatus
  funnelStatus?: FunnelStatus // New expanded status
  treatments: string[]
  notes: Note[]
  followUps: FollowUp[]
  assignedTo?: string
  createdAt: Date
  updatedAt: Date
  closedAt?: Date
  value?: number
  // Enhanced fields
  instagram?: string
  preferredTime?: string // "morning" | "afternoon" | "evening"
  campaign?: string // Marketing campaign source
  tags?: string[]
  lastContactAt?: Date
  nextActionAt?: Date
  nextAction?: string
}

// Alias for clarity
export type Patient = Lead

// =============================================
// NOTE TYPES
// =============================================

export interface Note {
  id: string
  content: string
  createdAt: Date
  createdBy: string
}

// =============================================
// FOLLOW-UP TYPES
// =============================================

export interface FollowUp {
  id: string
  leadId: string
  type: FollowUpType
  scheduledAt: Date
  completed: boolean
  completedAt?: Date
  notes?: string
  // Google Calendar integration
  googleEventId?: string
  meetLink?: string
  duration?: number // in minutes
  // Treatment selection
  treatmentId?: string
  treatmentName?: string
  // Enhanced fields
  assignedTo?: string
  reminderSent?: boolean
  confirmedByPatient?: boolean
}

// =============================================
// APPOINTMENT TYPES
// =============================================

export type AppointmentStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'noshow' | 'cancelled' | 'rescheduled'

export interface Appointment {
  id: string
  patientId: string
  patientName: string
  doctorId: string
  doctorName: string
  treatmentId?: string
  treatmentName?: string
  scheduledAt: Date
  duration: number // minutes
  status: AppointmentStatus
  notes?: string
  googleEventId?: string
  meetLink?: string
  confirmedAt?: Date
  completedAt?: Date
  // For display
  color?: string
}

// =============================================
// TREATMENT TYPES
// =============================================

export interface Treatment {
  id: string
  name: string
  category: string
  price: number
  duration: number // in minutes
  description?: string
  active?: boolean
}

// =============================================
// ACTIVITY TYPES
// =============================================

export type ActivityType =
  | 'note_added'
  | 'status_changed'
  | 'followup_scheduled'
  | 'followup_completed'
  | 'lead_created'
  | 'appointment_scheduled'
  | 'appointment_confirmed'
  | 'appointment_completed'
  | 'appointment_noshow'
  | 'message_sent'
  | 'call_made'
  | 'payment_received'

export interface Activity {
  id: string
  leadId: string
  type: ActivityType
  description: string
  createdAt: Date
  createdBy: string
  metadata?: Record<string, unknown>
}

// =============================================
// DASHBOARD & STATS TYPES
// =============================================

export interface DashboardStats {
  newLeads: number
  newLeadsChange: number
  followUpsDue: number
  overdueFollowUps: number
  closedThisWeek: number
  closedChange: number
  conversionRate: number
  conversionChange: number
  // Enhanced stats
  todayAppointments?: number
  pendingConfirmations?: number
  noShowRate?: number
  revenueThisMonth?: number
}

// =============================================
// KANBAN TYPES
// =============================================

export interface KanbanColumn {
  id: FunnelStatus
  title: string
  color: string
  leads: Lead[]
  count?: number
}

// =============================================
// REPORT TYPES
// =============================================

export interface ConversionFunnel {
  stage: string
  count: number
  percentage: number
}

export interface LeadSourceData {
  source: LeadSource
  count: number
  percentage: number
  conversion?: number
}

export interface ReportData {
  totalLeads: number
  totalLeadsChange: number
  conversionRate: number
  conversionRateChange: number
  closedSales: number
  closedSalesChange: number
  avgCloseTime: number
  avgCloseTimeChange: number
  funnel: ConversionFunnel[]
  sources: LeadSourceData[]
  // Enhanced
  noShowRate?: number
  revenueByTreatment?: { treatment: string; revenue: number }[]
  conversionByChannel?: { channel: string; rate: number }[]
}

// =============================================
// FILTER TYPES
// =============================================

export interface LeadFilters {
  status?: LeadStatus | FunnelStatus | 'all'
  source?: LeadSource | 'all'
  search?: string
  assignedTo?: string
  dateRange?: {
    start: Date
    end: Date
  }
  tags?: string[]
}

// =============================================
// NOTIFICATION TYPES
// =============================================

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'new_lead' | 'appointment_reminder' | 'noshow_alert'

export interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  read: boolean
  createdAt: Date
  leadId?: string
  appointmentId?: string
  actionUrl?: string
}

// =============================================
// SETTINGS TYPES
// =============================================

export interface Settings {
  clinicName: string
  clinicAddress?: string
  clinicPhone?: string
  clinicEmail?: string
  clinicLogo?: string
  notificationsEnabled: boolean
  reminderTime: number // minutes before follow-up
  workingHours?: {
    start: string // "09:00"
    end: string   // "18:00"
    days: number[] // [1,2,3,4,5] = Mon-Fri
  }
  slotDuration?: number // default appointment duration in minutes
}

// =============================================
// CALENDAR & GOOGLE TYPES
// =============================================

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  start: Date
  end: Date
  location?: string
  meetLink?: string
  attendees?: string[]
  leadId?: string
  patientId?: string
  followUpId?: string
  appointmentId?: string
  syncedWithGoogle?: boolean
  googleEventId?: string
  color?: string
  status?: AppointmentStatus
}

export interface GoogleCalendarSettings {
  connected: boolean
  email?: string
  accessToken?: string
  refreshToken?: string
  calendarId?: string
  autoCreateMeetLinks: boolean
  syncFollowUps: boolean
}

// =============================================
// MANYCHAT TYPES
// =============================================

export type ManyChatEventType =
  | 'new_subscriber'
  | 'message_received'
  | 'button_clicked'
  | 'appointment_requested'
  | 'contact_info_shared'

export interface ManyChatWebhook {
  id: string
  type: ManyChatEventType
  timestamp: Date
  subscriber: {
    id: string
    name: string
    phone?: string
    email?: string
    instagram?: string
  }
  data?: {
    message?: string
    treatment?: string
    appointmentDate?: string
    appointmentTime?: string
    campaign?: string
    keyword?: string
  }
}

export interface ManyChatSettings {
  connected: boolean
  apiKey?: string
  botId?: string
  webhookUrl?: string
  autoCreateLeads: boolean
  defaultAssignee?: string
  sendAppointmentReminders?: boolean
  sendNoShowFollowUp?: boolean
}

// =============================================
// TIME SLOT TYPES
// =============================================

export interface TimeSlot {
  time: string // "09:00"
  available: boolean
  appointmentId?: string
}

export interface DaySchedule {
  date: Date
  doctorId: string
  slots: TimeSlot[]
}
