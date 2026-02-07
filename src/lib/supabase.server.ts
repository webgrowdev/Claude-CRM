import 'server-only'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

let _supabaseAdmin: SupabaseClient<Database> | null = null
let _supabaseAdminKeySig: string | null = null

export function getSupabaseAdmin(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  if (!serviceKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')

  // Si cambió el serviceKey (o si antes estaba null), recrea el client
  if (!_supabaseAdmin || _supabaseAdminKeySig !== serviceKey) {
    _supabaseAdminKeySig = serviceKey
    _supabaseAdmin = createClient<Database>(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }

  return _supabaseAdmin
}

export function createServerAuthClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  if (!anonKey) throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
  return createClient<Database>(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}
