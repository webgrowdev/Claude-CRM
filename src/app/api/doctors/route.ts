import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAuth } from '@/lib/middleware'
import { hashPassword } from '@/lib/auth'

// GET /api/doctors - List all doctors
export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url)
    const active = searchParams.get('active')

    let query = supabase
      .from('doctors')
      .select(`
        *,
        users:user_id (
          id,
          name,
          email,
          phone,
          avatar_url,
          specialty,
          color
        )
      `)
      .eq('clinic_id', user.clinicId)

    if (active !== null && active !== undefined) {
      query = query.eq('is_active', active === 'true')
    }

    const { data: doctors, error } = await query

    if (error) {
      console.error('Error fetching doctors:', error)
      return NextResponse.json(
        { error: 'Error al obtener doctores' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      doctors: doctors || [],
    })
  } catch (error) {
    console.error('Doctors GET error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
})

// POST /api/doctors - Create new doctor
export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.name || !body.email || !body.password || !body.specialty) {
      return NextResponse.json(
        { error: 'Nombre, email, contraseña y especialidad son requeridos' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', body.email.toLowerCase())
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(body.password)

    // Create user first
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        email: body.email.toLowerCase(),
        password_hash: passwordHash,
        name: body.name,
        phone: body.phone,
        role: 'doctor',
        specialty: body.specialty,
        color: body.color || '#3b82f6',
        clinic_id: user.clinicId,
        is_active: true,
      })
      .select()
      .single()

    if (userError) {
      console.error('Error creating user:', userError)
      return NextResponse.json(
        { error: 'Error al crear usuario' },
        { status: 500 }
      )
    }

    // Create doctor record
    const { data: doctor, error: doctorError } = await supabase
      .from('doctors')
      .insert({
        user_id: newUser.id,
        clinic_id: user.clinicId,
        specialty: body.specialty,
        license_number: body.license_number,
        is_active: true,
        available_hours: body.available_hours || {},
        color: body.color || '#3b82f6',
      })
      .select()
      .single()

    if (doctorError) {
      // Rollback user creation
      await supabase.from('users').delete().eq('id', newUser.id)
      console.error('Error creating doctor:', doctorError)
      return NextResponse.json(
        { error: 'Error al crear doctor' },
        { status: 500 }
      )
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      clinic_id: user.clinicId,
      user_id: user.userId,
      action_type: 'create',
      resource_type: 'user',
      resource_id: newUser.id,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    })

    return NextResponse.json({
      success: true,
      doctor: {
        ...doctor,
        user: newUser,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Doctor POST error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
})

// PUT /api/doctors/:id - Update doctor
export const PUT = requireAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID de doctor requerido' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Update doctor
    const { data: doctor, error } = await supabase
      .from('doctors')
      .update({
        specialty: body.specialty,
        license_number: body.license_number,
        is_active: body.is_active,
        available_hours: body.available_hours,
        color: body.color,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('clinic_id', user.clinicId)
      .select()
      .single()

    if (error) {
      console.error('Error updating doctor:', error)
      return NextResponse.json(
        { error: 'Error al actualizar doctor' },
        { status: 500 }
      )
    }

    // Update user info if provided
    if (body.name || body.phone || body.email) {
      await supabase
        .from('users')
        .update({
          name: body.name,
          phone: body.phone,
          email: body.email,
          specialty: body.specialty,
          color: body.color,
        })
        .eq('id', doctor.user_id)
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      clinic_id: user.clinicId,
      user_id: user.userId,
      action_type: 'update',
      resource_type: 'user',
      resource_id: doctor.user_id,
      changes: body,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    })

    return NextResponse.json({
      success: true,
      doctor,
    })
  } catch (error) {
    console.error('Doctor PUT error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
})

// DELETE /api/doctors/:id - Delete/Deactivate doctor
export const DELETE = requireAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID de doctor requerido' },
        { status: 400 }
      )
    }

    // Instead of deleting, deactivate the doctor
    const { data: doctor, error } = await supabase
      .from('doctors')
      .update({ is_active: false })
      .eq('id', id)
      .eq('clinic_id', user.clinicId)
      .select()
      .single()

    if (error) {
      console.error('Error deactivating doctor:', error)
      return NextResponse.json(
        { error: 'Error al desactivar doctor' },
        { status: 500 }
      )
    }

    // Also deactivate user
    await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', doctor.user_id)

    // Log activity
    await supabase.from('activity_logs').insert({
      clinic_id: user.clinicId,
      user_id: user.userId,
      action_type: 'update',
      resource_type: 'user',
      resource_id: doctor.user_id,
      changes: { is_active: false },
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    })

    return NextResponse.json({
      success: true,
      message: 'Doctor desactivado correctamente',
    })
  } catch (error) {
    console.error('Doctor DELETE error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
})
