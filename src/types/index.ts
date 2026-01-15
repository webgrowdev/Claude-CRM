// Lead Status Types
export type LeadStatus = 'new' | 'contacted' | 'scheduled' | 'closed' | 'lost'

// Lead Source Types
export type LeadSource = 'instagram' | 'whatsapp' | 'phone' | 'website' | 'referral' | 'other'

// Follow-up Types
export type FollowUpType = 'call' | 'message' | 'email' | 'meeting'

// Lead Interface
export interface Lead {
  id: string
  name: string
  email?: string
  phone: string
  source: LeadSource
  status: LeadStatus
  treatments: string[]
  notes: Note[]
  followUps: FollowUp[]
  assignedTo?: string
  createdAt: Date
  updatedAt: Date
  closedAt?: Date
  value?: number
}

// Note Interface
export interface Note {
  id: string
  content: string
  createdAt: Date
  createdBy: string
}

// Follow-up Interface
export interface FollowUp {
  id: string
  leadId: string
  type: FollowUpType
  scheduledAt: Date
  completed: boolean
  completedAt?: Date
  notes?: string
}

// Treatment Interface
export interface Treatment {
  id: string
  name: string
  category: string
  price: number
  duration: number // in minutes
  description?: string
}

// User Interface
export interface User {
  id: string
  name: string
  email: string
  role: 'owner' | 'manager' | 'receptionist'
  avatar?: string
}

// Activity Types
export type ActivityType = 'note_added' | 'status_changed' | 'followup_scheduled' | 'followup_completed' | 'lead_created'

// Activity Interface
export interface Activity {
  id: string
  leadId: string
  type: ActivityType
  description: string
  createdAt: Date
  createdBy: string
  metadata?: Record<string, unknown>
}

// Stats Interface
export interface DashboardStats {
  newLeads: number
  newLeadsChange: number
  followUpsDue: number
  overdueFollowUps: number
  closedThisWeek: number
  closedChange: number
  conversionRate: number
  conversionChange: number
}

// Kanban Column Interface
export interface KanbanColumn {
  id: LeadStatus
  title: string
  color: string
  leads: Lead[]
}

// Report Data Interfaces
export interface ConversionFunnel {
  stage: string
  count: number
  percentage: number
}

export interface LeadSourceData {
  source: LeadSource
  count: number
  percentage: number
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
}

// Filter Options
export interface LeadFilters {
  status?: LeadStatus | 'all'
  source?: LeadSource | 'all'
  search?: string
  dateRange?: {
    start: Date
    end: Date
  }
}

// Notification Interface
export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  createdAt: Date
  leadId?: string
}

// Settings Interface
export interface Settings {
  clinicName: string
  clinicAddress?: string
  clinicPhone?: string
  clinicEmail?: string
  notificationsEnabled: boolean
  reminderTime: number // minutes before follow-up
}
