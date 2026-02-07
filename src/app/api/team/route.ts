import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase.server'
import { requireAuth } from '@/lib/middleware'

// GET /api/team - List all team members (all profiles in the clinic)
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
    const active = searchParams.get('active')
    const role = searchParams.get('role')

    let query = supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('clinic_id', user.clinicId)

    if (active !== null && active !== undefined) {
      query = query.eq('is_active', active === 'true')
    }

    if (role) {
      query = query.eq('role', role)
    }

    const { data: profiles, error } = await query

    if (error) {
      console.error('Error fetching team members:', error)
      return NextResponse.json(
        { error: 'Error al obtener miembros del equipo' },
        { status: 500 }
      )
    }

    // Fetch emails from Supabase Auth for each profile
    const teamMembers = await Promise.all(
      (profiles || []).map(async (profile) => {
        let email = ''
        try {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(profile.id)
          if (authUser?.user?.email) {
            email = authUser.user.email
          }
        } catch (err) {
          console.error(`Error fetching email for user ${profile.id}:`, err)
        }
        return {
          ...profile,
          email,
        }
      })
    )

    return NextResponse.json({
      success: true,
      team: teamMembers,
    })
  } catch (error) {
    console.error('Team GET error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
})

// POST /api/team - Create new team member
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
    if (!body.name || !body.email || !body.password || !body.role) {
      return NextResponse.json(
        { error: 'Nombre, email, contraseña y rol son requeridos' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ['owner', 'manager', 'doctor', 'receptionist']
    if (!validRoles.includes(body.role)) {
      return NextResponse.json(
        { error: 'Rol inválido' },
        { status: 400 }
      )
    }

    // Create user in Supabase Auth - it will automatically reject duplicate emails
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email.toLowerCase(),
      password: body.password,
      email_confirm: true,
      user_metadata: {
        name: body.name,
        role: body.role,
      },
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      // Check if error is due to duplicate email
      if (authError.message?.includes('already registered') || authError.message?.includes('User already registered')) {
        return NextResponse.json(
          { error: 'El email ya está registrado' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: 'Error al crear usuario' },
        { status: 500 }
      )
    }

    if (!authData.user) {
      console.error('Error creating auth user:', authError)
      return NextResponse.json(
        { error: 'Error al crear usuario' },
        { status: 500 }
      )
    }

    // Ensure profile exists (trigger should create it, but be safe)
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', authData.user.id)
      .single()

    if (!existingProfile) {
      await supabaseAdmin.from('profiles').insert({
        id: authData.user.id,
        clinic_id: user.clinicId,
        name: body.name,
        phone: body.phone || null,
        role: body.role,
        specialty: body.specialty || null,
        color: body.color || null,
        is_active: true,
      })
    } else {
      // Update existing profile with team member info
      await supabaseAdmin
        .from('profiles')
        .update({
          clinic_id: user.clinicId,
          name: body.name,
          phone: body.phone || null,
          role: body.role,
          specialty: body.specialty || null,
          color: body.color || null,
          is_active: true,
        })
        .eq('id', authData.user.id)
    }

    // Fetch the final profile
    const { data: member, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !member) {
      console.error('Error fetching team member profile:', profileError)
      return NextResponse.json(
        { error: 'Error al crear miembro del equipo' },
        { status: 500 }
      )
    }

    // Log activity
    await supabaseAdmin.from('activity_logs').insert({
      clinic_id: user.clinicId,
      user_id: user.userId,
      action_type: 'create',
      resource_type: 'user',
      resource_id: member.id,
      description: 'Team member created',
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    })

    return NextResponse.json({
      success: true,
      member: {
        ...member,
        email: authData.user.email,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Team POST error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
})

// PUT /api/team/:id - Update team member
export const PUT = requireAuth(async (request: NextRequest, user) => {
  try {
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
        { error: 'ID de miembro requerido' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Prepare update data with proper typing
    interface ProfileUpdateData {
      name?: string
      phone?: string | null
      role?: string
      specialty?: string | null
      color?: string | null
      is_active?: boolean
      updated_at: string
    }
    
    const updateData: ProfileUpdateData = {
      updated_at: new Date().toISOString()
    }
    
    if (body.name !== undefined) updateData.name = body.name
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.role !== undefined) updateData.role = body.role
    if (body.specialty !== undefined) updateData.specialty = body.specialty
    if (body.color !== undefined) updateData.color = body.color
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    // Update profile
    const { data: member, error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .eq('clinic_id', user.clinicId)
      .select()
      .single()

    if (error) {
      console.error('Error updating team member:', error)
      return NextResponse.json(
        { error: 'Error al actualizar miembro' },
        { status: 500 }
      )
    }

    // Log activity
    await supabaseAdmin.from('activity_logs').insert({
      clinic_id: user.clinicId,
      user_id: user.userId,
      action_type: 'update',
      resource_type: 'user',
      resource_id: id,
      changes: updateData,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    })

    return NextResponse.json({
      success: true,
      member,
    })
  } catch (error) {
    console.error('Team PUT error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
})

// DELETE /api/team/:id - Deactivate team member
export const DELETE = requireAuth(async (request: NextRequest, user) => {
  try {
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
        { error: 'ID de miembro requerido' },
        { status: 400 }
      )
    }

    // Soft delete - deactivate instead of deleting
    const { data: member, error } = await supabaseAdmin
      .from('profiles')
      .update({ is_active: false })
      .eq('id', id)
      .eq('clinic_id', user.clinicId)
      .select()
      .single()

    if (error) {
      console.error('Error deactivating team member:', error)
      return NextResponse.json(
        { error: 'Error al desactivar miembro' },
        { status: 500 }
      )
    }

    // Log activity
    await supabaseAdmin.from('activity_logs').insert({
      clinic_id: user.clinicId,
      user_id: user.userId,
      action_type: 'update',
      resource_type: 'user',
      resource_id: id,
      changes: { is_active: false },
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    })

    return NextResponse.json({
      success: true,
      message: 'Miembro desactivado correctamente',
    })
  } catch (error) {
    console.error('Team DELETE error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
})
