export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { readEnvFileKey } from '@/lib/env-reader'

export async function GET() {
  return Response.json({
    nodeEnv: process.env.NODE_ENV,
    hasServiceRoleFallback: !!(process.env.SUPABASE_SERVICE_ROLE_KEY || readEnvFileKey()),
    cwd: process.cwd(),
    pid: process.pid,
    envDebug: process.env.__ENV_DEBUG__ ? JSON.parse(process.env.__ENV_DEBUG__) : null,
  })
}
