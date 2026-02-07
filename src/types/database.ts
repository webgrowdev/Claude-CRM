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
          api_key: string | null
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
          api_key?: string | null
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
          api_key?: string | null
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
          // ManyChat fields
          manychat_subscriber_id: string | null
          manychat_tags: string[] | null
          manychat_custom_fields: Json | null
          manychat_subscription_status: string | null
          manychat_last_message_date: string | null
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
          // ManyChat fields
          manychat_subscriber_id?: string | null
          manychat_tags?: string[] | null
          manychat_custom_fields?: Json | null
          manychat_subscription_status?: string | null
          manychat_last_message_date?: string | null
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
          // ManyChat fields
          manychat_subscriber_id?: string | null
          manychat_tags?: string[] | null
          manychat_custom_fields?: Json | null
          manychat_subscription_status?: string | null
          manychat_last_message_date?: string | null
          created_at?: string
          updated_at?: string
          closed_at?: string | null
        }
      }
      /**
       * @deprecated Use 'profiles' table instead. This table exists for backward compatibility only.
       * The 'users' table should not be used in new code - all user data is now in 'profiles' table
       * linked to auth.users. Email is stored in auth.users, not in profiles.
       */
      users: {
  Row: {
    id: string
    email: string
    password_hash: string
    name: string
    phone: string | null
    role: 'owner' | 'manager' | 'doctor' | 'receptionist'
    avatar_url: string | null
    specialty: string | null
    color: string | null
    clinic_id: string | null
    is_active: boolean | null
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    email: string
    password_hash: string
    name: string
    phone?: string | null
    role: 'owner' | 'manager' | 'doctor' | 'receptionist'
    avatar_url?: string | null
    specialty?: string | null
    color?: string | null
    clinic_id?: string | null
    is_active?: boolean | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    email?: string
    password_hash?: string
    name?: string
    phone?: string | null
    role?: 'owner' | 'manager' | 'doctor' | 'receptionist'
    avatar_url?: string | null
    specialty?: string | null
    color?: string | null
    clinic_id?: string | null
    is_active?: boolean | null
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: 'users_clinic_id_fkey'
      columns: ['clinic_id']
      isOneToOne: false
      referencedRelation: 'clinics'
      referencedColumns: ['id']
    }
  ]
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
      follow_ups: {
        Row: {
          id: string
          clinic_id: string
          patient_id: string
          type: string
          scheduled_at: string
          completed: boolean
          completed_at: string | null
          notes: string | null
          duration: number | null
          treatment_id: string | null
          treatment_name: string | null
          assigned_to: string | null
          google_event_id: string | null
          meet_link: string | null
          appointment_status: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          patient_id: string
          type: string
          scheduled_at: string
          completed?: boolean
          completed_at?: string | null
          notes?: string | null
          duration?: number | null
          treatment_id?: string | null
          treatment_name?: string | null
          assigned_to?: string | null
          google_event_id?: string | null
          meet_link?: string | null
          appointment_status?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          patient_id?: string
          type?: string
          scheduled_at?: string
          completed?: boolean
          completed_at?: string | null
          notes?: string | null
          duration?: number | null
          treatment_id?: string | null
          treatment_name?: string | null
          assigned_to?: string | null
          google_event_id?: string | null
          meet_link?: string | null
          appointment_status?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          clinic_id: string
          user_id: string | null
          action_type: 'create' | 'update' | 'delete' | 'view' | 'sync'
          resource_type: 'patient' | 'appointment' | 'treatment' | 'user' | 'clinic'
          resource_id: string | null
          description: string | null
          changes: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          user_id?: string | null
          action_type: 'create' | 'update' | 'delete' | 'view' | 'sync'
          resource_type: 'patient' | 'appointment' | 'treatment' | 'user' | 'clinic'
          resource_id?: string | null
          description?: string | null
          changes?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          user_id?: string | null
          action_type?: 'create' | 'update' | 'delete' | 'view' | 'sync'
          resource_type?: 'patient' | 'appointment' | 'treatment' | 'user' | 'clinic'
          resource_id?: string | null
          description?: string | null
          changes?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      manychat_settings: {
        Row: {
          id: string
          clinic_id: string
          connected: boolean
          api_key: string | null
          webhook_secret: string | null
          channel_id: string | null
          auto_create_patients: boolean
          auto_sync_enabled: boolean
          sync_interval_hours: number
          last_sync_at: string | null
          webhook_url: string | null
          default_assignee: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          connected?: boolean
          api_key?: string | null
          webhook_secret?: string | null
          channel_id?: string | null
          auto_create_patients?: boolean
          auto_sync_enabled?: boolean
          sync_interval_hours?: number
          last_sync_at?: string | null
          webhook_url?: string | null
          default_assignee?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          connected?: boolean
          api_key?: string | null
          webhook_secret?: string | null
          channel_id?: string | null
          auto_create_patients?: boolean
          auto_sync_enabled?: boolean
          sync_interval_hours?: number
          last_sync_at?: string | null
          webhook_url?: string | null
          default_assignee?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      manychat_webhook_logs: {
        Row: {
          id: string
          clinic_id: string
          subscriber_id: string
          event_type: string
          payload: Json
          processed: boolean
          patient_id: string | null
          error: string | null
          created_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          subscriber_id: string
          event_type: string
          payload: Json
          processed?: boolean
          patient_id?: string | null
          error?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          subscriber_id?: string
          event_type?: string
          payload?: Json
          processed?: boolean
          patient_id?: string | null
          error?: string | null
          created_at?: string
        }
      }
      manychat_sync_history: {
        Row: {
          id: string
          clinic_id: string
          user_id: string | null
          sync_type: string
          total_count: number
          created_count: number
          updated_count: number
          failed_count: number
          errors: Json | null
          started_at: string
          completed_at: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          user_id?: string | null
          sync_type: string
          total_count?: number
          created_count?: number
          updated_count?: number
          failed_count?: number
          errors?: Json | null
          started_at?: string
          completed_at?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          user_id?: string | null
          sync_type?: string
          total_count?: number
          created_count?: number
          updated_count?: number
          failed_count?: number
          errors?: Json | null
          started_at?: string
          completed_at?: string | null
          status?: string
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
