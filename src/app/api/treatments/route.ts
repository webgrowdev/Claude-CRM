import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase.server'
import { requireAuth } from '@/lib/middleware'

// GET /api/treatments - List all treatments
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
    const isActive = searchParams.get('is_active')
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('treatments')
      .select('*', { count: 'exact' })
      .eq('clinic_id', user.clinicId)
      .order('name', { ascending: true })

    // Apply filters
    if (isActive !== null && isActive !== undefined) {
      query = query.eq('is_active', isActive === 'true')
    }

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    // Pagination
    query = query.range(offset, offset + limit - 1)

    const { data: treatments, error, count } = await query

    if (error) {
      console.error('Error fetching treatments:', error)
      return NextResponse.json(
        { error: 'Error al obtener tratamientos' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      treatments: treatments || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Treatments GET error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
})

// POST /api/treatments - Create new treatment
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
    if (!body.name || !body.price || !body.duration) {
      return NextResponse.json(
        { error: 'Nombre, precio y duración son requeridos' },
        { status: 400 }
      )
    }

    // Create treatment
    const { data: treatment, error } = await supabaseAdmin
      .from('treatments')
      .insert({
        clinic_id: user.clinicId,
        name: body.name,
        category: body.category || null,
        price: body.price,
        duration: body.duration,
        in_person_duration: body.in_person_duration || null,
        videocall_duration: body.videocall_duration || null,
        description: body.description || null,
        is_active: body.is_active !== undefined ? body.is_active : true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating treatment:', error)
      return NextResponse.json(
        { error: 'Error al crear tratamiento' },
        { status: 500 }
      )
    }

    // Log activity
    await supabaseAdmin.from('activity_logs').insert({
      clinic_id: user.clinicId,
      user_id: user.userId,
      action_type: 'create',
      resource_type: 'treatment',
      resource_id: treatment.id,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    })

    return NextResponse.json({
      success: true,
      treatment,
    }, { status: 201 })
  } catch (error) {
    console.error('Treatment POST error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
})

// PUT /api/treatments - Update treatment
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
        { error: 'ID de tratamiento requerido' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Update treatment
    const { data: treatment, error } = await supabaseAdmin
      .from('treatments')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('clinic_id', user.clinicId)
      .select()
      .single()

    if (error) {
      console.error('Error updating treatment:', error)
      return NextResponse.json(
        { error: 'Error al actualizar tratamiento' },
        { status: 500 }
      )
    }

    // Log activity
    await supabaseAdmin.from('activity_logs').insert({
      clinic_id: user.clinicId,
      user_id: user.userId,
      action_type: 'update',
      resource_type: 'treatment',
      resource_id: id,
      changes: body,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    })

    return NextResponse.json({
      success: true,
      treatment,
    })
  } catch (error) {
    console.error('Treatment PUT error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
})

// DELETE /api/treatments - Delete treatment
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
        { error: 'ID de tratamiento requerido' },
        { status: 400 }
      )
    }

    // Delete treatment (or soft delete by setting is_active to false)
    const { error } = await supabaseAdmin
      .from('treatments')
      .delete()
      .eq('id', id)
      .eq('clinic_id', user.clinicId)

    if (error) {
      console.error('Error deleting treatment:', error)
      return NextResponse.json(
        { error: 'Error al eliminar tratamiento' },
        { status: 500 }
      )
    }

    // Log activity
    await supabaseAdmin.from('activity_logs').insert({
      clinic_id: user.clinicId,
      user_id: user.userId,
      action_type: 'delete',
      resource_type: 'treatment',
      resource_id: id,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    })

    return NextResponse.json({
      success: true,
      message: 'Tratamiento eliminado correctamente',
    })
  } catch (error) {
    console.error('Treatment DELETE error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
})
