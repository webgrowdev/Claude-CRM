import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'


console.log('[ENV CHECK]', {
  hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  hasAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  hasService: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
})
// Create typed Supabase client
// This allows the app to build and run in demo mode with dummy values if not configured
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
})

// Server-side client with service role key (for admin operations)
// WARNING: Only use this on the server side, never expose to client
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  }
)

// Helper to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_URL && 
         process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'placeholder-key'
}

// Helper to get current user's profile
export const getCurrentUserProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return profile
}

// Helper to get current user's clinic_id
export const getCurrentUserClinicId = async () => {
  const profile = await getCurrentUserProfile()
  return profile?.clinic_id || null
}
