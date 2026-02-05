// ============================================
// Supabase Database Types
// Auto-generated from database schema
// ============================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clinics: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          address: string | null
          city: string | null
          state: string | null
          country: string | null
          timezone: string | null
          logo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          timezone?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          timezone?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          clinic_id: string | null
          name: string
          phone: string | null
          role: 'owner' | 'manager' | 'doctor' | 'receptionist'
          avatar_url: string | null
          specialty: string | null
          color: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          clinic_id?: string | null
          name: string
          phone?: string | null
          role: 'owner' | 'manager' | 'doctor' | 'receptionist'
          avatar_url?: string | null
          specialty?: string | null
          color?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string | null
          name?: string
          phone?: string | null
          role?: 'owner' | 'manager' | 'doctor' | 'receptionist'
          avatar_url?: string | null
          specialty?: string | null
          color?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      patients: {
        Row: {
          id: string
          clinic_id: string
          name: string
          email: string | null
          phone: string
          identification_number: string | null
          identification_type: 'dni' | 'passport' | 'other' | null
          source: 'instagram' | 'whatsapp' | 'phone' | 'website' | 'referral' | 'other'
          status: 'new' | 'contacted' | 'scheduled' | 'closed' | 'lost'
          funnel_status: 'new' | 'contacted' | 'appointment' | 'attended' | 'closed' | 'followup' | 'lost' | 'noshow' | null
          instagram_handle: string | null
          preferred_time: string | null
          campaign: string | null
          tags: string[] | null
          last_contact_at: string | null
          next_action_at: string | null
          next_action: string | null
          nps_score: number | null
          assigned_to: string | null
          value: number
          total_paid: number
          total_pending: number
          created_at: string
          updated_at: string
          closed_at: string | null
        }
        Insert: {
          id?: string
          clinic_id: string
          name: string
          email?: string | null
          phone: string
          identification_number?: string | null
          identification_type?: 'dni' | 'passport' | 'other' | null
          source: 'instagram' | 'whatsapp' | 'phone' | 'website' | 'referral' | 'other'
          status?: 'new' | 'contacted' | 'scheduled' | 'closed' | 'lost'
          funnel_status?: 'new' | 'contacted' | 'appointment' | 'attended' | 'closed' | 'followup' | 'lost' | 'noshow' | null
          instagram_handle?: string | null
          preferred_time?: string | null
          campaign?: string | null
          tags?: string[] | null
          last_contact_at?: string | null
          next_action_at?: string | null
          next_action?: string | null
          nps_score?: number | null
          assigned_to?: string | null
          value?: number
          total_paid?: number
          total_pending?: number
          created_at?: string
          updated_at?: string
          closed_at?: string | null
        }
        Update: {
          id?: string
          clinic_id?: string
          name?: string
          email?: string | null
          phone?: string
          identification_number?: string | null
          identification_type?: 'dni' | 'passport' | 'other' | null
          source?: 'instagram' | 'whatsapp' | 'phone' | 'website' | 'referral' | 'other'
          status?: 'new' | 'contacted' | 'scheduled' | 'closed' | 'lost'
          funnel_status?: 'new' | 'contacted' | 'appointment' | 'attended' | 'closed' | 'followup' | 'lost' | 'noshow' | null
          instagram_handle?: string | null
          preferred_time?: string | null
          campaign?: string | null
          tags?: string[] | null
          last_contact_at?: string | null
          next_action_at?: string | null
          next_action?: string | null
          nps_score?: number | null
          assigned_to?: string | null
          value?: number
          total_paid?: number
          total_pending?: number
          created_at?: string
          updated_at?: string
          closed_at?: string | null
        }
      }
      treatments: {
        Row: {
          id: string
          clinic_id: string
          name: string
          category: string | null
          price: number
          duration: number
          in_person_duration: number | null
          videocall_duration: number | null
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          name: string
          category?: string | null
          price: number
          duration: number
          in_person_duration?: number | null
          videocall_duration?: number | null
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          name?: string
          category?: string | null
          price?: number
          duration?: number
          in_person_duration?: number | null
          videocall_duration?: number | null
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          clinic_id: string
          patient_id: string
          doctor_id: string | null
          treatment_id: string | null
          scheduled_at: string
          duration: number
          status: 'pending' | 'confirmed' | 'completed' | 'no-show' | 'cancelled'
          treatment_phase: 'consultation' | 'preparation' | 'treatment' | 'recovery' | 'completed' | null
          method: 'in-person' | 'video' | 'call'
          notes: string | null
          google_event_id: string | null
          meet_link: string | null
          confirmed_at: string | null
          completed_at: string | null
          started_at: string | null
          outcome_result: 'success' | 'partial' | 'failed' | null
          outcome_description: string | null
          next_steps: string | null
          session_number: number | null
          total_sessions: number | null
          days_until_followup: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          patient_id: string
          doctor_id?: string | null
          treatment_id?: string | null
          scheduled_at: string
          duration: number
          status?: 'pending' | 'confirmed' | 'completed' | 'no-show' | 'cancelled'
          treatment_phase?: 'consultation' | 'preparation' | 'treatment' | 'recovery' | 'completed' | null
          method?: 'in-person' | 'video' | 'call'
          notes?: string | null
          google_event_id?: string | null
          meet_link?: string | null
          confirmed_at?: string | null
          completed_at?: string | null
          started_at?: string | null
          outcome_result?: 'success' | 'partial' | 'failed' | null
          outcome_description?: string | null
          next_steps?: string | null
          session_number?: number | null
          total_sessions?: number | null
          days_until_followup?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          patient_id?: string
          doctor_id?: string | null
          treatment_id?: string | null
          scheduled_at?: string
          duration?: number
          status?: 'pending' | 'confirmed' | 'completed' | 'no-show' | 'cancelled'
          treatment_phase?: 'consultation' | 'preparation' | 'treatment' | 'recovery' | 'completed' | null
          method?: 'in-person' | 'video' | 'call'
          notes?: string | null
          google_event_id?: string | null
          meet_link?: string | null
          confirmed_at?: string | null
          completed_at?: string | null
          started_at?: string | null
          outcome_result?: 'success' | 'partial' | 'failed' | null
          outcome_description?: string | null
          next_steps?: string | null
          session_number?: number | null
          total_sessions?: number | null
          days_until_followup?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      patient_notes: {
        Row: {
          id: string
          clinic_id: string
          patient_id: string
          content: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          patient_id: string
          content: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          patient_id?: string
          content?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          clinic_id: string
          user_id: string | null
          action_type: 'create' | 'update' | 'delete' | 'view'
          resource_type: 'patient' | 'appointment' | 'treatment' | 'user' | 'clinic'
          resource_id: string | null
          changes: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          user_id?: string | null
          action_type: 'create' | 'update' | 'delete' | 'view'
          resource_type: 'patient' | 'appointment' | 'treatment' | 'user' | 'clinic'
          resource_id?: string | null
          changes?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          user_id?: string | null
          action_type?: 'create' | 'update' | 'delete' | 'view'
          resource_type?: 'patient' | 'appointment' | 'treatment' | 'user' | 'clinic'
          resource_id?: string | null
          changes?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
