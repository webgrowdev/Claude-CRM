import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin, createServerAuthClient } from '@/lib/supabase.server'
import { generateToken } from '@/lib/auth'
import type { Database } from '@/types/database'

type ProfileRow = Database['public']['Tables']['profiles']['Row']

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    
    const { email, password, name, phone, role = 'manager' } = await request.json()

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, contraseña y nombre son requeridos' },
        { status: 400 }
      )
    }

    // Use a server-side auth client for sign-up (no session persistence)
    const serverAuth = createServerAuthClient()
    const { data: authData, error: signUpError } = await serverAuth.auth.signUp({
      email: email.toLowerCase(),
      password,
      options: {
        data: {
          name,
          phone,
          role,
        },
      },
    })

    if (signUpError) {
      return NextResponse.json(
        { error: signUpError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Error al crear el usuario' },
        { status: 500 }
      )
    }

    // Check if profile was created by the DB trigger (handle_new_user)
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', authData.user.id)
      .single()

    if (!existingProfile) {
      // Manually create profile if trigger didn't fire
      await supabaseAdmin
        .from('profiles')
        .insert({
          id: authData.user.id,
          clinic_id: null,
          name,
          phone: phone || null,
          role,
          is_active: true,
        })
    }

    // Get the profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Error al obtener el perfil' },
        { status: 500 }
      )
    }

    // Type assertion for profile
    const typedProfile = profile as ProfileRow

    // Generate JWT token
    const token = await generateToken({
      userId: typedProfile.id,
      email: authData.user.email || '',
      role: typedProfile.role,
      clinicId: typedProfile.clinic_id || '',
    })

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
      await supabaseAdmin.from('activity_logs').insert({
        clinic_id: typedProfile.clinic_id,
        user_id: typedProfile.id,
        action_type: 'create',
        resource_type: 'user',
        resource_id: typedProfile.id,
        description: 'User registration',
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
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Error al registrar el usuario' },
      { status: 500 }
    )
  }
}
