import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase.server'
import { requireAuth } from '@/lib/middleware'

// GET /api/clinic - Get clinic information
export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    // Verify clinicId exists
    if (!user.clinicId) {
      return NextResponse.json(
        { error: 'No clinic ID found' },
        { status: 401 }
      )
    }

    // Fetch clinic data
    const { data: clinic, error } = await supabaseAdmin
      .from('clinics')
      .select('*')
      .eq('id', user.clinicId)
      .single()

    if (error) {
      console.error('Error fetching clinic:', error)
      return NextResponse.json(
        { error: 'Error al obtener información de la clínica' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      clinic: clinic || {},
    })
  } catch (error) {
    console.error('Clinic GET error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
})

// PUT /api/clinic - Update clinic information
export const PUT = requireAuth(async (request: NextRequest, user) => {
  try {
    // Verify clinicId exists
    if (!user.clinicId) {
      return NextResponse.json(
        { error: 'No clinic ID found' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Prepare update data with proper typing
    interface ClinicUpdateData {
      name?: string
      email?: string
      phone?: string
      address?: string
      city?: string
      state?: string
      country?: string
      timezone?: string
      logo_url?: string
      website?: string
      currency?: string
      updated_at: string
    }
    
    const updateData: ClinicUpdateData = {
      updated_at: new Date().toISOString()
    }
    
    if (body.name !== undefined) updateData.name = body.name
    if (body.email !== undefined) updateData.email = body.email
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.address !== undefined) updateData.address = body.address
    if (body.city !== undefined) updateData.city = body.city
    if (body.state !== undefined) updateData.state = body.state
    if (body.country !== undefined) updateData.country = body.country
    if (body.timezone !== undefined) updateData.timezone = body.timezone
    if (body.logo_url !== undefined) updateData.logo_url = body.logo_url
    if (body.website !== undefined) updateData.website = body.website
    if (body.currency !== undefined) updateData.currency = body.currency

    // Update clinic
    const { data: clinic, error } = await supabaseAdmin
      .from('clinics')
      .update(updateData)
      .eq('id', user.clinicId)
      .select()
      .single()

    if (error) {
      console.error('Error updating clinic:', error)
      return NextResponse.json(
        { error: 'Error al actualizar clínica' },
        { status: 500 }
      )
    }

    // Log activity
    await supabaseAdmin.from('activity_logs').insert({
      clinic_id: user.clinicId,
      user_id: user.userId,
      action_type: 'update',
      resource_type: 'clinic',
      resource_id: user.clinicId,
      changes: updateData,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    })

    return NextResponse.json({
      success: true,
      clinic,
    })
  } catch (error) {
    console.error('Clinic PUT error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
})
