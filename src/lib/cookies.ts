/**
 * Cookie utilities for client-side cookie management
 * Used to store and retrieve authentication tokens
 */

export function setCookie(name: string, value: string, days: number = 7): void {
  if (typeof window === 'undefined') return
  
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`
}

export function getCookie(name: string): string | null {
  if (typeof window === 'undefined') return null
  
  const value = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${name}=`))
    ?.split('=')[1]
  
  return value || null
}

export function deleteCookie(name: string): void {
  if (typeof window === 'undefined') return
  
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`
}
