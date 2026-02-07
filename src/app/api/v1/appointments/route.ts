import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase.server'

// POST /api/v1/appointments - Public API to create appointments (API key auth)
export async function POST(request: NextRequest) {
  try {
    // Authenticate by API key
    const apiKey = request.headers.get('X-API-Key') || request.headers.get('x-api-key')
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 })
    }

    // Look up clinic by API key
    const { data: clinic } = await supabaseAdmin
      .from('clinics')
      .select('id')
      .eq('api_key', apiKey)
      .single()

    if (!clinic) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate required fields
    if (!body.patient_id) {
      return NextResponse.json({ error: 'patient_id is required' }, { status: 400 })
    }

    if (!body.scheduled_at) {
      return NextResponse.json({ error: 'scheduled_at is required' }, { status: 400 })
    }

    // Verify the patient exists and belongs to this clinic
    const { data: patient } = await supabaseAdmin
      .from('patients')
      .select('id')
      .eq('id', body.patient_id)
      .eq('clinic_id', clinic.id)
      .single()

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found or does not belong to this clinic' }, { status: 404 })
    }

    // Create appointment
    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .insert({
        clinic_id: clinic.id,
        patient_id: body.patient_id,
        doctor_id: body.doctor_id || null,
        treatment_id: body.treatment_id || null,
        scheduled_at: body.scheduled_at,
        duration: body.duration || 30,
        status: body.status || 'pending',
        treatment_phase: body.treatment_phase || null,
        method: body.method || 'in-person',
        notes: body.notes || null,
        session_number: body.session_number || null,
        total_sessions: body.total_sessions || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating appointment:', error)
      return NextResponse.json({ error: 'Error creating appointment' }, { status: 500 })
    }

    return NextResponse.json({ success: true, appointment }, { status: 201 })
  } catch (error) {
    console.error('V1 Appointments POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/v1/appointments - Public API to list appointments (API key auth)
export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get('X-API-Key') || request.headers.get('x-api-key')
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 })
    }

    const { data: clinic } = await supabaseAdmin
      .from('clinics')
      .select('id')
      .eq('api_key', apiKey)
      .single()

    if (!clinic) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('clinic_id', clinic.id)
      .order('scheduled_at', { ascending: true })
      .limit(limit)

    if (patientId) query = query.eq('patient_id', patientId)
    if (startDate) query = query.gte('scheduled_at', startDate)
    if (endDate) query = query.lte('scheduled_at', endDate)
    if (status && status !== 'all') query = query.eq('status', status)

    const { data: appointments, error } = await query

    if (error) {
      console.error('Error fetching appointments:', error)
      return NextResponse.json({ error: 'Error fetching appointments' }, { status: 500 })
    }

    return NextResponse.json({ success: true, appointments: appointments || [] })
  } catch (error) {
    console.error('V1 Appointments GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
