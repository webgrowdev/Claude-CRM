import type { Metadata, Viewport } from 'next'
import { AppProvider } from '@/contexts/AppContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { LanguageProvider } from '@/i18n'
import './globals.css'

export const metadata: Metadata = {
  title: 'Clinic CRM - Turn Inquiries Into Sales',
  description: 'Mobile CRM for aesthetic clinics. Organize your leads from Instagram and WhatsApp, schedule follow-ups, and close more sales.',
  keywords: ['CRM', 'clinic', 'aesthetic', 'leads', 'sales', 'instagram', 'whatsapp'],
  authors: [{ name: 'Clinic' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Clinic',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    title: 'Clinic CRM',
    description: 'The mobile CRM that helps aesthetic clinics convert Instagram and WhatsApp inquiries into paying customers.',
    siteName: 'Clinic',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="min-h-screen">
        <LanguageProvider>
          <AuthProvider>
            <AppProvider>
              {children}
            </AppProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
