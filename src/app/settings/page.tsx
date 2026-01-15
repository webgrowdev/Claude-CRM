'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  User,
  Lock,
  Bell,
  Users,
  Building,
  ListTree,
  Columns3,
  HelpCircle,
  MessageSquare,
  Star,
  ChevronRight,
  LogOut,
  Moon,
  Sun,
  Link2,
} from 'lucide-react'
import { Header, PageContainer, AppShell } from '@/components/layout'
import { Card, Avatar, Modal, Button, Input } from '@/components/ui'
import { useApp } from '@/contexts/AppContext'

interface SettingsItem {
  icon: React.ReactNode
  label: string
  href?: string
  onClick?: () => void
  toggle?: boolean
  value?: boolean
  onToggle?: (value: boolean) => void
  chevron?: boolean
}

interface SettingsGroup {
  title: string
  items: SettingsItem[]
}

// Simple Switch component inline since we didn't create it earlier
function SimpleSwitch({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-primary-500' : 'bg-slate-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const { state, updateSettings } = useApp()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('clinic_logged_in')
    router.push('/login')
  }

  const settingsGroups: SettingsGroup[] = [
    {
      title: 'Cuenta',
      items: [
        {
          icon: <User className="w-5 h-5 text-slate-500" />,
          label: 'Editar Perfil',
          href: '/settings/profile',
          chevron: true,
        },
        {
          icon: <Lock className="w-5 h-5 text-slate-500" />,
          label: 'Cambiar Contraseña',
          href: '/settings/password',
          chevron: true,
        },
        {
          icon: <Bell className="w-5 h-5 text-slate-500" />,
          label: 'Notificaciones',
          toggle: true,
          value: state.settings.notificationsEnabled,
          onToggle: (value) => updateSettings({ notificationsEnabled: value }),
        },
        {
          icon: <Users className="w-5 h-5 text-slate-500" />,
          label: 'Equipo',
          href: '/settings/team',
          chevron: true,
        },
      ],
    },
    {
      title: 'Clínica',
      items: [
        {
          icon: <Building className="w-5 h-5 text-slate-500" />,
          label: 'Información de la Clínica',
          href: '/settings/clinic',
          chevron: true,
        },
        {
          icon: <ListTree className="w-5 h-5 text-slate-500" />,
          label: 'Tratamientos y Precios',
          href: '/treatments',
          chevron: true,
        },
        {
          icon: <Columns3 className="w-5 h-5 text-slate-500" />,
          label: 'Etapas del Pipeline',
          href: '/settings/pipeline',
          chevron: true,
        },
        {
          icon: <Link2 className="w-5 h-5 text-slate-500" />,
          label: 'Integraciones',
          href: '/settings/integrations',
          chevron: true,
        },
      ],
    },
    {
      title: 'Soporte',
      items: [
        {
          icon: <HelpCircle className="w-5 h-5 text-slate-500" />,
          label: 'Centro de Ayuda',
          href: '/help',
          chevron: true,
        },
        {
          icon: <MessageSquare className="w-5 h-5 text-slate-500" />,
          label: 'Contactar Soporte',
          onClick: () => {
            window.open('mailto:soporte@clinic.app', '_blank')
          },
          chevron: true,
        },
        {
          icon: <Star className="w-5 h-5 text-slate-500" />,
          label: 'Calificar la App',
          onClick: () => {
            // Would open app store
          },
          chevron: true,
        },
      ],
    },
  ]

  return (
    <AppShell>
      <Header title="Ajustes" />

      <PageContainer>
        {/* Desktop: Two column layout */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Profile Card - Sidebar on desktop */}
          <div className="lg:col-span-4">
            <Card className="text-center lg:sticky lg:top-20">
              <Avatar name={state.user.name} size="xl" className="mx-auto" />
              <h2 className="text-lg font-semibold text-slate-800 mt-3">
                {state.user.name}
              </h2>
              <p className="text-sm text-slate-500">{state.user.email}</p>
              <Link
                href="/settings/profile"
                className="inline-block mt-3 text-sm text-primary-600 font-medium hover:underline"
              >
                Editar Perfil
              </Link>
            </Card>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-8">

            {/* Settings Groups */}
            {settingsGroups.map((group) => (
              <div key={group.title} className="mt-6 first:mt-0 lg:first:mt-0">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">
                  {group.title}
                </p>
                <Card padding="none">
                  {group.items.map((item, index) => {
                    const content = (
                      <div
                        className={`flex items-center justify-between p-4 ${
                          index < group.items.length - 1
                            ? 'border-b border-slate-100'
                            : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {item.icon}
                          <span className="text-slate-700">{item.label}</span>
                        </div>
                        {item.toggle ? (
                          <SimpleSwitch
                            checked={item.value || false}
                            onChange={item.onToggle || (() => {})}
                          />
                        ) : item.chevron ? (
                          <ChevronRight className="w-5 h-5 text-slate-300" />
                        ) : null}
                      </div>
                    )

                    if (item.href) {
                      return (
                        <Link
                          key={item.label}
                          href={item.href}
                          className="block hover:bg-slate-50 transition-colors"
                        >
                          {content}
                        </Link>
                      )
                    }

                    if (item.onClick) {
                      return (
                        <button
                          key={item.label}
                          onClick={item.onClick}
                          className="w-full text-left hover:bg-slate-50 transition-colors"
                        >
                          {content}
                        </button>
                      )
                    }

                    return <div key={item.label}>{content}</div>
                  })}
                </Card>
              </div>
            ))}

            {/* App Info */}
            <div className="mt-6 text-center text-sm text-slate-400">
              <p>Versión 1.0.0</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Link href="/privacy" className="hover:text-primary-600">
                  Privacidad
                </Link>
                <span>•</span>
                <Link href="/terms" className="hover:text-primary-600">
                  Términos
                </Link>
              </div>
            </div>

            {/* Logout Button */}
            <div className="mt-6 mb-4">
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full flex items-center justify-center gap-2 p-4 text-error-600 font-medium hover:bg-error-50 rounded-xl transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </PageContainer>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="Cerrar Sesión"
        size="sm"
      >
        <p className="text-slate-600 mb-6">
          ¿Estás seguro de que deseas cerrar sesión?
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            fullWidth
            onClick={() => setShowLogoutConfirm(false)}
          >
            Cancelar
          </Button>
          <Button variant="danger" fullWidth onClick={handleLogout}>
            Cerrar Sesión
          </Button>
        </div>
      </Modal>
    </AppShell>
  )
}
