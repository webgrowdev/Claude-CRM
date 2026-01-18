'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SplashPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Small delay before showing content for smoother appearance
    const contentTimer = setTimeout(() => setShowContent(true), 100)

    // Check if user is logged in (simplified - just check localStorage)
    const navTimer = setTimeout(() => {
      const isLoggedIn = localStorage.getItem('clinic_logged_in')
      if (isLoggedIn === 'true') {
        router.push('/inbox')
      } else {
        router.push('/login')
      }
    }, 2500)

    return () => {
      clearTimeout(contentTimer)
      clearTimeout(navTimer)
    }
  }, [router])

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/20 flex flex-col items-center justify-center overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-100/40 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-100/40 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
      </div>

      {/* Logo Container */}
      <div className={`relative z-10 transition-all duration-700 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
        {/* Main Logo */}
        <div className="animate-logo-scale">
          <h1 className="text-6xl sm:text-7xl font-display font-bold text-slate-800 tracking-tight animate-logo-glow">
            <span className="inline-block animate-text-reveal" style={{ animationDelay: '0.1s' }}>C</span>
            <span className="inline-block animate-text-reveal" style={{ animationDelay: '0.15s' }}>l</span>
            <span className="inline-block animate-text-reveal" style={{ animationDelay: '0.2s' }}>i</span>
            <span className="inline-block animate-text-reveal" style={{ animationDelay: '0.25s' }}>n</span>
            <span className="relative inline-block animate-text-reveal" style={{ animationDelay: '0.3s' }}>
              i
              <span className="absolute -top-1.5 left-1/2 w-3 h-3 bg-gradient-to-br from-primary-400 to-primary-500 rounded-full shadow-lg shadow-primary-400/50 animate-dot-pulse" />
            </span>
            <span className="inline-block animate-text-reveal" style={{ animationDelay: '0.35s' }}>c</span>
          </h1>
        </div>

        {/* Tagline */}
        <p className="text-center text-slate-500 mt-4 font-medium text-lg opacity-0 animate-tagline-slide">
          Turn inquiries into sales
        </p>

        {/* Subtitle badge */}
        <div className="flex justify-center mt-6 opacity-0 animate-tagline-slide" style={{ animationDelay: '0.6s' }}>
          <span className="px-4 py-1.5 bg-white/80 backdrop-blur-sm rounded-full text-xs font-medium text-slate-600 shadow-sm border border-slate-100">
            Clinic CRM Platform
          </span>
        </div>
      </div>

      {/* Loading indicator */}
      <div className={`mt-16 transition-all duration-500 ${showContent ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '0.8s' }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
          <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
        </div>
      </div>

      {/* Version */}
      <p className={`absolute bottom-8 text-xs text-slate-400 transition-opacity duration-500 ${showContent ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '1s' }}>
        v1.0.0
      </p>
    </div>
  )
}
