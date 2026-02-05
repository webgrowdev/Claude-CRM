import { NextRequest, NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { generateToken } from '@/lib/auth'
import { Database } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Demo mode: If Supabase is not configured, use demo credentials
    if (!isSupabaseConfigured()) {
      // Demo user
      if (email.toLowerCase() === 'admin@glowclinic.com' && password === 'admin123') {
        const demoUser = {
          id: 'demo-user-id',
          email: 'admin@glowclinic.com',
          name: 'Demo Admin',
          role: 'owner',
          clinic_id: 'demo-clinic-id',
          phone: '+52 55 1234 5678',
          is_active: true,
        }

        const token = await generateToken({
          userId: demoUser.id,
          email: demoUser.email,
          role: demoUser.role,
          clinicId: demoUser.clinic_id,
        })

        return NextResponse.json({
          success: true,
          token,
          user: demoUser,
          demo: true,
        })
      } else {
        return NextResponse.json(
          { error: 'Credenciales inválidas. Usa admin@glowclinic.com / admin123 en modo demo' },
          { status: 401 }
        )
      }
    }

    // Production mode: Use Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password,
    })

    if (authError || !authData.session) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    // Get user profile from profiles table
    type ProfileRow = Database['public']['Tables']['profiles']['Row']
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .eq('is_active', true)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Perfil de usuario no encontrado' },
        { status: 404 }
      )
    }

    // Type assertion for profile
    const typedProfile = profile as ProfileRow

    // Generate JWT token for backwards compatibility with existing AuthContext
    const token = await generateToken({
      userId: typedProfile.id,
      email: authData.user.email || '',
      role: typedProfile.role,
      clinicId: typedProfile.clinic_id || '',
    })

    // Build user object
    const userResponse = {
      id: typedProfile.id,
      email: authData.user.email,
      name: typedProfile.name,
      role: typedProfile.role,
      clinic_id: typedProfile.clinic_id,
      phone: typedProfile.phone,
      is_active: typedProfile.is_active,
      avatar_url: typedProfile.avatar_url,
      specialty: typedProfile.specialty,
      color: typedProfile.color,
      created_at: typedProfile.created_at,
      updated_at: typedProfile.updated_at,
    }

    // Log activity
    if (typedProfile.clinic_id) {
      await supabase.from('activity_logs').insert({
        clinic_id: typedProfile.clinic_id,
        user_id: typedProfile.id,
        action_type: 'view',
        resource_type: 'user',
        resource_id: typedProfile.id,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent'),
      })
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
