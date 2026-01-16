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
  Link2,
  BookOpen,
  Globe,
  Check,
} from 'lucide-react'
import { Header, PageContainer, AppShell } from '@/components/layout'
import { Card, Avatar, Modal, Button } from '@/components/ui'
import { useApp } from '@/contexts/AppContext'
import { useLanguage } from '@/i18n'

interface SettingsItem {
  icon: React.ReactNode
  label: string
  href?: string
  onClick?: () => void
  toggle?: boolean
  value?: boolean
  onToggle?: (value: boolean) => void
  chevron?: boolean
  rightContent?: React.ReactNode
}

interface SettingsGroup {
  title: string
  items: SettingsItem[]
}

// Simple Switch component
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
  const { language, setLanguage, t } = useLanguage()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showLanguageModal, setShowLanguageModal] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('clinic_logged_in')
    router.push('/login')
  }

  const settingsGroups: SettingsGroup[] = [
    {
      title: t.settings.account,
      items: [
        {
          icon: <User className="w-5 h-5 text-slate-500" />,
          label: t.settings.editProfile,
          href: '/settings/profile',
          chevron: true,
        },
        {
          icon: <Lock className="w-5 h-5 text-slate-500" />,
          label: t.settings.changePassword,
          href: '/settings/password',
          chevron: true,
        },
        {
          icon: <Bell className="w-5 h-5 text-slate-500" />,
          label: t.settings.notifications,
          toggle: true,
          value: state.settings.notificationsEnabled,
          onToggle: (value) => updateSettings({ notificationsEnabled: value }),
        },
        {
          icon: <Globe className="w-5 h-5 text-slate-500" />,
          label: t.settings.language,
          onClick: () => setShowLanguageModal(true),
          rightContent: (
            <span className="text-sm text-slate-500">
              {language === 'es' ? '🇪🇸 Español' : '🇺🇸 English'}
            </span>
          ),
          chevron: true,
        },
        {
          icon: <Users className="w-5 h-5 text-slate-500" />,
          label: t.settings.team,
          href: '/settings/team',
          chevron: true,
        },
      ],
    },
    {
      title: t.settings.clinic,
      items: [
        {
          icon: <Building className="w-5 h-5 text-slate-500" />,
          label: t.settings.clinicInfo,
          href: '/settings/clinic',
          chevron: true,
        },
        {
          icon: <ListTree className="w-5 h-5 text-slate-500" />,
          label: t.settings.treatmentsAndPrices,
          href: '/treatments',
          chevron: true,
        },
        {
          icon: <Columns3 className="w-5 h-5 text-slate-500" />,
          label: t.settings.pipelineStages,
          href: '/settings/pipeline',
          chevron: true,
        },
        {
          icon: <Link2 className="w-5 h-5 text-slate-500" />,
          label: t.settings.integrations,
          href: '/settings/integrations',
          chevron: true,
        },
      ],
    },
    {
      title: t.settings.support,
      items: [
        {
          icon: <BookOpen className="w-5 h-5 text-slate-500" />,
          label: t.settings.viewTutorial,
          onClick: () => {
            localStorage.removeItem('clinic_onboarding_completed')
            window.location.reload()
          },
          chevron: true,
        },
        {
          icon: <HelpCircle className="w-5 h-5 text-slate-500" />,
          label: t.settings.helpCenter,
          href: '/help',
          chevron: true,
        },
        {
          icon: <MessageSquare className="w-5 h-5 text-slate-500" />,
          label: t.settings.contactSupport,
          onClick: () => {
            window.open('mailto:soporte@clinic.app', '_blank')
          },
          chevron: true,
        },
        {
          icon: <Star className="w-5 h-5 text-slate-500" />,
          label: t.settings.rateApp,
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
      <Header title={t.settings.title} />

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
                {t.settings.editProfile}
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
                        <div className="flex items-center gap-2">
                          {item.rightContent}
                          {item.toggle ? (
                            <SimpleSwitch
                              checked={item.value || false}
                              onChange={item.onToggle || (() => {})}
                            />
                          ) : item.chevron ? (
                            <ChevronRight className="w-5 h-5 text-slate-300" />
                          ) : null}
                        </div>
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
              <p>{t.settings.version} 1.0.0</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Link href="/privacy" className="hover:text-primary-600">
                  {t.settings.privacy}
                </Link>
                <span>•</span>
                <Link href="/terms" className="hover:text-primary-600">
                  {t.settings.terms}
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
                {t.auth.logout}
              </button>
            </div>
          </div>
        </div>
      </PageContainer>

      {/* Language Selection Modal */}
      <Modal
        isOpen={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        title={t.settings.language}
        size="sm"
      >
        <div className="space-y-2">
          <button
            onClick={() => {
              setLanguage('es')
              setShowLanguageModal(false)
            }}
            className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${
              language === 'es' ? 'bg-primary-50 border-2 border-primary-500' : 'bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇪🇸</span>
              <div className="text-left">
                <p className="font-medium text-slate-800">Español</p>
                <p className="text-sm text-slate-500">Spanish</p>
              </div>
            </div>
            {language === 'es' && (
              <Check className="w-5 h-5 text-primary-500" />
            )}
          </button>

          <button
            onClick={() => {
              setLanguage('en')
              setShowLanguageModal(false)
            }}
            className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${
              language === 'en' ? 'bg-primary-50 border-2 border-primary-500' : 'bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇺🇸</span>
              <div className="text-left">
                <p className="font-medium text-slate-800">English</p>
                <p className="text-sm text-slate-500">Inglés</p>
              </div>
            </div>
            {language === 'en' && (
              <Check className="w-5 h-5 text-primary-500" />
            )}
          </button>
        </div>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title={t.auth.logout}
        size="sm"
      >
        <p className="text-slate-600 mb-6">
          {t.auth.logoutConfirm}
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            fullWidth
            onClick={() => setShowLogoutConfirm(false)}
          >
            {t.common.cancel}
          </Button>
          <Button variant="danger" fullWidth onClick={handleLogout}>
            {t.auth.logout}
          </Button>
        </div>
      </Modal>
    </AppShell>
  )
}
