import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  // Handle errors from Google
  if (error) {
    console.error('Google OAuth error:', error)
    return NextResponse.redirect(
      new URL('/settings/integrations?error=google_auth_failed', request.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/settings/integrations?error=no_code', request.url)
    )
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Token exchange failed:', errorData)
      return NextResponse.redirect(
        new URL('/settings/integrations?error=token_exchange_failed', request.url)
      )
    }

    const tokens = await tokenResponse.json()

    // Get user info
    const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })

    const userInfo = await userInfoResponse.json()

    // Create a response that will store tokens in localStorage via client-side script
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
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <h1>Conectando con Google Calendar</h1>
    <p>Espera un momento...</p>
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

    // Redirect to integrations page with success
    window.location.href = '/settings/integrations?success=google_connected';
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
      new URL('/settings/integrations?error=callback_failed', request.url)
    )
  }
}
