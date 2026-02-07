import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase.server'
import { requireAuth } from '@/lib/middleware'

// GET /api/clinic - Get current user's clinic info
export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    if (!user.clinicId) {
      return NextResponse.json({ error: 'No clinic ID found' }, { status: 401 })
    }

    const { data: clinic, error } = await supabaseAdmin
      .from('clinics')
      .select('*')
      .eq('id', user.clinicId)
      .single()

    if (error || !clinic) {
      console.error('Error fetching clinic:', error)
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, clinic })
  } catch (error) {
    console.error('Clinic GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

// PUT /api/clinic - Update current user's clinic info
export const PUT = requireAuth(async (request: NextRequest, user) => {
  try {
    if (!user.clinicId) {
      return NextResponse.json({ error: 'No clinic ID found' }, { status: 401 })
    }

    // Only owners and managers can update clinic info
    if (!['owner', 'manager'].includes(user.role)) {
      return NextResponse.json({ error: 'No permission' }, { status: 403 })
    }

    const body = await request.json()

    const { data: clinic, error } = await supabaseAdmin
      .from('clinics')
      .update({
        name: body.name,
        email: body.email,
        phone: body.phone,
        address: body.address,
        city: body.city,
        state: body.state,
        timezone: body.timezone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.clinicId)
      .select()
      .single()

    if (error) {
      console.error('Error updating clinic:', error)
      return NextResponse.json({ error: 'Error updating clinic' }, { status: 500 })
    }

    // Log activity
    await supabaseAdmin.from('activity_logs').insert({
      clinic_id: user.clinicId,
      user_id: user.userId,
      action_type: 'update',
      resource_type: 'clinic',
      resource_id: user.clinicId,
      changes: body,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    })

    return NextResponse.json({ success: true, clinic })
  } catch (error) {
    console.error('Clinic PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
