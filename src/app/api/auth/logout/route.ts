import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase.client'
export async function POST() {
  try {
    // Sign out from Supabase Auth
    const { error } = await supabase.auth.signOut()
    
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
