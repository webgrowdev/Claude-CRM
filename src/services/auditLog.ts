import { AuditLog, AuditAction, AuditEntity } from '@/types'

// In-memory audit log storage (in production, this would be a database)
let auditLogs: AuditLog[] = []

/**
 * Create an audit log entry
 */
export function createAuditLog(
  userId: string,
  userName: string,
  action: AuditAction,
  entity: AuditEntity,
  options?: {
    entityId?: string
    entityName?: string
    changes?: { field: string; oldValue: unknown; newValue: unknown }[]
    ipAddress?: string
    userAgent?: string
  }
): AuditLog {
  const log: AuditLog = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    userName,
    action,
    entity,
    entityId: options?.entityId,
    entityName: options?.entityName,
    changes: options?.changes,
    ipAddress: options?.ipAddress,
    userAgent: options?.userAgent,
    timestamp: new Date(),
  }

  auditLogs.unshift(log) // Add to beginning for newest first

  // Keep only last 1000 logs in memory
  if (auditLogs.length > 1000) {
    auditLogs = auditLogs.slice(0, 1000)
  }

  return log
}

/**
 * Get all audit logs
 */
export function getAuditLogs(): AuditLog[] {
  return auditLogs
}

/**
 * Get audit logs for a specific entity
 */
export function getAuditLogsForEntity(entity: AuditEntity, entityId?: string): AuditLog[] {
  return auditLogs.filter(log => {
    if (log.entity !== entity) return false
    if (entityId && log.entityId !== entityId) return false
    return true
  })
}

/**
 * Get audit logs for a specific user
 */
export function getAuditLogsForUser(userId: string): AuditLog[] {
  return auditLogs.filter(log => log.userId === userId)
}

/**
 * Get audit logs within a date range
 */
export function getAuditLogsByDateRange(start: Date, end: Date): AuditLog[] {
  return auditLogs.filter(log => {
    const timestamp = new Date(log.timestamp)
    return timestamp >= start && timestamp <= end
  })
}

/**
 * Search audit logs
 */
export function searchAuditLogs(query: string): AuditLog[] {
  const lowerQuery = query.toLowerCase()
  return auditLogs.filter(log =>
    log.userName.toLowerCase().includes(lowerQuery) ||
    log.action.toLowerCase().includes(lowerQuery) ||
    log.entity.toLowerCase().includes(lowerQuery) ||
    log.entityName?.toLowerCase().includes(lowerQuery) ||
    log.entityId?.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Get action label in Spanish
 */
export function getActionLabelES(action: AuditAction): string {
  const labels: Record<AuditAction, string> = {
    create: 'Creación',
    update: 'Actualización',
    delete: 'Eliminación',
    view: 'Vista',
    export: 'Exportación',
    login: 'Inicio de sesión',
    logout: 'Cierre de sesión',
    settings_change: 'Cambio de configuración',
  }
  return labels[action] || action
}

/**
 * Get action label in English
 */
export function getActionLabel(action: AuditAction): string {
  const labels: Record<AuditAction, string> = {
    create: 'Created',
    update: 'Updated',
    delete: 'Deleted',
    view: 'Viewed',
    export: 'Exported',
    login: 'Logged in',
    logout: 'Logged out',
    settings_change: 'Settings changed',
  }
  return labels[action] || action
}

/**
 * Get entity label in Spanish
 */
export function getEntityLabelES(entity: AuditEntity): string {
  const labels: Record<AuditEntity, string> = {
    lead: 'Lead',
    patient: 'Paciente',
    appointment: 'Cita',
    treatment: 'Tratamiento',
    payment: 'Pago',
    user: 'Usuario',
    settings: 'Configuración',
    report: 'Reporte',
  }
  return labels[entity] || entity
}

/**
 * Get entity label in English
 */
export function getEntityLabel(entity: AuditEntity): string {
  const labels: Record<AuditEntity, string> = {
    lead: 'Lead',
    patient: 'Patient',
    appointment: 'Appointment',
    treatment: 'Treatment',
    payment: 'Payment',
    user: 'User',
    settings: 'Settings',
    report: 'Report',
  }
  return labels[entity] || entity
}

/**
 * Format changes for display
 */
export function formatChanges(
  changes: { field: string; oldValue: unknown; newValue: unknown }[],
  language: 'en' | 'es' = 'en'
): string[] {
  return changes.map(change => {
    const fieldLabel = language === 'es'
      ? change.field.replace(/_/g, ' ')
      : change.field.replace(/_/g, ' ')

    const oldVal = change.oldValue !== undefined && change.oldValue !== null
      ? String(change.oldValue)
      : (language === 'es' ? '(vacío)' : '(empty)')

    const newVal = change.newValue !== undefined && change.newValue !== null
      ? String(change.newValue)
      : (language === 'es' ? '(vacío)' : '(empty)')

    return `${fieldLabel}: "${oldVal}" → "${newVal}"`
  })
}

/**
 * Clear all audit logs (for testing)
 */
export function clearAuditLogs(): void {
  auditLogs = []
}

/**
 * Initialize with some sample logs (for demo)
 */
export function initializeSampleLogs(currentUserId: string, currentUserName: string): void {
  const now = new Date()
  const sampleLogs: Omit<AuditLog, 'id'>[] = [
    {
      userId: currentUserId,
      userName: currentUserName,
      action: 'login',
      entity: 'user',
      timestamp: now,
    },
    {
      userId: currentUserId,
      userName: currentUserName,
      action: 'create',
      entity: 'patient',
      entityName: 'María García',
      timestamp: new Date(now.getTime() - 1000 * 60 * 30), // 30 min ago
    },
    {
      userId: currentUserId,
      userName: currentUserName,
      action: 'update',
      entity: 'lead',
      entityName: 'Juan Pérez',
      changes: [
        { field: 'status', oldValue: 'new', newValue: 'contacted' },
      ],
      timestamp: new Date(now.getTime() - 1000 * 60 * 60), // 1 hour ago
    },
    {
      userId: currentUserId,
      userName: currentUserName,
      action: 'create',
      entity: 'appointment',
      entityName: 'Consulta - Ana López',
      timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 2), // 2 hours ago
    },
    {
      userId: currentUserId,
      userName: currentUserName,
      action: 'create',
      entity: 'payment',
      entityName: '$5,000 - Tratamiento Facial',
      timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 3), // 3 hours ago
    },
  ]

  sampleLogs.forEach(log => {
    createAuditLog(
      log.userId,
      log.userName,
      log.action,
      log.entity,
      {
        entityId: log.entityId,
        entityName: log.entityName,
        changes: log.changes,
      }
    )
  })
}
