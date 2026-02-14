import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase.server'
import { requireAuth } from '@/lib/middleware'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/notifications - Get notifications for the authenticated user's clinic
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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Query activity_logs table for notifications (recent activity in the clinic)
    const { data: activities, error, count } = await supabaseAdmin
      .from('activity_logs')
      .select('*', { count: 'exact' })
      .eq('clinic_id', user.clinicId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json(
        { error: 'Error al obtener notificaciones' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      notifications: activities || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Notifications GET error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
})
