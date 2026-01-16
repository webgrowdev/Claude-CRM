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
} from 'lucide-react'
import { Header, PageContainer, AppShell } from '@/components/layout'
import { Card, Avatar, Badge } from '@/components/ui'
import { useApp } from '@/contexts/AppContext'
import { formatTimeAgo, formatRelativeDate, getStatusColor, getStatusLabel, formatCurrency } from '@/lib/utils'
import { LeadStatus } from '@/types'

export default function DashboardPage() {
  const { state, getRecentLeads, getUpcomingFollowUps } = useApp()

  const recentLeads = useMemo(() => getRecentLeads(4), [getRecentLeads])
  const upcomingFollowUps = useMemo(() => getUpcomingFollowUps().slice(0, 3), [getUpcomingFollowUps])

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const newLeads = state.leads.filter(l => l.status === 'new').length
    const followUpsDue = upcomingFollowUps.filter(f => new Date(f.followUp.scheduledAt) <= now).length
    const closedThisWeek = state.leads.filter(l =>
      l.status === 'closed' &&
      l.closedAt &&
      new Date(l.closedAt) >= weekAgo
    ).length
    const totalLeads = state.leads.length
    const closedTotal = state.leads.filter(l => l.status === 'closed').length
    const conversionRate = totalLeads > 0 ? Math.round((closedTotal / totalLeads) * 100) : 0

    return { newLeads, followUpsDue, closedThisWeek, conversionRate }
  }, [state.leads, upcomingFollowUps])

  const statsCards = [
    {
      label: 'Pacientes Nuevos',
      value: stats.newLeads,
      change: '+3 hoy',
      color: 'primary',
      icon: UserRound,
    },
    {
      label: 'Seguimientos',
      value: stats.followUpsDue,
      change: stats.followUpsDue > 0 ? `${stats.followUpsDue} pendientes` : 'Al día',
      color: stats.followUpsDue > 0 ? 'warning' : 'success',
      icon: Bell,
    },
    {
      label: 'Cerrados',
      value: stats.closedThisWeek,
      change: 'Esta semana',
      color: 'success',
      icon: CheckCircle,
    },
    {
      label: 'Conversión',
      value: `${stats.conversionRate}%`,
      change: '+5% vs mes anterior',
      color: 'secondary',
      icon: TrendingUp,
    },
  ]

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

  return (
    <AppShell>
      <Header greeting showNotifications showProfile />

      <PageContainer>
        {/* Stats Cards - Responsive grid on desktop */}
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-4 lg:overflow-visible">
          {statsCards.map((stat) => (
            <Card
              key={stat.label}
              className="flex-shrink-0 w-[140px] lg:w-auto"
              padding="sm"
            >
              <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-${stat.color}-100 flex items-center justify-center mb-2`}>
                <stat.icon className={`w-4 h-4 lg:w-5 lg:h-5 text-${stat.color}-600`} />
              </div>
              <p className="text-2xl lg:text-3xl font-bold text-slate-800">{stat.value}</p>
              <p className="text-xs lg:text-sm text-slate-500 mt-0.5">{stat.label}</p>
              <p className={`text-xs mt-1 ${stat.color === 'warning' ? 'text-warning-600' : 'text-slate-400'}`}>
                {stat.change}
              </p>
            </Card>
          ))}
        </div>

        {/* Two Column Layout on Desktop */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-6">
          {/* Recent Patients */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base lg:text-lg font-semibold text-slate-800">Pacientes Recientes</h2>
              <Link href="/pacientes" className="text-sm text-primary-600 font-medium flex items-center gap-1">
                Ver todos
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <Card padding="none">
              {recentLeads.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-slate-500">No hay pacientes todavía</p>
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
                          <p className="font-medium text-slate-800 truncate">{lead.name}</p>
                          <Badge
                            variant={
                              lead.status === 'new' ? 'primary' :
                              lead.status === 'contacted' ? 'warning' :
                              lead.status === 'scheduled' ? 'default' :
                              lead.status === 'closed' ? 'success' : 'error'
                            }
                            size="sm"
                          >
                            {getStatusLabel(lead.status)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            {getSourceIcon(lead.source)}
                            {lead.source === 'instagram' ? 'Instagram' :
                             lead.source === 'whatsapp' ? 'WhatsApp' : 'Teléfono'}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-xs text-slate-400">{formatTimeAgo(new Date(lead.createdAt))}</span>
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
              <h2 className="text-base lg:text-lg font-semibold text-slate-800">Próximos Seguimientos</h2>
              <Link href="/calendar" className="text-sm text-primary-600 font-medium flex items-center gap-1">
                Ver agenda
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <Card padding="none">
              {upcomingFollowUps.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-slate-500">No hay seguimientos programados</p>
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
                        <p className="font-medium text-slate-800 truncate">{lead.name}</p>
                        <p className="text-sm text-slate-500">
                          {followUp.type === 'call' ? 'Llamada' :
                           followUp.type === 'message' ? 'Mensaje' :
                           followUp.type === 'meeting' ? 'Reunión' : 'Email'}
                          {followUp.notes && ` - ${followUp.notes}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-800">
                          {formatRelativeDate(new Date(followUp.scheduledAt))}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Quick Stats - Full width on desktop */}
        <div className="mt-6 mb-4">
          <Card className="bg-gradient-to-br from-primary-500 to-primary-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-100 text-sm lg:text-base">Ventas este mes</p>
                <p className="text-2xl lg:text-4xl font-bold mt-1">
                  {formatCurrency(
                    state.leads
                      .filter(l => l.status === 'closed' && l.value)
                      .reduce((sum, l) => sum + (l.value || 0), 0)
                  )}
                </p>
              </div>
              <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-white/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 lg:w-8 lg:h-8" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="flex justify-between text-sm lg:text-base">
                <span className="text-primary-100">
                  {state.leads.filter(l => l.status === 'closed').length} ventas cerradas
                </span>
                <Link href="/reports" className="font-medium hover:underline">
                  Ver reportes →
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  )
}
