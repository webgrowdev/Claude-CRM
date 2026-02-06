import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}
if (!serviceKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
}

// ✅ Export clásico (para no tocar imports en tus rutas)
export const supabaseAdmin = createClient<Database>(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// ✅ Si querés también la versión lazy (opcional)
export function getSupabaseAdmin() {
  return supabaseAdmin
}

export function createServerAuthClient() {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!anonKey) throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')

  return createClient<Database>(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}
