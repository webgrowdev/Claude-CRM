import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase.client'
import { supabaseAdmin } from '@/lib/supabase.server'

import { generateToken } from '@/lib/auth'
import type { Database } from '@/types/database'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type UserRow = Database['public']['Tables']['users']['Row']
type UserInsert = Database['public']['Tables']['users']['Insert']

export async function POST(request: NextRequest) {
  try {
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


    // ⚠️ Si esto falta, supabaseAdmin NO bypass RLS (y tu lookup puede "no encontrar" nada)
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        {
          error:
            'Falta SUPABASE_SERVICE_ROLE_KEY en el servidor. Sin esto, supabaseAdmin no puede bypass RLS.',
        },
        { status: 500 }
      )
    }

    // 1) Login contra Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    const authUser = authData.user
    const authEmail = (authUser.email || email).toLowerCase()
    const authUserId = authUser.id

    // 2) Buscar en public.users (tabla real)
    const { data: userRow, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', authEmail)
      .eq('is_active', true)
      .maybeSingle()

    // Si hubo error real (RLS / permisos / etc), lo logueamos
    if (userError) {
      console.error('Supabase users lookup error:', userError)
    }

    // 2b) Si no existe, lo creamos alineando id = auth.uid() (clave para que RLS funcione)
    let u: UserRow | null = (userRow as UserRow | null) ?? null

    if (!u) {
      const newUser: UserInsert = {
        id: authUserId,              // ✅ IMPORTANTE: alinear con auth.uid()
        email: authEmail,
        password_hash: 'supabase_auth', // placeholder (no lo usás si auth es Supabase)
        name: authUser.user_metadata?.name || authEmail.split('@')[0] || 'Usuario',
        role: 'owner',
        clinic_id: null,
        is_active: true,
        avatar_url: null,
        specialty: null,
        color: null,
      }

      const { data: created, error: createErr } = await supabaseAdmin
        .from('users')
        .insert(newUser)
        .select('*')
        .single()

      if (createErr || !created) {
        console.error('Create user row error:', createErr)
        return NextResponse.json(
          { error: 'No se pudo crear el perfil en users' },
          { status: 500 }
        )
      }

      u = created as UserRow
    }

    // 3) Emitir JWT interno (tu AuthContext)
    const token = await generateToken({
      userId: u.id,
      email: u.email,
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
        email: u.email,
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
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Error al iniciar sesión' }, { status: 500 })
  }
}
