import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateToken, hashPassword } from '@/lib/auth'

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

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // For demo purposes, we'll use a default clinic
    // In production, this should create a new clinic or assign to an existing one
    const defaultClinicId = 'c0000000-0000-0000-0000-000000000001'

    // Create user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        name,
        phone,
        role,
        clinic_id: defaultClinicId,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('User creation error:', error)
      return NextResponse.json(
        { error: 'Error al crear el usuario' },
        { status: 500 }
      )
    }

    // Generate JWT token
    const token = await generateToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      clinicId: newUser.clinic_id,
    })

    // Remove password from response
    const { password_hash, ...userWithoutPassword } = newUser

    // Log activity
    await supabase.from('activity_logs').insert({
      clinic_id: newUser.clinic_id,
      user_id: newUser.id,
      action_type: 'create',
      resource_type: 'user',
      resource_id: newUser.id,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    })

    return NextResponse.json({
      success: true,
      token,
      user: userWithoutPassword,
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Error al registrar el usuario' },
      { status: 500 }
    )
  }
}
