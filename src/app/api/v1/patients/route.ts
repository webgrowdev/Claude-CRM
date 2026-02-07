import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase.server'

// POST /api/v1/patients - Public API to create patients (API key auth)
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
    
    if (!body.name || !body.phone) {
      return NextResponse.json({ error: 'name and phone are required' }, { status: 400 })
    }

    // Check for duplicate by phone within this clinic
    const { data: existing } = await supabaseAdmin
      .from('patients')
      .select('id')
      .eq('clinic_id', clinic.id)
      .eq('phone', body.phone)
      .maybeSingle()

    if (existing) {
      // Update existing patient
      const { data: patient, error } = await supabaseAdmin
        .from('patients')
        .update({
          name: body.name,
          email: body.email || null,
          source: body.source || 'other',
          status: body.status || undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating patient:', error)
        return NextResponse.json({ error: 'Error updating patient' }, { status: 500 })
      }

      return NextResponse.json({ success: true, patient, action: 'updated' })
    }

    // Create new patient
    const { data: patient, error } = await supabaseAdmin
      .from('patients')
      .insert({
        clinic_id: clinic.id,
        name: body.name,
        phone: body.phone,
        email: body.email || null,
        source: body.source || 'other',
        status: body.status || 'new',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating patient:', error)
      return NextResponse.json({ error: 'Error creating patient' }, { status: 500 })
    }

    return NextResponse.json({ success: true, patient, action: 'created' }, { status: 201 })
  } catch (error) {
    console.error('V1 Patients POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/v1/patients - Public API to list patients (API key auth)
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
    const search = searchParams.get('search')
    const phone = searchParams.get('phone')
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabaseAdmin
      .from('patients')
      .select('*')
      .eq('clinic_id', clinic.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (phone) query = query.eq('phone', phone)
    if (search) query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)

    const { data: patients, error } = await query

    if (error) {
      console.error('Error fetching patients:', error)
      return NextResponse.json({ error: 'Error fetching patients' }, { status: 500 })
    }

    return NextResponse.json({ success: true, patients: patients || [] })
  } catch (error) {
    console.error('V1 Patients GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
