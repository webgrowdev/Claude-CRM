'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SplashPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check if user is logged in (simplified - just check localStorage)
    const timer = setTimeout(() => {
      const isLoggedIn = localStorage.getItem('clinic_logged_in')
      if (isLoggedIn === 'true') {
        router.push('/inbox')
      } else {
        router.push('/login')
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [router])

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-primary-50 flex flex-col items-center justify-center">
      {/* Logo */}
      <div className="animate-fade-in">
        <h1 className="text-5xl font-display font-bold text-slate-800 tracking-tight">
          Clin
          <span className="relative">
            i
            <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-secondary-400 rounded-full" />
          </span>
          c
        </h1>
        <p className="text-center text-slate-500 mt-2 font-medium">
          Turn inquiries into sales
        </p>
      </div>

      {/* Loading spinner */}
      <div className="mt-12">
        <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
      </div>

      {/* Version */}
      <p className="absolute bottom-8 text-xs text-slate-400">
        v1.0.0
      </p>
    </div>
  )
}
