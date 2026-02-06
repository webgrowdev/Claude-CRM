import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import { generateToken } from '@/lib/auth'
import type { Database } from '@/types/database'

type UserRow = Database['public']['Tables']['users']['Row']

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

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase no está configurado (falta .env.local)' },
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

    // 2) Buscar perfil real en public.users (tu esquema)
    //    IMPORTANTE: usamos supabaseAdmin para evitar RLS bloqueando la lectura
    const { data: userRow, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single()

    if (userError || !userRow) {
      return NextResponse.json(
        {
          error:
            'Perfil de usuario no encontrado en tabla users. Asegurate de que exista un registro en public.users con el mismo email y is_active=true.',
        },
        { status: 404 }
      )
    }

    const u = userRow as UserRow

    // 3) Emitir tu JWT interno (compatibilidad con tu AuthContext)
    const token = await generateToken({
      userId: u.id,
      email: u.email,
      role: u.role,
      clinicId: u.clinic_id ?? '',
    })

    // 4) Activity log (opcional) - si clinic_id existe
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
