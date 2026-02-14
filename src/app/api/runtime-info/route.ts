export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  return Response.json({
    cwd: process.cwd(),
    pid: process.pid,
    argv: process.argv,
    execPath: process.execPath,
    nodeEnv: process.env.NODE_ENV,
  })
}
