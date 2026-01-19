'use client'

import { useState, useMemo } from 'react'
import {
  History,
  Search,
  Filter,
  User,
  Calendar,
  FileText,
  DollarSign,
  Settings,
  LogIn,
  LogOut,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react'
import { Input, Select, Button } from '@/components/ui'
import { useLanguage } from '@/i18n/LanguageContext'
import { AuditLog, AuditAction, AuditEntity } from '@/types'
import {
  getActionLabel,
  getActionLabelES,
  getEntityLabel,
  getEntityLabelES,
  formatChanges,
} from '@/services/auditLog'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { es, enUS } from 'date-fns/locale'

interface AuditLogViewerProps {
  logs: AuditLog[]
  onRefresh?: () => void
}

const actionIcons: Record<AuditAction, React.ReactNode> = {
  create: <Plus className="w-4 h-4" />,
  update: <Edit className="w-4 h-4" />,
  delete: <Trash2 className="w-4 h-4" />,
  view: <Eye className="w-4 h-4" />,
  export: <Download className="w-4 h-4" />,
  login: <LogIn className="w-4 h-4" />,
  logout: <LogOut className="w-4 h-4" />,
  settings_change: <Settings className="w-4 h-4" />,
}

const actionColors: Record<AuditAction, string> = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  view: 'bg-slate-100 text-slate-700',
  export: 'bg-purple-100 text-purple-700',
  login: 'bg-emerald-100 text-emerald-700',
  logout: 'bg-amber-100 text-amber-700',
  settings_change: 'bg-orange-100 text-orange-700',
}

const entityIcons: Record<AuditEntity, React.ReactNode> = {
  lead: <User className="w-3.5 h-3.5" />,
  patient: <User className="w-3.5 h-3.5" />,
  appointment: <Calendar className="w-3.5 h-3.5" />,
  treatment: <FileText className="w-3.5 h-3.5" />,
  payment: <DollarSign className="w-3.5 h-3.5" />,
  user: <User className="w-3.5 h-3.5" />,
  settings: <Settings className="w-3.5 h-3.5" />,
  report: <FileText className="w-3.5 h-3.5" />,
}

export function AuditLogViewer({ logs, onRefresh }: AuditLogViewerProps) {
  const { language } = useLanguage()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterAction, setFilterAction] = useState<AuditAction | 'all'>('all')
  const [filterEntity, setFilterEntity] = useState<AuditEntity | 'all'>('all')
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)

  const t = {
    title: language === 'es' ? 'Registro de Actividad' : 'Activity Log',
    search: language === 'es' ? 'Buscar...' : 'Search...',
    filters: language === 'es' ? 'Filtros' : 'Filters',
    action: language === 'es' ? 'Acción' : 'Action',
    entity: language === 'es' ? 'Entidad' : 'Entity',
    all: language === 'es' ? 'Todas' : 'All',
    noLogs: language === 'es' ? 'Sin registros de actividad' : 'No activity logs',
    changes: language === 'es' ? 'Cambios' : 'Changes',
    refresh: language === 'es' ? 'Actualizar' : 'Refresh',
    showing: language === 'es' ? 'Mostrando' : 'Showing',
    of: language === 'es' ? 'de' : 'of',
    results: language === 'es' ? 'registros' : 'records',
  }

  const filteredLogs = useMemo(() => {
    let result = [...logs]

    if (filterAction !== 'all') {
      result = result.filter(log => log.action === filterAction)
    }

    if (filterEntity !== 'all') {
      result = result.filter(log => log.entity === filterEntity)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(log =>
        log.userName.toLowerCase().includes(query) ||
        log.entityName?.toLowerCase().includes(query) ||
        log.action.toLowerCase().includes(query) ||
        log.entity.toLowerCase().includes(query)
      )
    }

    return result
  }, [logs, filterAction, filterEntity, searchQuery])

  const toggleExpanded = (logId: string) => {
    const newExpanded = new Set(expandedLogs)
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId)
    } else {
      newExpanded.add(logId)
    }
    setExpandedLogs(newExpanded)
  }

  const getActionText = (action: AuditAction) =>
    language === 'es' ? getActionLabelES(action) : getActionLabel(action)

  const getEntityText = (entity: AuditEntity) =>
    language === 'es' ? getEntityLabelES(entity) : getEntityLabel(entity)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-slate-100 rounded-lg">
            <History className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">{t.title}</h3>
            <p className="text-xs text-slate-500">
              {t.showing} {filteredLogs.length} {t.of} {logs.length} {t.results}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              showFilters
                ? 'bg-primary-100 text-primary-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            <Filter className="w-4 h-4" />
          </button>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder={t.search}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
          <Select
            label={t.action}
            value={filterAction}
            onChange={(value) => setFilterAction(value as AuditAction | 'all')}
            options={[
              { value: 'all', label: t.all },
              { value: 'create', label: getActionText('create') },
              { value: 'update', label: getActionText('update') },
              { value: 'delete', label: getActionText('delete') },
              { value: 'view', label: getActionText('view') },
              { value: 'export', label: getActionText('export') },
              { value: 'login', label: getActionText('login') },
              { value: 'logout', label: getActionText('logout') },
            ]}
          />
          <Select
            label={t.entity}
            value={filterEntity}
            onChange={(value) => setFilterEntity(value as AuditEntity | 'all')}
            options={[
              { value: 'all', label: t.all },
              { value: 'lead', label: getEntityText('lead') },
              { value: 'patient', label: getEntityText('patient') },
              { value: 'appointment', label: getEntityText('appointment') },
              { value: 'treatment', label: getEntityText('treatment') },
              { value: 'payment', label: getEntityText('payment') },
              { value: 'user', label: getEntityText('user') },
              { value: 'settings', label: getEntityText('settings') },
            ]}
          />
        </div>
      )}

      {/* Log List */}
      {filteredLogs.length === 0 ? (
        <div className="text-center py-8">
          <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">{t.noLogs}</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {filteredLogs.map((log) => {
            const isExpanded = expandedLogs.has(log.id)
            const hasChanges = log.changes && log.changes.length > 0

            return (
              <div
                key={log.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition-colors"
              >
                <div
                  className={cn(
                    'p-4 flex items-start gap-3',
                    hasChanges && 'cursor-pointer'
                  )}
                  onClick={() => hasChanges && toggleExpanded(log.id)}
                >
                  {/* Action Icon */}
                  <div className={cn('p-2 rounded-lg', actionColors[log.action])}>
                    {actionIcons[log.action]}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-800">
                        {log.userName}
                      </span>
                      <span className="text-slate-500">{getActionText(log.action)}</span>
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                        'bg-slate-100 text-slate-600'
                      )}>
                        {entityIcons[log.entity]}
                        {getEntityText(log.entity)}
                      </span>
                      {log.entityName && (
                        <span className="text-slate-700 font-medium truncate">
                          "{log.entityName}"
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {format(new Date(log.timestamp), 'PPpp', {
                        locale: language === 'es' ? es : enUS
                      })}
                    </p>
                  </div>

                  {/* Expand Indicator */}
                  {hasChanges && (
                    <button className="p-1 text-slate-400 hover:text-slate-600">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>

                {/* Expanded Changes */}
                {isExpanded && hasChanges && (
                  <div className="px-4 pb-4">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs font-medium text-slate-500 mb-2">{t.changes}:</p>
                      <ul className="space-y-1">
                        {formatChanges(log.changes!, language === 'es' ? 'es' : 'en').map((change, i) => (
                          <li key={i} className="text-sm text-slate-600">
                            • {change}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
