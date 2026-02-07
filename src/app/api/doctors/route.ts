import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase.server'
import { requireAuth } from '@/lib/middleware'
import { hashPassword } from '@/lib/auth'

// GET /api/doctors - List all doctors (profiles with role='doctor')
export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    
    // Verify clinicId exists
    if (!user.clinicId) {
      return NextResponse.json(
        { error: 'No clinic ID found' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const active = searchParams.get('active')

    let query = supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('clinic_id', user.clinicId)
      .eq('role', 'doctor')

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
    // Verify clinicId exists
    if (!user.clinicId) {
      return NextResponse.json(
        { error: 'No clinic ID found' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.email || !body.password || !body.specialty) {
      return NextResponse.json(
        { error: 'Nombre, email, contraseña y especialidad son requeridos' },
        { status: 400 }
      )
    }

    // Check if email already exists in Supabase Auth
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const emailExists = existingUsers?.users?.some(
      (u) => u.email?.toLowerCase() === body.email.toLowerCase()
    )

    if (emailExists) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      )
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email.toLowerCase(),
      password: body.password,
      email_confirm: true,
      user_metadata: {
        name: body.name,
        role: 'doctor',
      },
    })

    if (authError || !authData.user) {
      console.error('Error creating auth user:', authError)
      return NextResponse.json(
        { error: 'Error al crear usuario' },
        { status: 500 }
      )
    }

    // Ensure profile exists (trigger should create it, but be safe)
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', authData.user.id)
      .single()

    if (!existingProfile) {
      await supabaseAdmin.from('profiles').insert({
        id: authData.user.id,
        clinic_id: user.clinicId,
        name: body.name,
        phone: body.phone || null,
        role: 'doctor',
        specialty: body.specialty,
        color: body.color || '#3b82f6',
        is_active: true,
      })
    } else {
      // Update existing profile with doctor info
      await supabaseAdmin
        .from('profiles')
        .update({
          clinic_id: user.clinicId,
          name: body.name,
          phone: body.phone || null,
          role: 'doctor',
          specialty: body.specialty,
          color: body.color || '#3b82f6',
          is_active: true,
        })
        .eq('id', authData.user.id)
    }

    // Fetch the final profile
    const { data: doctor, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !doctor) {
      console.error('Error fetching doctor profile:', profileError)
      return NextResponse.json(
        { error: 'Error al crear doctor' },
        { status: 500 }
      )
    }

    // Log activity
    await supabaseAdmin.from('activity_logs').insert({
      clinic_id: user.clinicId,
      user_id: user.userId,
      action_type: 'create',
      resource_type: 'user',
      resource_id: doctor.id,
      description: 'Doctor created',
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    })

    return NextResponse.json({
      success: true,
      doctor: {
        ...doctor,
        email: authData.user.email,
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
    // Verify clinicId exists
    if (!user.clinicId) {
      return NextResponse.json(
        { error: 'No clinic ID found' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID de doctor requerido' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Update profile
    const { data: doctor, error } = await supabaseAdmin
      .from('profiles')
      .update({
        specialty: body.specialty,
        is_active: body.is_active,
        color: body.color,
        name: body.name,
        phone: body.phone,
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

    // Log activity
    await supabaseAdmin.from('activity_logs').insert({
      clinic_id: user.clinicId,
      user_id: user.userId,
      action_type: 'update',
      resource_type: 'user',
      resource_id: id,
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
    // Verify clinicId exists
    if (!user.clinicId) {
      return NextResponse.json(
        { error: 'No clinic ID found' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID de doctor requerido' },
        { status: 400 }
      )
    }

    // Instead of deleting, deactivate the doctor profile
    const { data: doctor, error } = await supabaseAdmin
      .from('profiles')
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

    // Log activity
    await supabaseAdmin.from('activity_logs').insert({
      clinic_id: user.clinicId,
      user_id: user.userId,
      action_type: 'update',
      resource_type: 'user',
      resource_id: id,
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
