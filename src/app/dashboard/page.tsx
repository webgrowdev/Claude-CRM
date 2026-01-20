'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import {
  UserRound,
  Bell,
  CheckCircle,
  TrendingUp,
  ChevronRight,
  Phone,
  MessageCircle,
  Calendar,
  Instagram,
  Video,
  AlertTriangle,
  Clock,
  Flame,
  UserPlus,
  CalendarCheck,
  DollarSign,
  ArrowRight,
  Sparkles,
  LucideIcon,
  Target,
  Zap,
  Inbox,
  Users,
  LayoutDashboard,
} from 'lucide-react'
import { Header, PageContainer, AppShell } from '@/components/layout'
import { Card, Avatar, Badge, LeadScoreBadge } from '@/components/ui'
import { useApp } from '@/contexts/AppContext'
import { useLanguage } from '@/i18n/LanguageContext'
import {
  formatTimeAgo,
  formatRelativeDate,
  getStatusLabel,
  formatCurrency,
  getWhatsAppUrl,
  getPhoneUrl,
  cn,
} from '@/lib/utils'
import { calculateLeadScore } from '@/services/leadScoring'
import { Lead } from '@/types'

// ====== Colores para las cards de stats ======
const colorClasses = {
  primary: { bg: 'bg-primary-100', text: 'text-primary-600' },
  secondary: { bg: 'bg-secondary-100', text: 'text-secondary-600' },
  success: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
  warning: { bg: 'bg-amber-100', text: 'text-amber-600' },
} as const

type ColorKey = keyof typeof colorClasses

type StatCard = {
  label: string
  value: string
  subtitle?: string
  change: string
  colorKey: ColorKey
  icon: LucideIcon
  href: string
}

