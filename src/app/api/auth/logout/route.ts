import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(_request: NextRequest) {
  try {
    // Sign out from Supabase Auth
    await supabase.auth.signOut()
    
    return NextResponse.json({
      success: true,
      message: 'Sesión cerrada correctamente',
    })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({
      success: true,
      message: 'Sesión cerrada correctamente',
    })
  }
}
