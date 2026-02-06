import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase.server'
import { requireAuth } from '@/lib/middleware'

// GET - List appointments with filters
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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const patientId = searchParams.get('patientId')
    const doctorId = searchParams.get('doctorId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('appointments')
      .select(`
        *,
        patient:patients!inner(id, name, phone, email),
        doctor:profiles!appointments_doctor_id_fkey(id, name, specialty, color),
        treatment:treatments(id, name, duration, price)
      `, { count: 'exact' })
      .eq('clinic_id', user.clinicId)
      .order('scheduled_at', { ascending: true })

    // Apply filters
    if (startDate) {
      query = query.gte('scheduled_at', startDate)
    }

    if (endDate) {
      query = query.lte('scheduled_at', endDate)
    }

    if (patientId) {
      query = query.eq('patient_id', patientId)
    }

    if (doctorId) {
      query = query.eq('doctor_id', doctorId)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Pagination
    query = query.range(offset, offset + limit - 1)

    const { data: appointments, error, count } = await query

    if (error) {
      console.error('Error fetching appointments:', error)
      return NextResponse.json(
        { error: 'Error al obtener citas' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      appointments: appointments || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Appointments GET error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
})

// POST - Create a new appointment
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
    if (!body.patient_id && !body.patientId) {
      return NextResponse.json(
        { error: 'patient_id es requerido' },
        { status: 400 }
      )
    }

    if (!body.scheduled_at && !body.scheduledAt) {
      return NextResponse.json(
        { error: 'scheduled_at es requerido' },
        { status: 400 }
      )
    }

    // Normalize field names (support both snake_case and camelCase)
    const appointmentData = {
      clinic_id: user.clinicId,
      patient_id: body.patient_id || body.patientId,
      doctor_id: body.doctor_id || body.doctorId || null,
      treatment_id: body.treatment_id || body.treatmentId || null,
      scheduled_at: body.scheduled_at || body.scheduledAt,
      duration: body.duration || 30,
      status: body.status || 'pending',
      treatment_phase: body.treatment_phase || body.treatmentPhase || null,
      method: body.method || 'in-person',
      notes: body.notes || null,
      google_event_id: body.google_event_id || body.googleEventId || null,
      meet_link: body.meet_link || body.meetLink || null,
      session_number: body.session_number || body.sessionNumber || null,
      total_sessions: body.total_sessions || body.totalSessions || null,
    }

    // Create appointment
    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .insert(appointmentData)
      .select(`
        *,
        patient:patients(id, name, phone, email),
        doctor:profiles!appointments_doctor_id_fkey(id, name, specialty, color),
        treatment:treatments(id, name, duration, price)
      `)
      .single()

    if (error) {
      console.error('Error creating appointment:', error)
      return NextResponse.json(
        { error: 'Error al crear cita' },
        { status: 500 }
      )
    }

    // Log activity
    await supabaseAdmin.from('activity_logs').insert({
      clinic_id: user.clinicId,
      user_id: user.userId,
      action_type: 'create',
      resource_type: 'appointment',
      resource_id: appointment.id,
      description: 'Cita creada',
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    })

    return NextResponse.json({
      success: true,
      appointment,
    }, { status: 201 })
  } catch (error) {
    console.error('Appointment POST error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
})

// PUT - Update appointment
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
        { error: 'ID de cita requerido' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Prepare update data (normalize field names)
    const updateData: any = {}
    
    if (body.doctor_id !== undefined || body.doctorId !== undefined) {
      updateData.doctor_id = body.doctor_id || body.doctorId
    }
    if (body.treatment_id !== undefined || body.treatmentId !== undefined) {
      updateData.treatment_id = body.treatment_id || body.treatmentId
    }
    if (body.scheduled_at !== undefined || body.scheduledAt !== undefined) {
      updateData.scheduled_at = body.scheduled_at || body.scheduledAt
    }
    if (body.duration !== undefined) {
      updateData.duration = body.duration
    }
    if (body.status !== undefined) {
      updateData.status = body.status
      // Auto-set completed_at or confirmed_at based on status
      if (body.status === 'completed') {
        updateData.completed_at = new Date().toISOString()
      } else if (body.status === 'confirmed') {
        updateData.confirmed_at = new Date().toISOString()
      }
    }
    if (body.treatment_phase !== undefined || body.treatmentPhase !== undefined) {
      updateData.treatment_phase = body.treatment_phase || body.treatmentPhase
    }
    if (body.notes !== undefined) {
      updateData.notes = body.notes
    }
    if (body.outcome_result !== undefined || body.outcomeResult !== undefined) {
      updateData.outcome_result = body.outcome_result || body.outcomeResult
    }
    if (body.outcome_description !== undefined || body.outcomeDescription !== undefined) {
      updateData.outcome_description = body.outcome_description || body.outcomeDescription
    }
    if (body.next_steps !== undefined || body.nextSteps !== undefined) {
      updateData.next_steps = body.next_steps || body.nextSteps
    }

    // Update appointment
    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .eq('clinic_id', user.clinicId)
      .select(`
        *,
        patient:patients(id, name, phone, email),
        doctor:profiles!appointments_doctor_id_fkey(id, name, specialty, color),
        treatment:treatments(id, name, duration, price)
      `)
      .single()

    if (error) {
      console.error('Error updating appointment:', error)
      return NextResponse.json(
        { error: 'Error al actualizar cita' },
        { status: 500 }
      )
    }

    // Log activity
    await supabaseAdmin.from('activity_logs').insert({
      clinic_id: user.clinicId,
      user_id: user.userId,
      action_type: 'update',
      resource_type: 'appointment',
      resource_id: id,
      changes: updateData,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    })

    return NextResponse.json({
      success: true,
      appointment,
    })
  } catch (error) {
    console.error('Appointment PUT error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
})

// DELETE - Delete/Cancel appointment
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
    const id = searchParams.get('id') || searchParams.get('appointmentId')

    if (!id) {
      return NextResponse.json(
        { error: 'ID de cita requerido' },
        { status: 400 }
      )
    }

    // Soft delete - mark as cancelled instead of deleting
    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('clinic_id', user.clinicId)
      .select()
      .single()

    if (error) {
      console.error('Error cancelling appointment:', error)
      return NextResponse.json(
        { error: 'Error al cancelar cita' },
        { status: 500 }
      )
    }

    // Log activity
    await supabaseAdmin.from('activity_logs').insert({
      clinic_id: user.clinicId,
      user_id: user.userId,
      action_type: 'update',
      resource_type: 'appointment',
      resource_id: id,
      changes: { status: 'cancelled' },
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    })

    return NextResponse.json({
      success: true,
      message: 'Cita cancelada correctamente',
      appointment,
    })
  } catch (error) {
    console.error('Appointment DELETE error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
})
