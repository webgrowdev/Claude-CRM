export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  return Response.json({
    nodeEnv: process.env.NODE_ENV,
    hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    cwd: process.cwd(),
    pid: process.pid,
    envDebug: process.env.__ENV_DEBUG__ ? JSON.parse(process.env.__ENV_DEBUG__) : null,
  })
}
