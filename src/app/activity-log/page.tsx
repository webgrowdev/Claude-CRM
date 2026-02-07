'use client'

import { useState, useEffect } from 'react'
import { Calendar, Filter, User, FileText, Download } from 'lucide-react'
import { Button, Input, Card } from '@/components/ui'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface ActivityLog {
  id: string
  userId: string
  userName: string
  action: string
  resource: string
  resourceId?: string
  resourceName?: string
  changes?: { field: string; oldValue: string; newValue: string }[]
  timestamp: Date
  ipAddress?: string
}

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<string>('all')
  const [selectedAction, setSelectedAction] = useState<string>('all')
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadLogs()
  }, [])

  useEffect(() => {
    filterLogs()
  }, [logs, searchTerm, selectedUser, selectedAction, dateRange])

  const loadLogs = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        console.error('No auth token found')
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/activity-logs', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error('Error loading activity logs')
      }

      const data = await response.json()
      
      // Transform API data to match ActivityLog interface
      const transformedLogs: ActivityLog[] = (data.logs || []).map((log: any) => ({
        id: log.id,
        userId: log.user_id,
        userName: log.user_name || 'Usuario desconocido',
        action: log.action_type,
        resource: log.resource_type,
        resourceId: log.resource_id,
        resourceName: log.description || '',
        changes: log.changes ? Object.entries(log.changes).map(([field, value]: any) => ({
          field,
          oldValue: value?.old || '',
          newValue: value?.new || value || '',
        })) : undefined,
        timestamp: new Date(log.created_at),
        ipAddress: log.ip_address,
      }))

      setLogs(transformedLogs)
    } catch (error) {
      console.error('Error loading logs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterLogs = () => {
    let filtered = [...logs]

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        log =>
          log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.resourceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.action.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by user
    if (selectedUser !== 'all') {
      filtered = filtered.filter(log => log.userId === selectedUser)
    }

    // Filter by action
    if (selectedAction !== 'all') {
      filtered = filtered.filter(log => log.action === selectedAction)
    }

    // Filter by date range
    if (dateRange.start) {
      const startDate = new Date(dateRange.start)
      filtered = filtered.filter(log => new Date(log.timestamp) >= startDate)
    }
    if (dateRange.end) {
      const endDate = new Date(dateRange.end)
      endDate.setHours(23, 59, 59)
      filtered = filtered.filter(log => new Date(log.timestamp) <= endDate)
    }

    setFilteredLogs(filtered)
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-success-100 text-success-700'
      case 'update':
        return 'bg-primary-100 text-primary-700'
      case 'delete':
        return 'bg-error-100 text-error-700'
      case 'view':
        return 'bg-slate-100 text-slate-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const getActionText = (action: string) => {
    switch (action) {
      case 'create':
        return 'Creó'
      case 'update':
        return 'Actualizó'
      case 'delete':
        return 'Eliminó'
      case 'view':
        return 'Vio'
      default:
        return action
    }
  }

  const getResourceText = (resource: string) => {
    switch (resource) {
      case 'patient':
        return 'paciente'
      case 'appointment':
        return 'cita'
      case 'treatment':
        return 'tratamiento'
      case 'user':
        return 'usuario'
      default:
        return resource
    }
  }

  const exportLogs = () => {
    // TODO: Implement export to CSV
    console.log('Exporting logs...')
  }

  const uniqueUsers = Array.from(new Set(logs.map(log => log.userId))).map(userId => {
    const log = logs.find(l => l.userId === userId)
    return { id: userId, name: log?.userName || '' }
  })

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Registro de Actividad</h1>
            <p className="text-slate-500 text-sm">
              Historial completo de acciones en el sistema
            </p>
          </div>
          <Button onClick={exportLogs} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="space-y-4">
          {/* Search */}
          <Input
            type="text"
            placeholder="Buscar por usuario, recurso o acción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Filter className="w-5 h-5" />}
          />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* User Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Usuario
              </label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <option value="all">Todos</option>
                {uniqueUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Acción
              </label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
              >
                <option value="all">Todas</option>
                <option value="create">Crear</option>
                <option value="update">Actualizar</option>
                <option value="delete">Eliminar</option>
                <option value="view">Ver</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Desde
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Hasta
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
          </div>

          {/* Clear Filters */}
          {(searchTerm || selectedUser !== 'all' || selectedAction !== 'all' || dateRange.start || dateRange.end) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('')
                setSelectedUser('all')
                setSelectedAction('all')
                setDateRange({ start: '', end: '' })
              }}
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      </Card>

      {/* Activity List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-slate-500">Cargando registros...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No se encontraron registros</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredLogs.map(log => (
            <Card key={log.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  {/* Avatar/Icon */}
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-primary-600" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1 flex-wrap">
                      <span className="font-medium text-slate-800">{log.userName}</span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getActionColor(log.action)}`}>
                        {getActionText(log.action)}
                      </span>
                    </div>
                    <div className="text-slate-600 text-sm mb-2">
                      {getResourceText(log.resource)}
                      {log.resourceName && (
                        <span className="font-medium text-slate-800">
                          {` "${log.resourceName}"`}
                        </span>
                      )}
                    </div>

                    {/* Changes */}
                    {log.changes && log.changes.length > 0 && (
                      <div className="mt-2 p-2 bg-slate-50 rounded text-xs space-y-1">
                        {log.changes.map((change, idx) => (
                          <div key={idx} className="text-slate-600">
                            <span className="font-medium">{change.field}:</span>{' '}
                            <span className="line-through text-slate-400">{change.oldValue}</span>
                            {' → '}
                            <span className="text-primary-600">{change.newValue}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {format(new Date(log.timestamp), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                        </span>
                      </div>
                      {log.ipAddress && (
                        <span>IP: {log.ipAddress}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Results count */}
      {!isLoading && filteredLogs.length > 0 && (
        <div className="mt-6 text-center text-sm text-slate-500">
          Mostrando {filteredLogs.length} de {logs.length} registros
        </div>
      )}
    </div>
  )
}
