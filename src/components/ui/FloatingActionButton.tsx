'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, X, UserPlus, Calendar, Phone, MessageCircle, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/i18n/LanguageContext'

interface FABAction {
  id: string
  icon: React.ReactNode
  label: string
  onClick: () => void
  color?: string
}

interface FloatingActionButtonProps {
  actions?: FABAction[]
  onMainClick?: () => void
  mainIcon?: React.ReactNode
  position?: 'bottom-right' | 'bottom-center'
  showLabels?: boolean
}

export function FloatingActionButton({
  actions,
  onMainClick,
  mainIcon,
  position = 'bottom-right',
  showLabels = true,
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const fabRef = useRef<HTMLDivElement>(null)
  const { language } = useLanguage()

  // Default actions if none provided
  const defaultActions: FABAction[] = [
    {
      id: 'new-patient',
      icon: <UserPlus className="w-5 h-5" />,
      label: language === 'es' ? 'Nuevo Paciente' : 'New Patient',
      onClick: () => {
        window.location.href = '/pacientes?action=new'
      },
      color: 'bg-primary-500 hover:bg-primary-600',
    },
    {
      id: 'new-appointment',
      icon: <Calendar className="w-5 h-5" />,
      label: language === 'es' ? 'Nueva Cita' : 'New Appointment',
      onClick: () => {
        window.location.href = '/appointments?action=new'
      },
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      id: 'quick-call',
      icon: <Phone className="w-5 h-5" />,
      label: language === 'es' ? 'Llamar' : 'Call',
      onClick: () => {
        window.location.href = '/inbox'
      },
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      id: 'quick-whatsapp',
      icon: <MessageCircle className="w-5 h-5" />,
      label: 'WhatsApp',
      onClick: () => {
        window.location.href = '/inbox'
      },
      color: 'bg-green-500 hover:bg-green-600',
    },
  ]

  const fabActions = actions || defaultActions

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Close on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  const handleMainClick = () => {
    if (onMainClick && !actions) {
      onMainClick()
    } else {
      setIsOpen(!isOpen)
    }
  }

  const positionClasses = {
    'bottom-right': 'right-4 bottom-20 lg:bottom-6',
    'bottom-center': 'left-1/2 -translate-x-1/2 bottom-20 lg:bottom-6',
  }

  return (
    <div
      ref={fabRef}
      className={cn(
        'fixed z-50',
        positionClasses[position]
      )}
    >
      {/* Backdrop when open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Action buttons */}
      <div className={cn(
        'flex flex-col-reverse items-end gap-3 mb-3 transition-all duration-200',
        isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      )}>
        {fabActions.map((action, index) => (
          <button
            key={action.id}
            onClick={() => {
              action.onClick()
              setIsOpen(false)
            }}
            className={cn(
              'flex items-center gap-3 transition-all duration-200',
              isOpen ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
            )}
            style={{
              transitionDelay: isOpen ? `${index * 50}ms` : '0ms',
            }}
          >
            {showLabels && (
              <span className="px-3 py-1.5 bg-white rounded-lg shadow-lg text-sm font-medium text-slate-700 whitespace-nowrap">
                {action.label}
              </span>
            )}
            <div className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110',
              action.color || 'bg-slate-600 hover:bg-slate-700'
            )}>
              {action.icon}
            </div>
          </button>
        ))}
      </div>

      {/* Main FAB button */}
      <button
        onClick={handleMainClick}
        className={cn(
          'w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-200',
          isOpen
            ? 'bg-slate-700 hover:bg-slate-800 rotate-45'
            : 'bg-primary-500 hover:bg-primary-600 hover:scale-105'
        )}
        aria-label={isOpen
          ? (language === 'es' ? 'Cerrar menú' : 'Close menu')
          : (language === 'es' ? 'Abrir menú de acciones' : 'Open action menu')
        }
        aria-expanded={isOpen}
      >
        {mainIcon || (isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />)}
      </button>
    </div>
  )
}

// Preset FAB configurations
export function PatientFAB() {
  const { language } = useLanguage()

  return (
    <FloatingActionButton
      actions={[
        {
          id: 'new-patient',
          icon: <UserPlus className="w-5 h-5" />,
          label: language === 'es' ? 'Nuevo Paciente' : 'New Patient',
          onClick: () => { window.location.href = '/pacientes?action=new' },
          color: 'bg-primary-500 hover:bg-primary-600',
        },
        {
          id: 'new-appointment',
          icon: <Calendar className="w-5 h-5" />,
          label: language === 'es' ? 'Agendar Cita' : 'Schedule Appointment',
          onClick: () => { window.location.href = '/appointments?action=new' },
          color: 'bg-purple-500 hover:bg-purple-600',
        },
      ]}
    />
  )
}

export function InboxFAB() {
  const { language } = useLanguage()

  return (
    <FloatingActionButton
      actions={[
        {
          id: 'new-patient',
          icon: <UserPlus className="w-5 h-5" />,
          label: language === 'es' ? 'Nuevo Paciente' : 'New Patient',
          onClick: () => { window.location.href = '/pacientes?action=new' },
          color: 'bg-primary-500 hover:bg-primary-600',
        },
        {
          id: 'quick-note',
          icon: <FileText className="w-5 h-5" />,
          label: language === 'es' ? 'Nota Rápida' : 'Quick Note',
          onClick: () => { /* Handle quick note */ },
          color: 'bg-amber-500 hover:bg-amber-600',
        },
      ]}
    />
  )
}
