import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, generateToken } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const payload = await verifyToken(token)

    if (!payload) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    // Get fresh user profile data
    type ProfileRow = Database['public']['Tables']['profiles']['Row']
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', payload.userId)
      .eq('is_active', true)
      .single()

    if (error || !profile) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    const typedProfile = profile as ProfileRow

    // Get email from Supabase Auth
    const { data: { user: authUser } } = await supabase.auth.getUser()

    // Generate new token
    const newToken = await generateToken({
      userId: typedProfile.id,
      email: authUser?.email || '',
      role: typedProfile.role,
      clinicId: typedProfile.clinic_id || '',
    })

    const userResponse = {
      id: typedProfile.id,
      email: authUser?.email || '',
      name: typedProfile.name,
      role: typedProfile.role,
      clinic_id: typedProfile.clinic_id,
      phone: typedProfile.phone,
      is_active: typedProfile.is_active,
      avatar_url: typedProfile.avatar_url,
      specialty: typedProfile.specialty,
      color: typedProfile.color,
      created_at: typedProfile.created_at,
      updated_at: typedProfile.updated_at,
    }

    return NextResponse.json({
      success: true,
      token: newToken,
      user: userResponse,
    })
  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { error: 'Error al refrescar token' },
      { status: 500 }
    )
  }
}
