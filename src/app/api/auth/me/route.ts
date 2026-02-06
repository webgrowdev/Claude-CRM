import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase.server'
import type { Database } from '@/types/database'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type ProfileRow = Database['public']['Tables']['profiles']['Row']

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

    const userId = payload.userId
    const payloadEmail = payload.email

    if (!userId && !payloadEmail) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Query profiles table (the real table linked to auth.users)
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .eq('is_active', true)
      .single()

    if (error || !profile) {
      console.error('Auth /me profile lookup error:', error)
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const p = profile as ProfileRow

    // Get email from Supabase Auth admin API (profiles table doesn't store email)
    let email = payloadEmail || ''
    if (userId) {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId)
      if (authUser?.user?.email) {
        email = authUser.user.email
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: p.id,
        email,
        name: p.name,
        role: p.role,
        clinic_id: p.clinic_id,
        phone: p.phone,
        is_active: p.is_active,
        avatar_url: p.avatar_url,
        specialty: p.specialty,
        color: p.color,
        created_at: p.created_at,
        updated_at: p.updated_at,
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
