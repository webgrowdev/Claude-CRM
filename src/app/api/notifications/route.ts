import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase.server'
import { requireAuth } from '@/lib/middleware'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/notifications - List notifications for the authenticated user's clinic
export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    // Verify clinicId exists in token
    if (!user.clinicId) {
      return NextResponse.json({ error: 'No clinic ID found' }, { status: 401 })
    }

    // Check if notifications table exists by attempting to query it
    const { data: notifications, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('clinic_id', user.clinicId)
      .order('created_at', { ascending: false })
      .limit(100)

    // If table doesn't exist, return empty array with success
    if (error) {
      // Check if it's a "relation does not exist" error
      if (error.message?.includes('relation') || error.code === '42P01') {
        return NextResponse.json({
          success: true,
          notifications: [],
          message: 'Notifications table not yet created',
        })
      }
      
      // For other errors, log and return error
      console.error('Error fetching notifications:', error)
      return NextResponse.json(
        { error: 'Error fetching notifications' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      notifications: notifications || [],
    })
  } catch (error) {
    console.error('Notifications GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
