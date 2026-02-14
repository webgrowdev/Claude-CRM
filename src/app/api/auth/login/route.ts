import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin, createServerAuthClient } from '@/lib/supabase.server'
import { generateToken } from '@/lib/auth'
import type { Database } from '@/types/database'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0


type ProfileRow = Database['public']['Tables']['profiles']['Row']
type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
const BUILD_SIG = 'login-2026-02-14-1032'

export async function POST(request: NextRequest) {

  console.log('[ENV CHECK SERVER]', {
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
  NODE_ENV: process.env.NODE_ENV,
  cwd: process.cwd(),
  pid: process.pid,
})


  try {
    
    // Validate Supabase configuration first
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase URL or Anon Key environment variables')
      return NextResponse.json(
        { error: 'Error de configuración del servidor: faltan credenciales de Supabase' },
        { status: 500 }
      )
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
      return NextResponse.json(
        {
          build: BUILD_SIG,
          error: 'Falta SUPABASE_SERVICE_ROLE_KEY en el servidor. Sin esto, supabaseAdmin no puede bypass RLS.',
          hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          cwd: process.cwd(),
          pid: process.pid,
        },
        { status: 500 }
      )

    }
    
    const supabaseAdmin = getSupabaseAdmin()
    const body = (await request.json().catch(() => null)) as
      | { email?: string; password?: string }
      | null

    const email = body?.email?.trim().toLowerCase()
    const password = body?.password

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña son requeridos' }, { status: 400 })
    }

    // 1) Login contra Supabase Auth (server-side, sin persistencia)
    const serverAuth = createServerAuthClient()
    const { data: authData, error: authError } = await serverAuth.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.user) {
      console.error('Supabase auth error:', authError)
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    const authUser = authData.user
    const authEmail = (authUser.email || email).toLowerCase()
    const authUserId = authUser.id

    // 2) Buscar en public.users (tu “perfil” real)
    // OJO: no filtro is_active acá para no forzar inserts duplicados; valido después.
    const { data: profileRow, error: profileLookupErr } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authUserId)
      .maybeSingle()

    if (profileLookupErr) {
      console.error('Supabase users lookup error:', profileLookupErr)
      return NextResponse.json({ error: 'Error consultando el usuario' }, { status: 500 })
    }

    let u: ProfileRow | null = (profileRow as ProfileRow | null) ?? null

    // 2b) Si no existe, lo creamos con id = auth.users.id
    if (!u) {
      const newProfile: ProfileInsert = {
        id: authUserId, // CRÍTICO: debe ser el mismo que auth.users.id para que auth.uid() funcione con RLS
        name: authUser.user_metadata?.name || authEmail.split('@')[0] || 'Usuario',
        role: 'owner',     // válido por tu CHECK
        clinic_id: null,   // por ahora null
        is_active: true,
        phone: authUser.user_metadata?.phone ?? null,
        avatar_url: authUser.user_metadata?.avatar_url ?? null,
        specialty: authUser.user_metadata?.specialty ?? null,
        color: authUser.user_metadata?.color ?? null,
      } as ProfileInsert

      // upsert evita duplicados por requests concurrentes
      const { data: created, error: createErr } = await supabaseAdmin
        .from('profiles')
        .upsert(newProfile, { onConflict: 'id' })
        .select('*')
        .single()

      if (createErr || !created) {
        console.error('Create profile error:', createErr)

        const debug =
          process.env.NODE_ENV !== 'production'
            ? {
                message: createErr?.message,
                details: (createErr as any)?.details,
                hint: (createErr as any)?.hint,
                code: (createErr as any)?.code,
              }
            : undefined

        return NextResponse.json(
          { error: 'No se pudo crear el usuario (perfil)', debug },
          { status: 500 }
        )
      }

      u = created as ProfileRow
    }

    // 2c) Validar activo
    if (!u.is_active) {
      return NextResponse.json({ error: 'Usuario desactivado' }, { status: 403 })
    }

    // 3) Emitir JWT interno (tu AuthContext)
    const token = await generateToken({
      userId: u.id,
      email: authEmail,
      role: u.role,
      clinicId: u.clinic_id ?? '',
    })

    // 4) Activity log (opcional)
    if (u.clinic_id) {
      await supabaseAdmin.from('activity_logs').insert({
        clinic_id: u.clinic_id,
        user_id: u.id,
        action_type: 'view',
        resource_type: 'user',
        resource_id: u.id,
        description: 'User login',
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent'),
      })
    }

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: u.id,
        email: authEmail,
        name: u.name,
        role: u.role,
        clinic_id: u.clinic_id,
        phone: u.phone,
        is_active: u.is_active,
        avatar_url: u.avatar_url,
        specialty: u.specialty,
        color: u.color,
        created_at: u.created_at,
        updated_at: u.updated_at,
      },
    })
  }  catch (error) {
  console.error('Login error (FULL):', error)

  const debug =
    error instanceof Error
      ? { message: error.message, stack: error.stack }
      : { message: String(error) }

    return NextResponse.json(
      { build: BUILD_SIG, error: 'Error al iniciar sesión', debug },
      { status: 500 }
    )

}

}
