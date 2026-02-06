import { NextResponse } from 'next/server'
import { createServerAuthClient } from '@/lib/supabase.server'

export async function POST() {
  try {
    // Sign out from Supabase Auth using a server-side client
    const serverAuth = createServerAuthClient()
    const { error } = await serverAuth.auth.signOut()

    if (error) {
      console.error('Logout error:', error)
      return NextResponse.json({
        success: false,
        error: 'Error al cerrar sesión',
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Sesión cerrada correctamente',
    })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al cerrar sesión',
    }, { status: 500 })
  }
}