export default function DashboardPage() {
  const { state, getRecentLeads, getUpcomingFollowUps } = useApp()
  const { t, language } = useLanguage()
  const getFollowUpTypeLabel = (type: string) => {
    const key = `type${type.charAt(0).toUpperCase()}${type.slice(1)}`
    const dict = t.followUp as Record<string, string>
    return dict[key] ?? type
  }

  const recentLeads = useMemo(() => getRecentLeads(4), [getRecentLeads])
  const upcomingFollowUps = useMemo(
    () => getUpcomingFollowUps().slice(0, 3),
    [getUpcomingFollowUps]
  )

  // ====== Stats numéricos crudos ======
  const statsData = useMemo(() => {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const newLeads = state.leads.filter((l) => l.status === 'new').length
    const followUpsDue = upcomingFollowUps.filter(
      (f) => new Date(f.followUp.scheduledAt) <= now
    ).length
    const closedThisWeek = state.leads.filter(
      (l) =>
        l.status === 'closed' &&
        l.closedAt &&
        new Date(l.closedAt) >= weekAgo
    ).length
    const totalLeads = state.leads.length
    const closedTotal = state.leads.filter((l) => l.status === 'closed').length
    const conversionRate =
      totalLeads > 0 ? Math.round((closedTotal / totalLeads) * 100) : 0

    // Turnos / citas de HOY
    const todayAppointments = state.leads.reduce((count, lead) => {
      const todayFollowUps = lead.followUps.filter((fu) => {
        const fuDate = new Date(fu.scheduledAt)
        return (
          fuDate >= today &&
          fuDate < new Date(today.getTime() + 24 * 60 * 60 * 1000) &&
          (fu.type === 'meeting' || fu.type === 'appointment')
        )
      })
      return count + todayFollowUps.length
    }, 0)

    return { newLeads, followUpsDue, closedThisWeek, conversionRate, todayAppointments }
  }, [state.leads, upcomingFollowUps])

  // ====== Cards de stats que se muestran arriba ======
  const statsCards: StatCard[] = [
    {
      label: language === 'es' ? 'Leads nuevos' : 'New leads',
      value: String(statsData.newLeads),
      subtitle: language === 'es' ? 'Hoy' : 'Today',
      change:
        language === 'es'
          ? 'Leads que entraron hoy'
          : 'Leads that came in today',
      colorKey: 'primary',
      icon: Inbox,
      href: '/leads?filter=new',
    },
    {
      label: language === 'es' ? 'Seguimientos' : 'Follow-ups',
      value: String(statsData.followUpsDue),
      subtitle:
        statsData.followUpsDue > 0
          ? language === 'es'
            ? 'Pendientes'
            : 'Pending'
          : language === 'es'
            ? 'Al día'
            : 'Up to date',
      change:
        statsData.followUpsDue > 0
          ? language === 'es'
            ? 'Requieren acción hoy'
            : 'Need action today'
          : language === 'es'
            ? 'Nada pendiente por ahora'
            : 'Nothing pending for now',
      colorKey: statsData.followUpsDue > 0 ? 'warning' : 'success',
      icon: Bell,
      href: '/calendar',
    },
    {
      label: language === 'es' ? 'Cerrados esta semana' : 'Closed this week',
      value: String(statsData.closedThisWeek),
      subtitle:
        language === 'es' ? 'Últimos 7 días' : 'Last 7 days',
      change:
        language === 'es'
          ? 'Ventas cerradas recientemente'
          : 'Recently closed deals',
      colorKey: 'success',
      icon: CheckCircle,
      href: '/reports',
    },
    {
      label: language === 'es' ? 'Tasa de cierre' : 'Close rate',
      value: `${statsData.conversionRate}%`,
      subtitle:
        language === 'es' ? 'Sobre todos los leads' : 'Of all leads',
      change:
        language === 'es'
          ? 'Conversión general'
          : 'Overall conversion',
      colorKey: 'secondary',
      icon: LayoutDashboard,
      href: '/reports',
    },
  ]

  // ====== Smart insights - acciones recomendadas ======
  const insights = useMemo(() => {
    const now = new Date()
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)

    // Hot leads (score alto, no cerrados)
    const hotLeads = state.leads
      .filter((l) => l.status === 'new' || l.status === 'contacted')
      .map((l) => ({ ...l, score: calculateLeadScore(l, state.treatments) }))
      .filter((l) => l.score.total >= 70)
      .sort((a, b) => b.score.total - a.score.total)
      .slice(0, 3)

    // Leads sin contactar por más de 48h
    const urgentLeads = state.leads
      .filter(
        (l) =>
          l.status === 'new' &&
          new Date(l.createdAt) < fortyEightHoursAgo
      )
      .slice(0, 3)

    // Citas sin confirmar
    const unconfirmedAppointments = state.leads
      .reduce((acc, lead) => {
        const unconfirmed = lead.followUps.filter(
          (fu) =>
            (fu.type === 'meeting' || fu.type === 'appointment') &&
            !fu.completed &&
            !fu.confirmedByPatient &&
            new Date(fu.scheduledAt) > now
        )
        return [
          ...acc,
          ...unconfirmed.map((fu) => ({ lead, followUp: fu })),
        ]
      }, [] as { lead: Lead; followUp: any }[])
      .slice(0, 3)

    // Seguimientos vencidos
    const overdueFollowUps = state.leads
      .reduce((acc, lead) => {
        const overdue = lead.followUps.filter(
          (fu) =>
            !fu.completed &&
            new Date(fu.scheduledAt) < now
        )
        return [
          ...acc,
          ...overdue.map((fu) => ({ lead, followUp: fu })),
        ]
      }, [] as { lead: Lead; followUp: any }[])
      .slice(0, 3)

    return { hotLeads, urgentLeads, unconfirmedAppointments, overdueFollowUps }
  }, [state.leads, state.treatments])

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'instagram':
        return <Instagram className="w-3.5 h-3.5" />
      case 'whatsapp':
        return <MessageCircle className="w-3.5 h-3.5" />
      default:
        return <Phone className="w-3.5 h-3.5" />
    }
  }

  const getFollowUpIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="w-4 h-4 text-primary-500" />
      case 'message':
        return <MessageCircle className="w-4 h-4 text-success-500" />
      case 'meeting':
        return <Video className="w-4 h-4 text-purple-500" />
      default:
        return <Calendar className="w-4 h-4 text-purple-500" />
    }
  }

  const hasInsights =
    insights.hotLeads.length > 0 ||
    insights.urgentLeads.length > 0 ||
    insights.unconfirmedAppointments.length > 0 ||
    insights.overdueFollowUps.length > 0

  return (
    <AppShell>
      <Header greeting showNotifications showProfile />

      <PageContainer>
        {/* Smart Action Cards */}
        {hasInsights && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="text-base lg:text-lg font-semibold text-slate-800">
                {language === 'es'
                  ? 'Acciones Recomendadas'
                  : 'Recommended Actions'}
              </h2>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              {/* Hot Leads */}
              {insights.hotLeads.length > 0 && (
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Flame className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-orange-800">
                        {insights.hotLeads.length}{' '}
                        {language === 'es'
                          ? 'Leads Calientes'
                          : 'Hot Leads'}
                      </h3>
                      <p className="text-xs text-orange-600">
                        {language === 'es'
                          ? 'Alta probabilidad de conversión'
                          : 'High conversion probability'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {insights.hotLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="flex items-center justify-between bg-white/60 rounded-xl p-3"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar name={lead.name} size="sm" />
                          <div>
                            <p className="font-medium text-slate-800 text-sm">
                              {lead.name}
                            </p>
                            <div className="flex items-center gap-2">
                              <LeadScoreBadge
                                score={lead.score.total}
                                size="sm"
                                showLabel={false}
                              />
                              <span className="text-xs text-slate-500">
                                {lead.treatments[0] ||
                                  (language === 'es'
                                    ? 'Sin tratamiento'
                                    : 'No treatment')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <a
                            href={getWhatsAppUrl(lead.phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                          <a
                            href={getPhoneUrl(lead.phone)}
                            className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/inbox"
                    className="flex items-center justify-center gap-2 mt-3 py-2 text-sm font-medium text-orange-700 hover:text-orange-800"
                  >
                    {language === 'es' ? 'Ver todos' : 'View all'}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}

              {/* Urgent - Not Contacted */}
              {insights.urgentLeads.length > 0 && (
                <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-red-800">
                        {insights.urgentLeads.length}{' '}
                        {language === 'es'
                          ? 'Sin Contactar'
                          : 'Not Contacted'}
                      </h3>
                      <p className="text-xs text-red-600">
                        {language === 'es'
                          ? 'Más de 48 horas esperando'
                          : 'Waiting for 48+ hours'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {insights.urgentLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="flex items-center justify-between bg-white/60 rounded-xl p-3"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar name={lead.name} size="sm" />
                          <div>
                            <p className="font-medium text-slate-800 text-sm">
                              {lead.name}
                            </p>
                            <p className="text-xs text-red-500">
                              {formatTimeAgo(new Date(lead.createdAt))}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <a
                            href={getWhatsAppUrl(lead.phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                          <a
                            href={getPhoneUrl(lead.phone)}
                            className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/inbox"
                    className="flex items-center justify-center gap-2 mt-3 py-2 text-sm font-medium text-red-700 hover:text-red-800"
                  >
                    {language === 'es'
                      ? 'Contactar ahora'
                      : 'Contact now'}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}

              {/* Overdue Follow-ups */}
              {insights.overdueFollowUps.length > 0 && (
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-amber-800">
                        {insights.overdueFollowUps.length}{' '}
                        {language === 'es'
                          ? 'Seguimientos Vencidos'
                          : 'Overdue Follow-ups'}
                      </h3>
                      <p className="text-xs text-amber-600">
                        {language === 'es'
                          ? 'Requieren atención inmediata'
                          : 'Need immediate attention'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {insights.overdueFollowUps.map(({ lead, followUp }) => (
                      <Link
                        key={followUp.id}
                        href={`/pacientes?selected=${lead.id}`}
                        className="flex items-center justify-between bg-white/60 rounded-xl p-3 hover:bg-white/80 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-100 rounded-lg">
                            {getFollowUpIcon(followUp.type)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 text-sm">
                              {lead.name}
                            </p>
                            <p className="text-xs text-amber-600">
                              {language === 'es'
                                ? 'Programado para'
                                : 'Scheduled for'}{' '}
                              {formatRelativeDate(
                                new Date(followUp.scheduledAt)
                              )}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </Link>
                    ))}
                  </div>
                  <Link
                    href="/calendar"
                    className="flex items-center justify-center gap-2 mt-3 py-2 text-sm font-medium text-amber-700 hover:text-amber-800"
                  >
                    {language === 'es'
                      ? 'Ver calendario'
                      : 'View calendar'}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}

              {/* Unconfirmed Appointments */}
              {insights.unconfirmedAppointments.length > 0 && (
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <CalendarCheck className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-purple-800">
                        {insights.unconfirmedAppointments.length}{' '}
                        {language === 'es'
                          ? 'Por Confirmar'
                          : 'To Confirm'}
                      </h3>
                      <p className="text-xs text-purple-600">
                        {language === 'es'
                          ? 'Citas sin confirmación del paciente'
                          : 'Unconfirmed appointments'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {insights.unconfirmedAppointments.map(
                      ({ lead, followUp }) => (
                        <div
                          key={followUp.id}
                          className="flex items-center justify-between bg-white/60 rounded-xl p-3"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar name={lead.name} size="sm" />
                            <div>
                              <p className="font-medium text-slate-800 text-sm">
                                {lead.name}
                              </p>
                              <p className="text-xs text-purple-600">
                                {formatRelativeDate(
                                  new Date(followUp.scheduledAt)
                                )}
                              </p>
                            </div>
                          </div>
                          <a
                            href={getWhatsAppUrl(
                              lead.phone,
                              language === 'es'
                                ? `Hola ${lead.name}, te escribo para confirmar tu cita.`
                                : `Hi ${lead.name}, I'm writing to confirm your appointment.`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-xs font-medium transition-colors"
                          >
                            {language === 'es'
                              ? 'Confirmar'
                              : 'Confirm'}
                          </a>
                        </div>
                      )
                    )}
                  </div>
                  <Link
                    href="/appointments"
                    className="flex items-center justify-center gap-2 mt-3 py-2 text-sm font-medium text-purple-700 hover:text-purple-800"
                  >
                    {language === 'es' ? 'Ver citas' : 'View appointments'}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-4 lg:overflow-visible">
          {statsCards.map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="flex-shrink-0 w-[140px] lg:w-auto"
            >
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer" padding="sm">
                <div
                  className={`w-8 h-8 lg:w-10 lg:h-10 rounded-lg ${
                    colorClasses[stat.colorKey].bg
                  } flex items-center justify-center mb-2`}
                >
                  <stat.icon
                    className={`w-4 h-4 lg:w-5 h-5 ${
                      colorClasses[stat.colorKey].text
                    }`}
                  />
                </div>
                <p className="text-2xl lg:text-3xl font-bold text-slate-800">
                  {stat.value}
                </p>
                <p className="text-xs lg:text-sm text-slate-500 mt-0.5">
                  {stat.label}
                </p>
                <p
                  className={cn(
                    'text-xs mt-1',
                    stat.colorKey === 'warning'
                      ? 'text-amber-600'
                      : 'text-slate-400'
                  )}
                >
                  {stat.change}
                </p>
              </Card>
            </Link>
          ))}
        </div>

        {/* Two Column Layout on Desktop */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-6">
          {/* Recent Patients */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base lg:text-lg font-semibold text-slate-800">
                {language === 'es'
                  ? 'Pacientes Recientes'
                  : 'Recent Patients'}
              </h2>
              <Link
                href="/pacientes"
                className="text-sm text-primary-600 font-medium flex items-center gap-1"
              >
                {language === 'es' ? 'Ver todos' : 'View all'}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <Card padding="none">
              {recentLeads.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <UserPlus className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-500">
                    {language === 'es'
                      ? 'No hay pacientes todavía'
                      : 'No patients yet'}
                  </p>
                  <Link
                    href="/pacientes?action=new"
                    className="inline-block mt-3 text-sm text-primary-600 font-medium hover:underline"
                  >
                    {language === 'es'
                      ? 'Agregar primer paciente'
                      : 'Add first patient'}
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentLeads.map((lead) => (
                    <Link
                      key={lead.id}
                      href={`/pacientes?selected=${lead.id}`}
                      className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors"
                    >
                      <Avatar name={lead.name} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-800 truncate">
                            {lead.name}
                          </p>
                          <Badge
                            variant={
                              lead.status === 'new'
                                ? 'primary'
                                : lead.status === 'contacted'
                                  ? 'warning'
                                  : lead.status === 'scheduled'
                                    ? 'default'
                                    : lead.status === 'closed'
                                      ? 'success'
                                      : 'error'
                            }
                            size="sm"
                          >
                            {t.status[lead.status] || lead.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            {getSourceIcon(lead.source)}
                            {t.sources[lead.source] || lead.source}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-xs text-slate-400">
                            {formatTimeAgo(new Date(lead.createdAt))}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300" />
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Upcoming Follow-ups */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base lg:text-lg font-semibold text-slate-800">
                {language === 'es'
                  ? 'Próximos Seguimientos'
                  : 'Upcoming Follow-ups'}
              </h2>
            <Link href="/calendar" className="text-sm text-primary-600 font-medium flex items-center gap-1">
              {language === 'es' ? 'Ver agenda' : 'View calendar'}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <Card padding="none">
            {upcomingFollowUps.length === 0 ? (
              <div className="py-8 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-500">
                  {language === 'es'
                    ? 'No hay seguimientos programados'
                    : 'No scheduled follow-ups'}
                </p>
                <Link
                  href="/pacientes"
                  className="inline-block mt-3 text-sm text-primary-600 font-medium hover:underline"
                >
                  {language === 'es'
                    ? 'Agendar seguimiento'
                    : 'Schedule follow-up'}
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {upcomingFollowUps.map(({ lead, followUp }) => (
                  <Link
                    key={followUp.id}
                    href={`/pacientes?selected=${lead.id}`}
                    className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                      {getFollowUpIcon(followUp.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 truncate">
                        {lead.name}
                      </p>
                        <p className="text-sm text-slate-500">
                          {getFollowUpTypeLabel(followUp.type)}
                          {followUp.notes && ` - ${followUp.notes}`}
                        </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-800">
                        {formatRelativeDate(
                          new Date(followUp.scheduledAt)
                        )}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Quick Stats - Ventas */}
      <div className="mt-6 mb-4">
        <Card className="bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm lg:text-base">
                {language === 'es' ? 'Ventas este mes' : 'Sales this month'}
              </p>
              <p className="text-2xl lg:text-4xl font-bold mt-1">
                {formatCurrency(
                  state.leads
                    .filter((l) => l.status === 'closed' && l.value)
                    .reduce((sum, l) => sum + (l.value || 0), 0)
                )}
              </p>
            </div>
            <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-white/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6 lg:w-8 lg:h-8" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex justify-between text-sm lg:text-base">
              <span className="text-primary-100">
                {state.leads.filter((l) => l.status === 'closed').length}{' '}
                {language === 'es'
                  ? 'ventas cerradas'
                  : 'closed sales'}
              </span>
              <Link
                href="/reports"
                className="font-medium hover:underline"
              >
                {language === 'es'
                  ? 'Ver reportes'
                  : 'View reports'}{' '}
                →
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  </AppShell>
)
}
