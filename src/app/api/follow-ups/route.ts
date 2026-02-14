import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase.server'
import { requireAuth } from '@/lib/middleware'

// GET /api/follow-ups - List follow-ups
// Reemplaza (o modifica) el handler GET existente por algo como esto (usa requireAuth como ahora)
export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    // Verificar clinicId existe en token
    if (!user.clinicId) {
      return NextResponse.json({ error: 'No clinic ID found' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient_id')

    // If patient_id is provided, validate it
    if (patientId) {
      // Validar formato UUID básico
      const uuidRE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidRE.test(patientId)) {
        return NextResponse.json({ error: 'patient_id must be a valid UUID' }, { status: 400 })
      }

      // Verificar paciente existe y pertenece a la clinic del token
      const { data: patient, error: patientErr } = await supabaseAdmin
        .from('patients')
        .select('id, clinic_id')
        .eq('id', patientId)
        .single()

      if (patientErr) {
        console.error('Error looking up patient for follow-ups:', patientErr)
        return NextResponse.json({ error: 'Error fetching patient' }, { status: 500 })
      }
      if (!patient) {
        return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
      }
      if (patient.clinic_id !== user.clinicId) {
        return NextResponse.json({ error: 'Patient does not belong to this clinic' }, { status: 403 })
      }
    }

    // Ahora lanzar la query original de follow-ups filtrada por clinic y opcionalmente por patient_id
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('follow_ups')
      .select('*', { count: 'exact' })
      .eq('clinic_id', user.clinicId)

    // Only filter by patient_id if provided
    if (patientId) {
      query = query.eq('patient_id', patientId)
    }

    query = query
      .order('scheduled_at', { ascending: true })
      .range(offset, offset + limit - 1)

    const { data: followUps, error, count } = await query

    if (error) {
      console.error('Error fetching follow-ups:', error)
      return NextResponse.json({ error: 'Error al obtener seguimientos' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      followUps: followUps || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Follow-ups GET error (unhandled):', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

// POST /api/follow-ups - Create a follow-up
export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    
    // Verify clinicId exists
    if (!user.clinicId) {
      return NextResponse.json(
        { error: 'No clinic ID found' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validate required fields
    if (!body.patient_id || !body.type || !body.scheduled_at) {
      return NextResponse.json(
        { error: 'patient_id, type y scheduled_at son requeridos' },
        { status: 400 }
      )
    }

    // Create follow-up
    const { data: followUp, error } = await supabaseAdmin
      .from('follow_ups')
      .insert({
        clinic_id: user.clinicId,
        patient_id: body.patient_id,
        type: body.type,
        scheduled_at: body.scheduled_at,
        completed: body.completed || false,
        completed_at: body.completed_at || null,
        notes: body.notes || null,
        duration: body.duration || null,
        treatment_id: body.treatment_id || null,
        treatment_name: body.treatment_name || null,
        assigned_to: body.assigned_to || user.userId,
        google_event_id: body.google_event_id || null,
        meet_link: body.meet_link || null,
        appointment_status: body.appointment_status || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating follow-up:', error)
      return NextResponse.json(
        { error: 'Error al crear seguimiento' },
        { status: 500 }
      )
    }

    // Log activity
    await supabaseAdmin.from('activity_logs').insert({
      clinic_id: user.clinicId,
      user_id: user.userId,
      action_type: 'create',
      resource_type: 'patient',
      resource_id: body.patient_id,
      description: 'Seguimiento creado',
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    })

    return NextResponse.json({
      success: true,
      followUp,
    }, { status: 201 })
  } catch (error) {
    console.error('Follow-up POST error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
})

// PUT /api/follow-ups - Update a follow-up
export const PUT = requireAuth(async (request: NextRequest, user) => {
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
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID de seguimiento requerido' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // If marking as completed, set completed_at
    if (body.completed === true && !body.completed_at) {
      body.completed_at = new Date().toISOString()
    }

    // Update follow-up
    const { data: followUp, error } = await supabaseAdmin
      .from('follow_ups')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('clinic_id', user.clinicId)
      .select()
      .single()

    if (error) {
      console.error('Error updating follow-up:', error)
      return NextResponse.json(
        { error: 'Error al actualizar seguimiento' },
        { status: 500 }
      )
    }

    // Log activity
    await supabaseAdmin.from('activity_logs').insert({
      clinic_id: user.clinicId,
      user_id: user.userId,
      action_type: 'update',
      resource_type: 'patient',
      resource_id: followUp.patient_id,
      description: 'Seguimiento actualizado',
      changes: body,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    })

    return NextResponse.json({
      success: true,
      followUp,
    })
  } catch (error) {
    console.error('Follow-up PUT error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
})

// DELETE /api/follow-ups - Delete a follow-up
export const DELETE = requireAuth(async (request: NextRequest, user) => {
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
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID de seguimiento requerido' },
        { status: 400 }
      )
    }

    // Get the follow-up before deletion for logging
    const { data: followUp } = await supabaseAdmin
      .from('follow_ups')
      .select('patient_id')
      .eq('id', id)
      .eq('clinic_id', user.clinicId)
      .single()

    // Delete follow-up
    const { error } = await supabaseAdmin
      .from('follow_ups')
      .delete()
      .eq('id', id)
      .eq('clinic_id', user.clinicId)

    if (error) {
      console.error('Error deleting follow-up:', error)
      return NextResponse.json(
        { error: 'Error al eliminar seguimiento' },
        { status: 500 }
      )
    }

    // Log activity
    if (followUp) {
      await supabaseAdmin.from('activity_logs').insert({
        clinic_id: user.clinicId,
        user_id: user.userId,
        action_type: 'delete',
        resource_type: 'patient',
        resource_id: followUp.patient_id,
        description: 'Seguimiento eliminado',
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent'),
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Seguimiento eliminado correctamente',
    })
  } catch (error) {
    console.error('Follow-up DELETE error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
})
