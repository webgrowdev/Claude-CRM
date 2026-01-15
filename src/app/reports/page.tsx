'use client'

import { useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  CheckCircle,
  Clock,
  Instagram,
  MessageCircle,
  Phone,
  Globe,
} from 'lucide-react'
import { Header, BottomNav, PageContainer } from '@/components/layout'
import { Card, Select } from '@/components/ui'
import { useApp } from '@/contexts/AppContext'
import { formatCurrency, getSourceLabel } from '@/lib/utils'
import { LeadSource } from '@/types'

const COLORS = {
  instagram: '#E1306C',
  whatsapp: '#25D366',
  phone: '#6366F1',
  website: '#F59E0B',
  referral: '#8B5CF6',
  other: '#94A3B8',
}

const periodOptions = [
  { value: 'week', label: 'Esta semana' },
  { value: 'month', label: 'Este mes' },
  { value: 'quarter', label: 'Este trimestre' },
  { value: 'year', label: 'Este año' },
]

export default function ReportsPage() {
  const { state } = useApp()
  const [period, setPeriod] = useState('month')

  // Calculate stats based on period
  const stats = useMemo(() => {
    const now = new Date()
    let startDate: Date

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3)
        startDate = new Date(now.getFullYear(), quarter * 3, 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    const periodLeads = state.leads.filter(
      (l) => new Date(l.createdAt) >= startDate
    )

    const totalLeads = periodLeads.length
    const closedLeads = periodLeads.filter((l) => l.status === 'closed')
    const lostLeads = periodLeads.filter((l) => l.status === 'lost')
    const contactedLeads = periodLeads.filter(
      (l) => l.status !== 'new'
    ).length
    const scheduledLeads = periodLeads.filter(
      (l) => l.status === 'scheduled' || l.status === 'closed'
    ).length

    const conversionRate =
      totalLeads > 0 ? (closedLeads.length / totalLeads) * 100 : 0

    const totalValue = closedLeads.reduce((sum, l) => sum + (l.value || 0), 0)

    // Calculate average close time
    const closeTimes = closedLeads
      .filter((l) => l.closedAt)
      .map((l) => {
        const created = new Date(l.createdAt).getTime()
        const closed = new Date(l.closedAt!).getTime()
        return (closed - created) / (1000 * 60 * 60 * 24) // days
      })
    const avgCloseTime =
      closeTimes.length > 0
        ? closeTimes.reduce((a, b) => a + b, 0) / closeTimes.length
        : 0

    // Lead sources
    const sourceData = Object.entries(
      periodLeads.reduce(
        (acc, lead) => {
          acc[lead.source] = (acc[lead.source] || 0) + 1
          return acc
        },
        {} as Record<LeadSource, number>
      )
    ).map(([source, count]) => ({
      source: source as LeadSource,
      count,
      percentage: totalLeads > 0 ? (count / totalLeads) * 100 : 0,
    }))

    // Funnel data
    const funnelData = [
      { stage: 'Nuevos', count: totalLeads, percentage: 100 },
      {
        stage: 'Contactados',
        count: contactedLeads,
        percentage: totalLeads > 0 ? (contactedLeads / totalLeads) * 100 : 0,
      },
      {
        stage: 'Agendados',
        count: scheduledLeads,
        percentage: totalLeads > 0 ? (scheduledLeads / totalLeads) * 100 : 0,
      },
      {
        stage: 'Cerrados',
        count: closedLeads.length,
        percentage: conversionRate,
      },
    ]

    return {
      totalLeads,
      closedLeads: closedLeads.length,
      lostLeads: lostLeads.length,
      conversionRate,
      totalValue,
      avgCloseTime,
      sourceData,
      funnelData,
    }
  }, [state.leads, period])

  const getSourceIcon = (source: LeadSource) => {
    switch (source) {
      case 'instagram':
        return <Instagram className="w-4 h-4" />
      case 'whatsapp':
        return <MessageCircle className="w-4 h-4" />
      case 'phone':
        return <Phone className="w-4 h-4" />
      default:
        return <Globe className="w-4 h-4" />
    }
  }

  return (
    <>
      <Header title="Reportes" />

      <PageContainer>
        {/* Period Selector */}
        <div className="mb-4">
          <Select
            value={period}
            onChange={setPeriod}
            options={periodOptions}
          />
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500">Total Leads</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  {stats.totalLeads}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500">Tasa de Conversión</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  {stats.conversionRate.toFixed(1)}%
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center">
                <Target className="w-5 h-5 text-success-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500">Ventas Cerradas</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  {stats.closedLeads}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-success-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500">Tiempo Promedio</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  {stats.avgCloseTime.toFixed(1)}d
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-warning-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Total Revenue */}
        <Card className="mt-4 bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <p className="text-primary-100 text-sm">Ingresos del Periodo</p>
          <p className="text-3xl font-bold mt-1">
            {formatCurrency(stats.totalValue)}
          </p>
          <div className="flex items-center gap-1 mt-2 text-primary-100 text-sm">
            {stats.closedLeads > 0 ? (
              <>
                <TrendingUp className="w-4 h-4" />
                <span>
                  {stats.closedLeads} ventas cerradas
                </span>
              </>
            ) : (
              <span>Sin ventas en este periodo</span>
            )}
          </div>
        </Card>

        {/* Conversion Funnel */}
        <Card className="mt-4">
          <h3 className="text-base font-semibold text-slate-800 mb-4">
            Embudo de Conversión
          </h3>
          <div className="space-y-3">
            {stats.funnelData.map((item, index) => (
              <div key={item.stage}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-600">{item.stage}</span>
                  <span className="text-sm font-medium text-slate-800">
                    {item.count} ({item.percentage.toFixed(0)}%)
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Lead Sources */}
        <Card className="mt-4 mb-4">
          <h3 className="text-base font-semibold text-slate-800 mb-4">
            Fuentes de Leads
          </h3>

          {stats.sourceData.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              Sin datos en este periodo
            </p>
          ) : (
            <>
              {/* Pie Chart */}
              <div className="h-48 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.sourceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="count"
                    >
                      {stats.sourceData.map((entry) => (
                        <Cell
                          key={entry.source}
                          fill={COLORS[entry.source] || COLORS.other}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="space-y-2">
                {stats.sourceData
                  .sort((a, b) => b.count - a.count)
                  .map((item) => (
                    <div
                      key={item.source}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor:
                              COLORS[item.source] || COLORS.other,
                          }}
                        />
                        <span className="text-sm text-slate-600 flex items-center gap-1">
                          {getSourceIcon(item.source)}
                          {getSourceLabel(item.source)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-slate-800">
                          {item.count}
                        </span>
                        <span className="text-xs text-slate-500 ml-1">
                          ({item.percentage.toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </>
          )}
        </Card>
      </PageContainer>

      <BottomNav />
    </>
  )
}
