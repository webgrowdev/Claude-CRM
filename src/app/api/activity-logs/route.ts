import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase.client'
import { requireAuth } from '@/lib/middleware'

// GET /api/activity-logs - List activity logs
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
    const userId = searchParams.get('user_id')
    const actionType = searchParams.get('action_type')
    const resourceType = searchParams.get('resource_type')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    let query = supabase
      .from('activity_logs')
      .select('*', { count: 'exact' })
      .eq('clinic_id', user.clinicId)
      .order('created_at', { ascending: false })

    // Apply filters
    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (actionType) {
      query = query.eq('action_type', actionType)
    }

    if (resourceType) {
      query = query.eq('resource_type', resourceType)
    }

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    // Pagination
    query = query.range(offset, offset + limit - 1)

    const { data: logs, error, count } = await query

    if (error) {
      console.error('Error fetching activity logs:', error)
      return NextResponse.json(
        { error: 'Error al obtener registros de actividad' },
        { status: 500 }
      )
    }

    // Get user names for logs
    if (logs && logs.length > 0) {
      const userIds = Array.from(new Set(logs.map((log: any) => log.user_id).filter(Boolean)))
      const { data: users } = await supabase
        .from('users')
        .select('id, name')
        .in('id', userIds)

      const userMap = new Map(users?.map((u: any) => [u.id, u.name]))

      // Enrich logs with user names
      logs.forEach((log: any) => {
        if (log.user_id) {
          log.user_name = userMap.get(log.user_id)
        }
      })
    }

    return NextResponse.json({
      success: true,
      logs: logs || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Activity logs GET error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
})

// POST /api/activity-logs - Create activity log (manual)
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
    if (!body.action_type || !body.resource_type) {
      return NextResponse.json(
        { error: 'Tipo de acción y tipo de recurso son requeridos' },
        { status: 400 }
      )
    }

    // Create activity log
    const { data: log, error } = await supabase
      .from('activity_logs')
      .insert({
        clinic_id: user.clinicId,
        user_id: user.userId,
        action_type: body.action_type,
        resource_type: body.resource_type,
        resource_id: body.resource_id,
        changes: body.changes,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent'),
      } as any)
      .select()
      .single()

    if (error) {
      console.error('Error creating activity log:', error)
      return NextResponse.json(
        { error: 'Error al crear registro de actividad' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      log,
    }, { status: 201 })
  } catch (error) {
    console.error('Activity log POST error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
})
