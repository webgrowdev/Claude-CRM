import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

export function getSupabaseAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  if (!serviceKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')

  return createClient<Database>(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export function createServerAuthClient() {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !anonKey) {
    throw new Error('Missing Supabase environment variables for auth client')
  }
  return createClient<Database>(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}
