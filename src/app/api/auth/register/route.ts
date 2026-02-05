import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateToken } from '@/lib/auth'
import { Database } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, phone, role = 'manager' } = await request.json()

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, contraseña y nombre son requeridos' },
        { status: 400 }
      )
    }

    // Use Supabase Auth to create user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
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

    // Check if we need to manually create profile (if trigger doesn't exist)
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', authData.user.id)
      .single()

    if (!existingProfile) {
      // Manually create profile if trigger didn't do it
      const defaultClinicId = 'c0000000-0000-0000-0000-000000000001'
      
      await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          clinic_id: defaultClinicId,
          name,
          phone,
          role,
          is_active: true,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)
    }

    // Get the profile
    type ProfileRow = Database['public']['Tables']['profiles']['Row']
    const { data: profile, error: profileError } = await supabase
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

    // Generate JWT token for backwards compatibility
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
      await supabase.from('activity_logs').insert({
        clinic_id: typedProfile.clinic_id,
        user_id: typedProfile.id,
        action_type: 'create',
        resource_type: 'user',
        resource_id: typedProfile.id,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent'),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
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
