import { NextRequest, NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { generateToken, verifyPassword } from '@/lib/auth'

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

    // Production mode: Use Supabase
    // Find user by email
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash)
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    // Generate JWT token
    const token = await generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      clinicId: user.clinic_id,
    })

    // Remove password from response
    const { password_hash, ...userWithoutPassword } = user

    // Log activity
    await supabase.from('activity_logs').insert({
      clinic_id: user.clinic_id,
      user_id: user.id,
      action_type: 'view',
      resource_type: 'user',
      resource_id: user.id,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    })

    return NextResponse.json({
      success: true,
      token,
      user: userWithoutPassword,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Error al iniciar sesión' },
      { status: 500 }
    )
  }
}
