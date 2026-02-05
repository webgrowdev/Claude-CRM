import { NextRequest } from 'next/server'
import { verifyToken, JWTPayload } from './auth'

export async function authenticateRequest(request: NextRequest): Promise<{ 
  authenticated: boolean
  user?: JWTPayload
  error?: string 
}> {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authenticated: false, error: 'No authorization header' }
    }

    const token = authHeader.substring(7)
    const payload = await verifyToken(token)

    if (!payload) {
      return { authenticated: false, error: 'Invalid token' }
    }

    return { authenticated: true, user: payload }
  } catch (error) {
    console.error('Authentication error:', error)
    return { authenticated: false, error: 'Authentication failed' }
  }
}

export function requireAuth(handler: (request: NextRequest, user: JWTPayload) => Promise<Response>) {
  return async (request: NextRequest) => {
    const auth = await authenticateRequest(request)
    
    if (!auth.authenticated || !auth.user) {
      return new Response(
        JSON.stringify({ error: auth.error || 'No autorizado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return handler(request, auth.user)
  }
}

export function requireRole(roles: string[]) {
  return function(handler: (request: NextRequest, user: JWTPayload) => Promise<Response>) {
    return requireAuth(async (request: NextRequest, user: JWTPayload) => {
      if (!roles.includes(user.role)) {
        return new Response(
          JSON.stringify({ error: 'No tienes permisos para realizar esta acción' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      }

      return handler(request, user)
    })
  }
}
