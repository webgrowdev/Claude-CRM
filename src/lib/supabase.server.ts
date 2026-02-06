import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabaseAdmin = (() => {
  if (!supabaseUrl) throw new Error('Falta NEXT_PUBLIC_SUPABASE_URL en el servidor')
  if (!serviceKey) throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY en el servidor')
  return createClient<Database>(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
})()
