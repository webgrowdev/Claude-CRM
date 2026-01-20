'use client'

import { useMemo, useState } from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Users,
  Target,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui'
import { useLanguage } from '@/i18n/LanguageContext'

// Types
interface DataPoint {
  date: string
  label: string
  leads: number
  conversions: number
  revenue: number
  appointments: number
}

interface AnalyticsData {
  daily: DataPoint[]
  weekly: DataPoint[]
  monthly: DataPoint[]
}

interface TrendMetric {
  label: string
  value: number
  previousValue: number
  format?: 'number' | 'currency' | 'percent'
  icon: React.ReactNode
  color: string
}

interface AdvancedAnalyticsProps {
  data: AnalyticsData
  currency?: string
}

// Color palette
const COLORS = {
  primary: '#6366F1',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  purple: '#8B5CF6',
  blue: '#3B82F6',
  pink: '#EC4899',
  slate: '#64748B',
}

const GRADIENT_COLORS = {
  leads: ['#6366F1', '#818CF8'],
  conversions: ['#10B981', '#34D399'],
  revenue: ['#F59E0B', '#FBBF24'],
  appointments: ['#8B5CF6', '#A78BFA'],
}

export function AdvancedAnalytics({ data, currency = '$' }: AdvancedAnalyticsProps) {
  const { language } = useLanguage()
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly')
  const [selectedMetric, setSelectedMetric] = useState<'leads' | 'conversions' | 'revenue' | 'appointments'>('leads')

  const t = {
    trends: language === 'es' ? 'Tendencias' : 'Trends',
    daily: language === 'es' ? 'Diario' : 'Daily',
    weekly: language === 'es' ? 'Semanal' : 'Weekly',
    monthly: language === 'es' ? 'Mensual' : 'Monthly',
    leads: language === 'es' ? 'Leads' : 'Leads',
    conversions: language === 'es' ? 'Conversiones' : 'Conversions',
    revenue: language === 'es' ? 'Ingresos' : 'Revenue',
    appointments: language === 'es' ? 'Citas' : 'Appointments',
    vsLastPeriod: language === 'es' ? 'vs periodo anterior' : 'vs last period',
    comparison: language === 'es' ? 'Comparativa' : 'Comparison',
    distribution: language === 'es' ? 'Distribución' : 'Distribution',
    performance: language === 'es' ? 'Rendimiento' : 'Performance',
  }

  const currentData = data[period] || []

  // Calculate trends
  const metrics: TrendMetric[] = useMemo(() => {
    if (currentData.length < 2) return []

    const current = currentData.slice(-7)
    const previous = currentData.slice(-14, -7)

    const sum = (arr: DataPoint[], key: keyof DataPoint) =>
      arr.reduce((acc, item) => acc + (typeof item[key] === 'number' ? item[key] as number : 0), 0)

    const currentLeads = sum(current, 'leads')
    const previousLeads = sum(previous, 'leads')
    const currentConversions = sum(current, 'conversions')
    const previousConversions = sum(previous, 'conversions')
    const currentRevenue = sum(current, 'revenue')
    const previousRevenue = sum(previous, 'revenue')
    const currentAppointments = sum(current, 'appointments')
    const previousAppointments = sum(previous, 'appointments')

    return [
      {
        label: t.leads,
        value: currentLeads,
        previousValue: previousLeads,
        format: 'number',
        icon: <Users className="w-5 h-5" />,
        color: COLORS.primary,
      },
      {
        label: t.conversions,
        value: currentConversions,
        previousValue: previousConversions,
        format: 'number',
        icon: <Target className="w-5 h-5" />,
        color: COLORS.success,
      },
      {
        label: t.revenue,
        value: currentRevenue,
        previousValue: previousRevenue,
        format: 'currency',
        icon: <DollarSign className="w-5 h-5" />,
        color: COLORS.warning,
      },
      {
        label: t.appointments,
        value: currentAppointments,
        previousValue: previousAppointments,
        format: 'number',
        icon: <Calendar className="w-5 h-5" />,
        color: COLORS.purple,
      },
    ]
  }, [currentData, t])

  // Distribution data for pie chart
  const distributionData = useMemo(() => {
    const total = currentData.reduce((acc, item) => acc + item.leads, 0)
    const converted = currentData.reduce((acc, item) => acc + item.conversions, 0)
    const scheduled = currentData.reduce((acc, item) => acc + item.appointments, 0)
    const pending = total - converted - scheduled

    return [
      { name: language === 'es' ? 'Convertidos' : 'Converted', value: converted, color: COLORS.success },
      { name: language === 'es' ? 'Agendados' : 'Scheduled', value: scheduled, color: COLORS.purple },
      { name: language === 'es' ? 'Pendientes' : 'Pending', value: Math.max(0, pending), color: COLORS.slate },
    ].filter(item => item.value > 0)
  }, [currentData, language])

  const formatValue = (value: number, format?: string) => {
    if (format === 'currency') return `${currency}${value.toLocaleString()}`
    if (format === 'percent') return `${value.toFixed(1)}%`
    return value.toLocaleString()
  }

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <ArrowUpRight className="w-4 h-4 text-green-500" />
    if (current < previous) return <ArrowDownRight className="w-4 h-4 text-red-500" />
    return <Minus className="w-4 h-4 text-slate-400" />
  }

  const getTrendPercent = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-500" />
          {t.trends}
        </h2>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {(['daily', 'weekly', 'monthly'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                period === p
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              )}
            >
              {t[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((metric) => {
          const trendPercent = getTrendPercent(metric.value, metric.previousValue)
          const isPositive = trendPercent > 0
          const isNeutral = trendPercent === 0

          return (
            <Card
              key={metric.label}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                selectedMetric === metric.label.toLowerCase() && 'ring-2 ring-primary-500'
              )}
              onClick={() => setSelectedMetric(metric.label.toLowerCase() as typeof selectedMetric)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-500">{metric.label}</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">
                    {formatValue(metric.value, metric.format)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {getTrendIcon(metric.value, metric.previousValue)}
                    <span className={cn(
                      'text-xs font-medium',
                      isPositive ? 'text-green-600' : isNeutral ? 'text-slate-500' : 'text-red-600'
                    )}>
                      {isPositive ? '+' : ''}{trendPercent.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${metric.color}20`, color: metric.color }}
                >
                  {metric.icon}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Main chart */}
      <Card>
        <h3 className="font-medium text-slate-800 mb-4">{t.performance}</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={currentData}>
              <defs>
                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.success} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: '#64748B' }}
                tickLine={false}
                axisLine={{ stroke: '#E2E8F0' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#64748B' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="leads"
                name={t.leads}
                stroke={COLORS.primary}
                strokeWidth={2}
                fill="url(#colorLeads)"
              />
              <Area
                type="monotone"
                dataKey="conversions"
                name={t.conversions}
                stroke={COLORS.success}
                strokeWidth={2}
                fill="url(#colorConversions)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Secondary charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar chart comparison */}
        <Card>
          <h3 className="font-medium text-slate-800 mb-4">{t.comparison}</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currentData.slice(-7)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar dataKey="leads" name={t.leads} fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                <Bar dataKey="appointments" name={t.appointments} fill={COLORS.purple} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pie chart distribution */}
        <Card>
          <h3 className="font-medium text-slate-800 mb-4">{t.distribution}</h3>
          <div className="h-48 flex items-center">
            <div className="w-1/2">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-2">
              {distributionData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-slate-600">{item.name}</span>
                  <span className="text-sm font-medium text-slate-800 ml-auto">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

// Helper to generate sample analytics data
export function generateSampleAnalyticsData(): AnalyticsData {
  const today = new Date()

  const generateDataPoints = (days: number, interval: 'day' | 'week' | 'month'): DataPoint[] => {
    const points: DataPoint[] = []

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)

      if (interval === 'day') {
        date.setDate(date.getDate() - i)
      } else if (interval === 'week') {
        date.setDate(date.getDate() - i * 7)
      } else {
        date.setMonth(date.getMonth() - i)
      }

      const baseLeads = Math.floor(Math.random() * 10) + 5
      const conversions = Math.floor(baseLeads * (0.2 + Math.random() * 0.3))
      const appointments = Math.floor(baseLeads * (0.4 + Math.random() * 0.3))
      const revenue = conversions * (500 + Math.floor(Math.random() * 1000))

      points.push({
        date: date.toISOString(),
        label: interval === 'day'
          ? date.toLocaleDateString('es-ES', { weekday: 'short' })
          : interval === 'week'
          ? `Sem ${Math.ceil((days - i) / 1)}`
          : date.toLocaleDateString('es-ES', { month: 'short' }),
        leads: baseLeads,
        conversions,
        revenue,
        appointments,
      })
    }

    return points
  }

  return {
    daily: generateDataPoints(14, 'day'),
    weekly: generateDataPoints(12, 'week'),
    monthly: generateDataPoints(12, 'month'),
  }
}
