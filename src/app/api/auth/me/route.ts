import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = await verifyToken(token)

    if (!payload || !payload.email) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    type UserRow = Database['public']['Tables']['users']['Row']

    // ✅ Buscamos en TU tabla real: public.users
    // Usamos supabaseAdmin para evitar RLS en endpoints server-side
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', payload.email.toLowerCase())
      .eq('is_active', true)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const typedUser = user as UserRow

    const userResponse = {
      id: typedUser.id,
      email: typedUser.email,
      name: typedUser.name,
      role: typedUser.role,
      clinic_id: typedUser.clinic_id,
      phone: typedUser.phone,
      is_active: typedUser.is_active,
      avatar_url: typedUser.avatar_url,
      specialty: typedUser.specialty,
      color: typedUser.color,
      created_at: typedUser.created_at,
      updated_at: typedUser.updated_at,
    }

    return NextResponse.json({
      success: true,
      user: userResponse,
    })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { error: 'Error al verificar autenticación' },
      { status: 500 }
    )
  }
}
