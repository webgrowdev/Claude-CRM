/**
 * Cookie utilities for client-side cookie management
 * Used to store and retrieve authentication tokens
 */

export function setCookie(name: string, value: string, days: number = 7): void {
  if (typeof window === 'undefined') return
  
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  
  // Add Secure flag for production environments (HTTPS only)
  const secure = window.location.protocol === 'https:' ? ';Secure' : ''
  
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax${secure}`
}

export function getCookie(name: string): string | null {
  if (typeof window === 'undefined') return null
  
  const cookie = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${name}=`))
  
  if (!cookie) return null
  
  // Handle cookie values that contain '=' characters (e.g., base64 tokens)
  const parts = cookie.split('=')
  return parts.slice(1).join('=') || null
}

export function deleteCookie(name: string): void {
  if (typeof window === 'undefined') return
  
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`
}
