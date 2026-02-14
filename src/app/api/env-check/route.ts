export const runtime = 'nodejs'
import fs from 'fs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

function readEnvFileKey(): string | undefined {
  try {
    const txt = fs.readFileSync('/home/u246625160/domains/growicrm.site/env', 'utf8')
    const line = txt.split('\n').find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY='))
    return line?.split('=').slice(1).join('=').trim()
  } catch {
    return undefined
  }
}

export async function GET() {
  return Response.json({
    nodeEnv: process.env.NODE_ENV,
    hasServiceRoleFallback: !!(process.env.SUPABASE_SERVICE_ROLE_KEY || readEnvFileKey()),
    cwd: process.cwd(),
    pid: process.pid,
    envDebug: process.env.__ENV_DEBUG__ ? JSON.parse(process.env.__ENV_DEBUG__) : null,
  })
}
