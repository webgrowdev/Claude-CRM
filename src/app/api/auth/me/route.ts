import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase.server'
import type { Database } from '@/types/database'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type UserRow = Database['public']['Tables']['users']['Row']

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const token = authHeader.slice(7).trim()
    const payload = await verifyToken(token)

    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Preferimos userId si existe; si no, usamos email
    const userId = (payload as any).userId as string | undefined
    const email = (payload as any).email as string | undefined

    if (!userId && !email) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    let query = supabaseAdmin.from('users').select('*').eq('is_active', true).single()

    if (userId) {
      query = query.eq('id', userId)
    } else {
      query = query.eq('email', email!.toLowerCase())
    }

    const { data: user, error } = await query

    if (error || !user) {
      // Log interno (no lo muestres al usuario)
      console.error('Auth /me user lookup error:', error)
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const u = user as UserRow

    return NextResponse.json({
      success: true,
      user: {
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        clinic_id: u.clinic_id,
        phone: u.phone,
        is_active: u.is_active,
        avatar_url: u.avatar_url,
        specialty: u.specialty,
        color: u.color,
        created_at: u.created_at,
        updated_at: u.updated_at,
      },
    })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { error: 'Error al verificar autenticación' },
      { status: 500 }
    )
  }
}
