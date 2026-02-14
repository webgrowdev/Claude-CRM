'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { User, UserRole } from '@/types'
import { setCookie, getCookie, deleteCookie } from '@/lib/cookies'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string, remember?: boolean) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>
  refreshToken: () => Promise<boolean>
  updateUser: (user: User) => void
}

interface RegisterData {
  email: string
  password: string
  name: string
  phone?: string
  role?: UserRole
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  })

  // Check for existing session on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      // Check both localStorage and cookie for token
      let token = localStorage.getItem('auth_token')
      if (!token) {
        token = getCookie('token')
      }
      const remember = localStorage.getItem('auth_remember') === 'true'

      if (!token) {
        setState(prev => ({ ...prev, isLoading: false }))
        return
      }

      // Verify token with server
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const { user } = await response.json()
        setState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        })
      } else {
        // Token invalid, clear storage and cookies
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        localStorage.removeItem('auth_remember')
        deleteCookie('token')
        setState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        })
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  }

  const login = async (email: string, password: string, remember: boolean = false) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || 'Error al iniciar sesión' }
      }

      // Store token in both localStorage and cookie
      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('auth_user', JSON.stringify(data.user))
      setCookie('token', data.token, remember ? 30 : 7) // 30 days if remember, 7 days otherwise
      if (remember) {
        localStorage.setItem('auth_remember', 'true')
      }

      setState({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
      })

      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Error de conexión' }
    }
  }

  const logout = async () => {
    try {
      // Call logout endpoint (optional server-side signout)
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${state.token}`
        }
      })
    } catch (error) {
      console.error('Logout error:', error)
    }

    // Clear main auth keys from localStorage
    try {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_remember')
    } catch (e) {
      console.warn('Could not remove auth keys from localStorage', e)
    }

    // Remove legacy / alternate keys used in some components
    try {
      localStorage.removeItem('clinic_token')
      localStorage.removeItem('token')
      localStorage.removeItem('clinic_logged_in')
    } catch (e) {
      // ignore if storage access fails
    }

    // Clear auth cookie
    deleteCookie('token')

    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    })

    router.push('/login')
  }

  const register = async (data: RegisterData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        return { success: false, error: result.error || 'Error al registrar' }
      }

      // Auto login after registration - store in both localStorage and cookie
      localStorage.setItem('auth_token', result.token)
      localStorage.setItem('auth_user', JSON.stringify(result.user))
      setCookie('token', result.token, 7) // 7 days by default

      setState({
        user: result.user,
        token: result.token,
        isAuthenticated: true,
        isLoading: false,
      })

      return { success: true }
    } catch (error) {
      console.error('Register error:', error)
      return { success: false, error: 'Error de conexión' }
    }
  }

  const refreshToken = async () => {
    try {
      const response = await fetch('/api/auth/refresh-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${state.token}`
        }
      })

      if (response.ok) {
        const { token, user } = await response.json()
        const remember = localStorage.getItem('auth_remember') === 'true'
        localStorage.setItem('auth_token', token)
        localStorage.setItem('auth_user', JSON.stringify(user))
        setCookie('token', token, remember ? 30 : 7) // Respect original remember preference
        
        setState(prev => ({
          ...prev,
          token,
          user,
        }))
        
        return true
      }
      
      return false
    } catch (error) {
      console.error('Token refresh error:', error)
      return false
    }
  }

  const updateUser = (user: User) => {
    setState(prev => ({ ...prev, user }))
    localStorage.setItem('auth_user', JSON.stringify(user))
  }

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    register,
    refreshToken,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}