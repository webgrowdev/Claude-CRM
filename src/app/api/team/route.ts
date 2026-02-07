import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase.server'
import { requireAuth } from '@/lib/middleware'

// GET /api/team - List all team members for the clinic
export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    if (!user.clinicId) {
      return NextResponse.json({ error: 'No clinic ID found' }, { status: 401 })
    }

    const { data: members, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('clinic_id', user.clinicId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching team:', error)
      return NextResponse.json({ error: 'Error fetching team' }, { status: 500 })
    }

    return NextResponse.json({ success: true, members: members || [] })
  } catch (error) {
    console.error('Team GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
