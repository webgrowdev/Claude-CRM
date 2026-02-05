'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, isLoading, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login(email, password, rememberMe)
      
      if (result.success) {
        router.push('/dashboard')
      } else {
        setError(result.error || 'Error al iniciar sesión')
      }
    } catch (err) {
      setError('Error de conexión. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col safe-area-top safe-area-bottom">
      {/* Header with logo */}
      <div className="flex-shrink-0 pt-12 pb-8 px-6 text-center">
        <h1 className="text-4xl font-display font-bold text-slate-800 tracking-tight">
          Clin
          <span className="relative">
            i
            <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-secondary-400 rounded-full" />
          </span>
          c
        </h1>
      </div>

      {/* Form */}
      <div className="flex-1 px-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800">Bienvenido</h2>
          <p className="text-slate-500 mt-1">Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            type="email"
            label="Email"
            placeholder="tu@clinica.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="w-5 h-5" />}
            autoComplete="email"
            required
          />

          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              label="Contraseña"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-5 h-5" />}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {error && (
            <p className="text-sm text-error-500 text-center">{error}</p>
          )}

          <div className="flex items-center">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-slate-600">Recuérdame</span>
            </label>
          </div>

          <div className="pt-2">
            <Button type="submit" fullWidth loading={loading}>
              Iniciar Sesión
            </Button>
          </div>

          <button
            type="button"
            className="w-full text-center text-sm text-slate-500 hover:text-primary-600"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </form>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 py-6 px-6 text-center">
        <p className="text-sm text-slate-500">
          ¿No tienes cuenta?{' '}
          <button className="text-primary-600 font-semibold hover:underline">
            Regístrate
          </button>
        </p>
      </div>

      {/* Demo hint */}
      <div className="px-6 pb-6">
        <div className="bg-primary-50 rounded-lg p-3 text-center">
          <p className="text-xs text-primary-700 mb-1">
            <strong>Demo:</strong> Para conectar con base de datos real
          </p>
          <p className="text-xs text-primary-600">
            Configura Supabase en .env.local (ver SETUP_GUIDE.md)
          </p>
        </div>
      </div>
    </div>
  )
}
