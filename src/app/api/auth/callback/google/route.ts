// app/api/auth/callback/google/route.ts
import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  const origin = request.nextUrl.origin
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || origin

  console.log('OAuth callback received:', {
    code: code ? code.substring(0, 20) + '...' : null,
    error,
    errorDescription,
    origin,
    baseUrl,
  })

  // Error devuelto directamente por Google en el authorize
  if (error) {
    console.error('Google OAuth error:', error, errorDescription)
    return NextResponse.redirect(
      `${baseUrl}/settings/integrations?error=google_auth_failed&details=${encodeURIComponent(
        errorDescription || error
      )}`
    )
  }

  if (!code) {
    return NextResponse.redirect(
      `${baseUrl}/settings/integrations?error=no_code`
    )
  }

  try {
    const redirectUri = `${origin}/api/auth/callback/google`

    console.log('Exchanging code for tokens...')
    console.log(
      'Client ID:',
      process.env.GOOGLE_CLIENT_ID
        ? process.env.GOOGLE_CLIENT_ID.substring(0, 20) + '...'
        : 'NOT SET'
    )
    console.log('Redirect URI:', redirectUri)

    // Intercambiar code por tokens
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,         // servidor
        client_secret: process.env.GOOGLE_CLIENT_SECRET!, // servidor
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    const tokenData = await tokenResponse.text()
    console.log('Token response status:', tokenResponse.status)

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokenData)
      return NextResponse.redirect(
        `${baseUrl}/settings/integrations?error=token_exchange_failed&details=${encodeURIComponent(
          tokenData
        )}`
      )
    }

    const tokens = JSON.parse(tokenData)
    console.log('Tokens received, fetching user info...')

    // Obtener datos del usuario
    const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })

    if (!userInfoResponse.ok) {
      const body = await userInfoResponse.text()
      console.error('Failed to get user info:', body)
      return NextResponse.redirect(
        `${baseUrl}/settings/integrations?error=userinfo_failed&details=${encodeURIComponent(
          body
        )}`
      )
    }

    const userInfo = await userInfoResponse.json()
    console.log('User info received:', userInfo.email)

    // HTML que guarda tokens en localStorage y redirige al settings
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Conectando con Google Calendar...</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #f8fafc;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e2e8f0;
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    h1 { color: #1e293b; font-size: 1.25rem; }
    p { color: #64748b; }
    .success { color: #10b981; }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <h1>Conectando con Google Calendar</h1>
    <p>Conectado como: <strong>${userInfo.email}</strong></p>
  </div>
  <script>
    const settings = {
      connected: true,
      email: ${JSON.stringify(userInfo.email)},
      accessToken: ${JSON.stringify(tokens.access_token)},
      refreshToken: ${JSON.stringify(tokens.refresh_token || null)},
      expiresAt: ${JSON.stringify(Date.now() + (tokens.expires_in * 1000))},
      calendarId: 'primary',
      autoCreateMeetLinks: true,
      syncFollowUps: true,
    };

    localStorage.setItem('clinic_google_calendar_settings', JSON.stringify(settings));

    // Pequeña demora para mostrar el mensaje de éxito
    setTimeout(() => {
      window.location.href = '${baseUrl}/settings/integrations?success=google_connected';
    }, 1000);
  </script>
</body>
</html>
`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    })
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(
      `${baseUrl}/settings/integrations?error=callback_failed&details=${encodeURIComponent(
        String(error)
      )}`
    )
  }
}
