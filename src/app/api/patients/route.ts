import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase.server'
import { requireAuth } from '@/lib/middleware'

// GET /api/patients - List all patients
export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    // Verify clinicId exists
    if (!user.clinicId) {
      return NextResponse.json(
        { error: 'No clinic ID found' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const source = searchParams.get('source')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('patients')
      .select('*', { count: 'exact' })
      .eq('clinic_id', user.clinicId)
      .order('created_at', { ascending: false })

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (source && source !== 'all') {
      query = query.eq('source', source)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    // Pagination
    query = query.range(offset, offset + limit - 1)

    const { data: patients, error, count } = await query

    if (error) {
      console.error('Error fetching patients:', error)
      return NextResponse.json(
        { error: 'Error al obtener pacientes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      patients: patients || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Patients GET error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
})

// POST /api/patients - Create new patient
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
    if (!body.name || !body.phone) {
      return NextResponse.json(
        { error: 'Nombre y teléfono son requeridos' },
        { status: 400 }
      )
    }

    // Create patient
    const { data: patient, error } = await supabaseAdmin
      .from('patients')
      .insert({
        ...body,
        clinic_id: user.clinicId,
        assigned_to: body.assigned_to || user.userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating patient:', error)
      return NextResponse.json(
        { error: 'Error al crear paciente' },
        { status: 500 }
      )
    }

    // Log activity
    await supabaseAdmin.from('activity_logs').insert({
      clinic_id: user.clinicId,
      user_id: user.userId,
      action_type: 'create',
      resource_type: 'patient',
      resource_id: patient.id,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    })

    return NextResponse.json({
      success: true,
      patient,
    }, { status: 201 })
  } catch (error) {
    console.error('Patient POST error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
})

// PUT /api/patients/:id - Update patient
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
        { error: 'ID de paciente requerido' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Update patient
    const { data: patient, error } = await supabaseAdmin
      .from('patients')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('clinic_id', user.clinicId)
      .select()
      .single()

    if (error) {
      console.error('Error updating patient:', error)
      return NextResponse.json(
        { error: 'Error al actualizar paciente' },
        { status: 500 }
      )
    }

    // Log activity
    await supabaseAdmin.from('activity_logs').insert({
      clinic_id: user.clinicId,
      user_id: user.userId,
      action_type: 'update',
      resource_type: 'patient',
      resource_id: id,
      changes: body,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    })

    return NextResponse.json({
      success: true,
      patient,
    })
  } catch (error) {
    console.error('Patient PUT error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
})

// DELETE /api/patients/:id - Delete patient
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
        { error: 'ID de paciente requerido' },
        { status: 400 }
      )
    }

    // Delete patient
    const { error } = await supabaseAdmin
      .from('patients')
      .delete()
      .eq('id', id)
      .eq('clinic_id', user.clinicId)

    if (error) {
      console.error('Error deleting patient:', error)
      return NextResponse.json(
        { error: 'Error al eliminar paciente' },
        { status: 500 }
      )
    }

    // Log activity
    await supabaseAdmin.from('activity_logs').insert({
      clinic_id: user.clinicId,
      user_id: user.userId,
      action_type: 'delete',
      resource_type: 'patient',
      resource_id: id,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    })

    return NextResponse.json({
      success: true,
      message: 'Paciente eliminado correctamente',
    })
  } catch (error) {
    console.error('Patient DELETE error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
})
