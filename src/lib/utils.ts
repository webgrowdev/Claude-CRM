import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isToday, isYesterday, isTomorrow } from 'date-fns'
import { es } from 'date-fns/locale'
import { LeadStatus, LeadSource } from '@/types'

// Merge Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date relative to now
export function formatRelativeDate(date: Date): string {
  if (isToday(date)) {
    return `Hoy, ${format(date, 'HH:mm')}`
  }
  if (isYesterday(date)) {
    return `Ayer, ${format(date, 'HH:mm')}`
  }
  if (isTomorrow(date)) {
    return `Mañana, ${format(date, 'HH:mm')}`
  }
  return format(date, 'dd MMM, HH:mm', { locale: es })
}

// Format date distance (e.g., "hace 2 horas")
export function formatTimeAgo(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true, locale: es })
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount)
}

// Format percentage
export function formatPercentage(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

// Get status display name
export function getStatusLabel(status: LeadStatus): string {
  const labels: Record<LeadStatus, string> = {
    new: 'Nuevo',
    contacted: 'Contactado',
    scheduled: 'Agendado',
    closed: 'Cerrado',
    lost: 'Perdido',
  }
  return labels[status]
}

// Get status color
export function getStatusColor(status: LeadStatus): string {
  const colors: Record<LeadStatus, string> = {
    new: 'bg-primary-100 text-primary-700',
    contacted: 'bg-warning-100 text-warning-700',
    scheduled: 'bg-purple-100 text-purple-700',
    closed: 'bg-success-100 text-success-700',
    lost: 'bg-error-100 text-error-700',
  }
  return colors[status]
}

// Get status dot color
export function getStatusDotColor(status: LeadStatus): string {
  const colors: Record<LeadStatus, string> = {
    new: 'bg-primary-500',
    contacted: 'bg-warning-500',
    scheduled: 'bg-purple-500',
    closed: 'bg-success-500',
    lost: 'bg-error-500',
  }
  return colors[status]
}

// Get source display name
export function getSourceLabel(source: LeadSource): string {
  const labels: Record<LeadSource, string> = {
    instagram: 'Instagram',
    whatsapp: 'WhatsApp',
    phone: 'Teléfono',
    website: 'Sitio Web',
    referral: 'Referido',
    other: 'Otro',
  }
  return labels[source]
}

// Get source icon name (for Lucide icons)
export function getSourceIcon(source: LeadSource): string {
  const icons: Record<LeadSource, string> = {
    instagram: 'instagram',
    whatsapp: 'message-circle',
    phone: 'phone',
    website: 'globe',
    referral: 'users',
    other: 'help-circle',
  }
  return icons[source]
}

// Generate initials from name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Generate WhatsApp URL
export function getWhatsAppUrl(phone: string, message?: string): string {
  const cleanPhone = phone.replace(/\D/g, '')
  const url = `https://wa.me/${cleanPhone}`
  if (message) {
    return `${url}?text=${encodeURIComponent(message)}`
  }
  return url
}

// Generate phone call URL
export function getPhoneUrl(phone: string): string {
  return `tel:${phone.replace(/\D/g, '')}`
}

// Generate email URL
export function getEmailUrl(email: string, subject?: string): string {
  let url = `mailto:${email}`
  if (subject) {
    url += `?subject=${encodeURIComponent(subject)}`
  }
  return url
}

// Calculate conversion rate
export function calculateConversionRate(closed: number, total: number): number {
  if (total === 0) return 0
  return (closed / total) * 100
}

// Get greeting based on time of day
export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Generate unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

// Validate phone number (basic)
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length >= 10 && cleaned.length <= 15
}

// Validate email (basic)
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

// Truncate text
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

// Sort leads by date
export function sortLeadsByDate(leads: { createdAt: Date }[], order: 'asc' | 'desc' = 'desc') {
  return [...leads].sort((a, b) => {
    const comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    return order === 'desc' ? -comparison : comparison
  })
}
