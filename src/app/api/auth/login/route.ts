import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, createServerAuthClient } from '@/lib/supabase.server'
import { generateToken } from '@/lib/auth'
import type { Database } from '@/types/database'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type ProfileRow = Database['public']['Tables']['profiles']['Row']
type ProfileInsert = Database['public']['Tables']['profiles']['Insert']

export async function POST(request: NextRequest) {
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
          error:
            'Falta SUPABASE_SERVICE_ROLE_KEY en el servidor. Sin esto, supabaseAdmin no puede bypass RLS.',
        },
        { status: 500 }
      )
    }

    const body = (await request.json().catch(() => null)) as
      | { email?: string; password?: string }
      | null

    const email = body?.email?.trim().toLowerCase()
    const password = body?.password

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // 1) Login contra Supabase Auth using a server-side client (no session persistence)
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

    // 2) Buscar en public.profiles (tabla real vinculada a auth.users)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authUserId)
      .eq('is_active', true)
      .maybeSingle()

    // Si hubo error real (RLS / permisos / etc), lo logueamos
    if (profileError) {
      console.error('Supabase profiles lookup error:', profileError)
    }

    // 2b) Si no existe, lo creamos alineando id = auth.uid() (clave para que RLS funcione)
    let p: ProfileRow | null = (profile as ProfileRow | null) ?? null

    if (!p) {
      const newProfile: ProfileInsert = {
        id: authUserId,
        name: authUser.user_metadata?.name || authEmail.split('@')[0] || 'Usuario',
        role: 'owner',
        clinic_id: null,
        is_active: true,
      }

      const { data: created, error: createErr } = await supabaseAdmin
        .from('profiles')
        .insert(newProfile)
        .select('*')
        .single()

      if (createErr || !created) {
        console.error('Create profile error:', createErr)
        return NextResponse.json(
          { error: 'No se pudo crear el perfil del usuario' },
          { status: 500 }
        )
      }

      p = created as ProfileRow
    }

    // 3) Emitir JWT interno (tu AuthContext)
    const token = await generateToken({
      userId: p.id,
      email: authEmail,
      role: p.role,
      clinicId: p.clinic_id ?? '',
    })

    // 4) Activity log (opcional)
    if (p.clinic_id) {
      await supabaseAdmin.from('activity_logs').insert({
        clinic_id: p.clinic_id,
        user_id: p.id,
        action_type: 'view',
        resource_type: 'user',
        resource_id: p.id,
        description: 'User login',
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent'),
      })
    }

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: p.id,
        email: authEmail,
        name: p.name,
        role: p.role,
        clinic_id: p.clinic_id,
        phone: p.phone,
        is_active: p.is_active,
        avatar_url: p.avatar_url,
        specialty: p.specialty,
        color: p.color,
        created_at: p.created_at,
        updated_at: p.updated_at,
      },
    })
  } catch (error) {
    console.error('Login error:', error)

    // Check if it's a Supabase connection error
    if (error instanceof Error) {
      if (error.message.includes('SUPABASE') || error.message.includes('environment variable')) {
        return NextResponse.json(
          { error: 'Error de conexión con la base de datos. Por favor verifica la configuración del servidor.' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ error: 'Error al iniciar sesión' }, { status: 500 })
  }
}
