import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase.server'
import { requireAuth } from '@/lib/middleware'

// GET /api/notes - List notes for a patient
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
    const patientId = searchParams.get('patient_id')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('patient_notes')
      .select('*', { count: 'exact' })
      .eq('clinic_id', user.clinicId)
      .order('created_at', { ascending: false })

    // Filter by patient if provided
    if (patientId) {
      query = query.eq('patient_id', patientId)
    }

    // Pagination
    query = query.range(offset, offset + limit - 1)

    const { data: notes, error, count } = await query

    if (error) {
      console.error('Error fetching notes:', error)
      return NextResponse.json(
        { error: 'Error al obtener notas' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      notes: notes || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Notes GET error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
})

// POST /api/notes - Create a note
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
    if (!body.patient_id || !body.content) {
      return NextResponse.json(
        { error: 'patient_id y content son requeridos' },
        { status: 400 }
      )
    }

    // Create note
    const { data: note, error } = await supabaseAdmin
      .from('patient_notes')
      .insert({
        clinic_id: user.clinicId,
        patient_id: body.patient_id,
        content: body.content,
        created_by: user.userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating note:', error)
      return NextResponse.json(
        { error: 'Error al crear nota' },
        { status: 500 }
      )
    }

    // Log activity
    await supabaseAdmin.from('activity_logs').insert({
      clinic_id: user.clinicId,
      user_id: user.userId,
      action_type: 'create',
      resource_type: 'patient',
      resource_id: body.patient_id,
      description: 'Nota agregada',
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    })

    return NextResponse.json({
      success: true,
      note,
    }, { status: 201 })
  } catch (error) {
    console.error('Note POST error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
})

// DELETE /api/notes - Delete a note
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
        { error: 'ID de nota requerido' },
        { status: 400 }
      )
    }

    // Get the note before deletion for logging
    const { data: note } = await supabaseAdmin
      .from('patient_notes')
      .select('patient_id')
      .eq('id', id)
      .eq('clinic_id', user.clinicId)
      .single()

    // Delete note
    const { error } = await supabaseAdmin
      .from('patient_notes')
      .delete()
      .eq('id', id)
      .eq('clinic_id', user.clinicId)

    if (error) {
      console.error('Error deleting note:', error)
      return NextResponse.json(
        { error: 'Error al eliminar nota' },
        { status: 500 }
      )
    }

    // Log activity
    if (note) {
      await supabaseAdmin.from('activity_logs').insert({
        clinic_id: user.clinicId,
        user_id: user.userId,
        action_type: 'delete',
        resource_type: 'patient',
        resource_id: note.patient_id,
        description: 'Nota eliminada',
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent'),
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Nota eliminada correctamente',
    })
  } catch (error) {
    console.error('Note DELETE error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
})
