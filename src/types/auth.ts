// ============================================
// Authentication Types for Supabase
// ============================================

import { Session as SupabaseSession } from '@supabase/supabase-js'
import { Database } from './database'

// User role type from database
export type UserRole = Database['public']['Tables']['profiles']['Row']['role']

// ✅ FIX: interface can't extend indexed access types -> use `type` intersection instead
export type UserProfile = Database['public']['Tables']['profiles']['Row'] & {
  email?: string // From auth.users
}

// Auth user with profile
export interface AuthUser {
  // From auth.users
  id: string
  email?: string
  created_at?: string

  // From profiles table
  profile?: UserProfile
}

// Session type
export type Session = SupabaseSession

// Auth state
export interface AuthState {
  user: AuthUser | null
  session: Session | null
  loading: boolean
  error: Error | null
}

// Auth context type
export interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string, role?: UserRole) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
  refreshSession: () => Promise<void>
}

// Sign up data
export interface SignUpData {
  email: string
  password: string
  name: string
  role?: UserRole
  phone?: string
  clinic_id?: string
}

// Sign in data
export interface SignInData {
  email: string
  password: string
}

// Password reset data
export interface PasswordResetData {
  email: string
}

// Update password data
export interface UpdatePasswordData {
  password: string
}
