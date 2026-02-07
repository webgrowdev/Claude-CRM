export const runtime = 'nodejs' // importante para que no intente correr en edge

export async function GET() {
  return Response.json({
    nodeEnv: process.env.NODE_ENV,
    // Public (se “hornean” en build, pero acá igual vemos si están en runtime)
    hasPublicSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasPublicAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasPublicAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,

    // Server-only
    hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasJwt: !!process.env.JWT_SECRET,

    // ayuda a ver si está corriendo el deploy correcto
    cwd: process.cwd(),
  })
}
