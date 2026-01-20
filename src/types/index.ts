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
  identificationNumber?: string // DNI, passport, or other ID
  identificationType?: 'dni' | 'passport' | 'other' // Type of ID document
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
  // Lead Scoring
  score?: LeadScore
  // Payments
  payments?: Payment[]
  totalPaid?: number
  totalPending?: number
  // Surveys
  surveyResponses?: SurveyResponse[]
  lastSurveySentAt?: Date
  npsScore?: number
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

// Attendance status for in-person appointments
export type AttendanceStatus = 'pending' | 'attended' | 'noshow' | 'cancelled' | 'rescheduled'

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
  // Attendance tracking for appointments
  attendanceStatus?: AttendanceStatus
  attendanceMarkedAt?: Date
  attendanceMarkedBy?: string
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
  duration: number // in minutes (default/videocall duration)
  inPersonDuration?: number // in minutes (duration for in-person appointments)
  videocallDuration?: number // in minutes (duration for videocalls, defaults to duration)
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

// =============================================
// LEAD SCORING TYPES
// =============================================

export interface LeadScore {
  total: number // 0-100
  engagement: number // Based on responses, interactions
  value: number // Based on treatment interest value
  timing: number // Based on urgency/recency
  fit: number // Based on profile completeness
  lastCalculated: Date
}

export interface LeadScoreFactors {
  respondedToMessages: number // +15 per response
  attendedAppointments: number // +20 per attended
  missedAppointments: number // -15 per no-show
  highValueTreatment: number // +10 if interested in expensive treatments
  recentActivity: number // +10 if active in last 7 days
  profileComplete: number // +10 if has email, phone, DNI
  referralSource: number // +5 if referral
}

// =============================================
// PAYMENT TYPES
// =============================================

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'mercadopago' | 'other'
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded' | 'cancelled'

export interface Payment {
  id: string
  leadId: string
  treatmentId?: string
  treatmentName?: string
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  reference?: string // Transaction ID or receipt number
  notes?: string
  createdAt: Date
  createdBy: string
  // For payment plans
  isInstallment?: boolean
  installmentNumber?: number
  totalInstallments?: number
  parentPaymentId?: string // Links installments together
}

export interface PaymentPlan {
  id: string
  leadId: string
  treatmentId: string
  totalAmount: number
  downPayment: number
  installments: number
  installmentAmount: number
  startDate: Date
  payments: Payment[]
  status: 'active' | 'completed' | 'defaulted' | 'cancelled'
}

// =============================================
// SATISFACTION SURVEY TYPES
// =============================================

export interface SurveyQuestion {
  id: string
  question: string
  type: 'rating' | 'text' | 'yesno' | 'nps'
}

export interface SurveyResponse {
  id: string
  leadId: string
  appointmentId?: string
  treatmentId?: string
  responses: {
    questionId: string
    answer: string | number
  }[]
  npsScore?: number // 0-10 Net Promoter Score
  overallRating?: number // 1-5 stars
  feedback?: string
  createdAt: Date
  sentAt?: Date
  completedAt?: Date
}

// =============================================
// AUDIT LOG TYPES
// =============================================

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'view'
  | 'export'
  | 'login'
  | 'logout'
  | 'settings_change'

export type AuditEntity =
  | 'lead'
  | 'patient'
  | 'appointment'
  | 'treatment'
  | 'payment'
  | 'user'
  | 'settings'
  | 'report'

export interface AuditLog {
  id: string
  userId: string
  userName: string
  action: AuditAction
  entity: AuditEntity
  entityId?: string
  entityName?: string
  changes?: {
    field: string
    oldValue: unknown
    newValue: unknown
  }[]
  ipAddress?: string
  userAgent?: string
  timestamp: Date
}

// =============================================
// WHATSAPP TEMPLATE TYPES
// =============================================

export interface WhatsAppTemplate {
  id: string
  name: string
  category: 'greeting' | 'appointment' | 'reminder' | 'followup' | 'payment' | 'custom'
  content: string // With placeholders like {{name}}, {{date}}, {{treatment}}
  variables: string[] // List of variable names used
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface WhatsAppMessage {
  id: string
  leadId: string
  templateId?: string
  content: string
  sentAt: Date
  sentBy: string
  delivered?: boolean
  read?: boolean
  response?: string
  responseAt?: Date
}

// =============================================
// DOCTOR / STAFF TYPES
// =============================================

export interface Doctor {
  id: string
  name: string
  email: string
  phone?: string
  specialty: string
  color: string // For calendar display
  avatar?: string
  active: boolean
  // Scheduling
  workingHours: {
    [key: number]: { // 0-6 for Sunday-Saturday
      start: string
      end: string
      enabled: boolean
    }
  }
  slotDuration: number // Default appointment duration
  breakTimes?: {
    start: string
    end: string
  }[]
}

// =============================================
// EXPORT TYPES
// =============================================

export type ExportFormat = 'csv' | 'excel' | 'pdf'

export interface ExportOptions {
  format: ExportFormat
  dateRange?: {
    start: Date
    end: Date
  }
  includeFields: string[]
  filters?: LeadFilters
}

// =============================================
// THEME TYPES
// =============================================

export type ThemeMode = 'light' | 'dark' | 'system'

export interface ThemeSettings {
  mode: ThemeMode
  primaryColor?: string
  accentColor?: string
}
