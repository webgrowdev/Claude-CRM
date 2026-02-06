import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import { generateToken } from '@/lib/auth'
import { Database } from '@/types/database'

type UserRow = Database['public']['Tables']['users']['Row']
type ActivityInsert = Database['public']['Tables']['activity_logs']['Insert']

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null) as { email?: string; password?: string } | null
    const email = body?.email?.trim().toLowerCase()
    const password = body?.password

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Si querés forzar modo real, podés borrar esto.
    // Lo dejo para que no te rompa si no tenés envs.
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase no está configurado. Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.' },
        { status: 500 }
      )
    }

    // 1) Auth real en Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    // 2) Traer "perfil" desde TU tabla real: public.users
    //    Usamos supabaseAdmin para evitar RLS (en server-side es correcto).
    const { data: userRow, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single()

    if (userError || !userRow) {
      return NextResponse.json(
        { error: 'Perfil de usuario no encontrado. Falta registro en la tabla users o está inactivo.' },
        { status: 404 }
      )
    }

    const user = userRow as UserRow

    // 3) Generar JWT propio (compatibilidad con tu AuthContext)
    const token = await generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      clinicId: user.clinic_id ?? '',
    })

    // 4) Respuesta user para frontend
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      clinic_id: user.clinic_id,
      phone: user.phone,
      is_active: user.is_active,
      avatar_url: user.avatar_url,
      specialty: user.specialty,
      color: user.color,
      created_at: user.created_at,
      updated_at: user.updated_at,
    }

    // 5) Log activity (opcional)
    if (user.clinic_id) {
      const ip =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        null

      const activity: ActivityInsert = {
        clinic_id: user.clinic_id,
        user_id: user.id,
        action_type: 'view',
        resource_type: 'user',
        resource_id: user.id,
        ip_address: ip,
        user_agent: request.headers.get('user-agent'),
        changes: null,
      }

      // No rompemos login si falla el log
      await supabaseAdmin.from('activity_logs').insert(activity).catch(() => null)
    }

    return NextResponse.json({
      success: true,
      token,
      user: userResponse,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Error al iniciar sesión' },
      { status: 500 }
    )
  }
}
