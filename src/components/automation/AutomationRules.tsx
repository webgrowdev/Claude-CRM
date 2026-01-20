'use client'

import { useState } from 'react'
import {
  Zap,
  Plus,
  Trash2,
  Clock,
  MessageCircle,
  Mail,
  Phone,
  Bell,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  Edit2,
  Copy,
  Settings,
  Users,
  Calendar,
  Target,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, Card, Modal, Input, Select, Badge } from '@/components/ui'
import { useLanguage } from '@/i18n/LanguageContext'

// Types
export type AutomationTrigger =
  | 'lead_created'
  | 'lead_status_changed'
  | 'no_response_24h'
  | 'no_response_48h'
  | 'appointment_scheduled'
  | 'appointment_completed'
  | 'appointment_cancelled'

export type AutomationAction =
  | 'send_whatsapp'
  | 'send_email'
  | 'schedule_call'
  | 'create_task'
  | 'change_status'
  | 'notify_team'

export interface AutomationRule {
  id: string
  name: string
  description?: string
  trigger: AutomationTrigger
  triggerConditions?: {
    status?: string
    source?: string
    treatment?: string
  }
  actions: Array<{
    type: AutomationAction
    delay?: number // minutes
    template?: string
    status?: string
    message?: string
  }>
  isActive: boolean
  createdAt: Date
  lastTriggered?: Date
  triggerCount: number
}

interface AutomationRulesProps {
  rules: AutomationRule[]
  onAddRule: (rule: Omit<AutomationRule, 'id' | 'createdAt' | 'triggerCount'>) => void
  onUpdateRule: (id: string, updates: Partial<AutomationRule>) => void
  onDeleteRule: (id: string) => void
  onToggleRule: (id: string) => void
}

export function AutomationRules({
  rules,
  onAddRule,
  onUpdateRule,
  onDeleteRule,
  onToggleRule,
}: AutomationRulesProps) {
  const { language } = useLanguage()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null)

  const t = {
    title: language === 'es' ? 'Automatizaciones' : 'Automations',
    subtitle: language === 'es' ? 'Configura acciones automáticas para tu flujo de trabajo' : 'Set up automatic actions for your workflow',
    addRule: language === 'es' ? 'Nueva regla' : 'New rule',
    noRules: language === 'es' ? 'No tienes automatizaciones configuradas' : 'No automations configured',
    noRulesDesc: language === 'es' ? 'Crea tu primera regla para automatizar tareas repetitivas' : 'Create your first rule to automate repetitive tasks',
    active: language === 'es' ? 'Activa' : 'Active',
    inactive: language === 'es' ? 'Inactiva' : 'Inactive',
    triggered: language === 'es' ? 'veces activada' : 'times triggered',
    lastTriggered: language === 'es' ? 'Última vez' : 'Last triggered',
    never: language === 'es' ? 'Nunca' : 'Never',
    delete: language === 'es' ? 'Eliminar' : 'Delete',
    edit: language === 'es' ? 'Editar' : 'Edit',
    duplicate: language === 'es' ? 'Duplicar' : 'Duplicate',
  }

  const triggerLabels: Record<AutomationTrigger, { label: string; icon: React.ReactNode }> = {
    lead_created: {
      label: language === 'es' ? 'Nuevo lead creado' : 'New lead created',
      icon: <Users className="w-4 h-4" />,
    },
    lead_status_changed: {
      label: language === 'es' ? 'Estado de lead cambiado' : 'Lead status changed',
      icon: <Target className="w-4 h-4" />,
    },
    no_response_24h: {
      label: language === 'es' ? 'Sin respuesta en 24h' : 'No response in 24h',
      icon: <Clock className="w-4 h-4" />,
    },
    no_response_48h: {
      label: language === 'es' ? 'Sin respuesta en 48h' : 'No response in 48h',
      icon: <Clock className="w-4 h-4" />,
    },
    appointment_scheduled: {
      label: language === 'es' ? 'Cita agendada' : 'Appointment scheduled',
      icon: <Calendar className="w-4 h-4" />,
    },
    appointment_completed: {
      label: language === 'es' ? 'Cita completada' : 'Appointment completed',
      icon: <Calendar className="w-4 h-4" />,
    },
    appointment_cancelled: {
      label: language === 'es' ? 'Cita cancelada' : 'Appointment cancelled',
      icon: <Calendar className="w-4 h-4" />,
    },
  }

  const actionLabels: Record<AutomationAction, { label: string; icon: React.ReactNode; color: string }> = {
    send_whatsapp: {
      label: language === 'es' ? 'Enviar WhatsApp' : 'Send WhatsApp',
      icon: <MessageCircle className="w-4 h-4" />,
      color: 'bg-green-100 text-green-600',
    },
    send_email: {
      label: language === 'es' ? 'Enviar email' : 'Send email',
      icon: <Mail className="w-4 h-4" />,
      color: 'bg-amber-100 text-amber-600',
    },
    schedule_call: {
      label: language === 'es' ? 'Programar llamada' : 'Schedule call',
      icon: <Phone className="w-4 h-4" />,
      color: 'bg-blue-100 text-blue-600',
    },
    create_task: {
      label: language === 'es' ? 'Crear tarea' : 'Create task',
      icon: <Clock className="w-4 h-4" />,
      color: 'bg-purple-100 text-purple-600',
    },
    change_status: {
      label: language === 'es' ? 'Cambiar estado' : 'Change status',
      icon: <Target className="w-4 h-4" />,
      color: 'bg-primary-100 text-primary-600',
    },
    notify_team: {
      label: language === 'es' ? 'Notificar equipo' : 'Notify team',
      icon: <Bell className="w-4 h-4" />,
      color: 'bg-red-100 text-red-600',
    },
  }

  const handleDuplicate = (rule: AutomationRule) => {
    onAddRule({
      name: `${rule.name} (${language === 'es' ? 'copia' : 'copy'})`,
      description: rule.description,
      trigger: rule.trigger,
      triggerConditions: rule.triggerConditions,
      actions: rule.actions,
      isActive: false,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            {t.title}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">{t.subtitle}</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-1" />
          {t.addRule}
        </Button>
      </div>

      {/* Rules List */}
      {rules.length === 0 ? (
        <Card className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
            <Zap className="w-8 h-8 text-amber-500" />
          </div>
          <h3 className="font-medium text-slate-800 mb-1">{t.noRules}</h3>
          <p className="text-sm text-slate-500 mb-4">{t.noRulesDesc}</p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-1" />
            {t.addRule}
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {rules.map(rule => {
            const trigger = triggerLabels[rule.trigger]

            return (
              <Card key={rule.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  {/* Toggle */}
                  <button
                    onClick={() => onToggleRule(rule.id)}
                    className="mt-1 text-slate-400 hover:text-primary-500 transition-colors"
                  >
                    {rule.isActive ? (
                      <ToggleRight className="w-8 h-8 text-green-500" />
                    ) : (
                      <ToggleLeft className="w-8 h-8" />
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-slate-800">{rule.name}</h3>
                      <Badge variant={rule.isActive ? 'success' : 'default'} className="text-xs">
                        {rule.isActive ? t.active : t.inactive}
                      </Badge>
                    </div>

                    {rule.description && (
                      <p className="text-sm text-slate-500 mb-3">{rule.description}</p>
                    )}

                    {/* Flow visualization */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Trigger */}
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 rounded-lg text-sm">
                        {trigger.icon}
                        <span className="text-slate-700">{trigger.label}</span>
                      </div>

                      <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0" />

                      {/* Actions */}
                      {rule.actions.map((action, index) => {
                        const actionInfo = actionLabels[action.type]
                        return (
                          <div key={index} className="flex items-center gap-2">
                            {index > 0 && <ArrowRight className="w-4 h-4 text-slate-400" />}
                            <div className={cn(
                              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm',
                              actionInfo.color
                            )}>
                              {actionInfo.icon}
                              <span>{actionInfo.label}</span>
                              {action.delay && action.delay > 0 && (
                                <span className="text-xs opacity-75">
                                  (+{action.delay}m)
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                      <span>{rule.triggerCount} {t.triggered}</span>
                      <span>
                        {t.lastTriggered}:{' '}
                        {rule.lastTriggered
                          ? new Date(rule.lastTriggered).toLocaleDateString()
                          : t.never}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingRule(rule)}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title={t.edit}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDuplicate(rule)}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title={t.duplicate}
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteRule(rule.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title={t.delete}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AutomationRuleModal
        isOpen={showCreateModal || !!editingRule}
        onClose={() => {
          setShowCreateModal(false)
          setEditingRule(null)
        }}
        rule={editingRule}
        onSave={(rule) => {
          if (editingRule) {
            onUpdateRule(editingRule.id, rule)
          } else {
            onAddRule(rule)
          }
          setShowCreateModal(false)
          setEditingRule(null)
        }}
      />
    </div>
  )
}

// Modal for creating/editing rules
interface AutomationRuleModalProps {
  isOpen: boolean
  onClose: () => void
  rule: AutomationRule | null
  onSave: (rule: Omit<AutomationRule, 'id' | 'createdAt' | 'triggerCount'>) => void
}

function AutomationRuleModal({ isOpen, onClose, rule, onSave }: AutomationRuleModalProps) {
  const { language } = useLanguage()
  const [name, setName] = useState(rule?.name || '')
  const [description, setDescription] = useState(rule?.description || '')
  const [trigger, setTrigger] = useState<AutomationTrigger>(rule?.trigger || 'lead_created')
  const [actions, setActions] = useState<AutomationRule['actions']>(
    rule?.actions || [{ type: 'send_whatsapp', delay: 0 }]
  )

  const t = {
    createTitle: language === 'es' ? 'Nueva automatización' : 'New automation',
    editTitle: language === 'es' ? 'Editar automatización' : 'Edit automation',
    name: language === 'es' ? 'Nombre' : 'Name',
    namePlaceholder: language === 'es' ? 'Ej: Bienvenida automática' : 'E.g.: Automatic welcome',
    description: language === 'es' ? 'Descripción (opcional)' : 'Description (optional)',
    trigger: language === 'es' ? 'Cuando...' : 'When...',
    actions: language === 'es' ? 'Entonces...' : 'Then...',
    addAction: language === 'es' ? 'Agregar acción' : 'Add action',
    delay: language === 'es' ? 'Retraso (minutos)' : 'Delay (minutes)',
    cancel: language === 'es' ? 'Cancelar' : 'Cancel',
    save: language === 'es' ? 'Guardar' : 'Save',
  }

  const triggerOptions = [
    { value: 'lead_created', label: language === 'es' ? 'Nuevo lead creado' : 'New lead created' },
    { value: 'lead_status_changed', label: language === 'es' ? 'Estado cambiado' : 'Status changed' },
    { value: 'no_response_24h', label: language === 'es' ? 'Sin respuesta 24h' : 'No response 24h' },
    { value: 'no_response_48h', label: language === 'es' ? 'Sin respuesta 48h' : 'No response 48h' },
    { value: 'appointment_scheduled', label: language === 'es' ? 'Cita agendada' : 'Appointment scheduled' },
    { value: 'appointment_completed', label: language === 'es' ? 'Cita completada' : 'Appointment completed' },
    { value: 'appointment_cancelled', label: language === 'es' ? 'Cita cancelada' : 'Appointment cancelled' },
  ]

  const actionOptions = [
    { value: 'send_whatsapp', label: language === 'es' ? 'Enviar WhatsApp' : 'Send WhatsApp' },
    { value: 'send_email', label: language === 'es' ? 'Enviar email' : 'Send email' },
    { value: 'schedule_call', label: language === 'es' ? 'Programar llamada' : 'Schedule call' },
    { value: 'create_task', label: language === 'es' ? 'Crear tarea' : 'Create task' },
    { value: 'change_status', label: language === 'es' ? 'Cambiar estado' : 'Change status' },
    { value: 'notify_team', label: language === 'es' ? 'Notificar equipo' : 'Notify team' },
  ]

  const handleAddAction = () => {
    setActions([...actions, { type: 'send_whatsapp', delay: 0 }])
  }

  const handleRemoveAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index))
  }

  const handleUpdateAction = (index: number, updates: Partial<AutomationRule['actions'][0]>) => {
    setActions(actions.map((action, i) => (i === index ? { ...action, ...updates } : action)))
  }

  const handleSave = () => {
    if (!name.trim()) return

    onSave({
      name,
      description: description || undefined,
      trigger,
      actions,
      isActive: rule?.isActive ?? true,
      lastTriggered: rule?.lastTriggered,
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={rule ? t.editTitle : t.createTitle}
      size="lg"
    >
      <div className="space-y-6">
        {/* Name */}
        <Input
          label={t.name}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.namePlaceholder}
        />

        {/* Description */}
        <Input
          label={t.description}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* Trigger */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {t.trigger}
          </label>
          <Select
            value={trigger}
            onChange={(value) => setTrigger(value as AutomationTrigger)}
            options={triggerOptions}
          />
        </div>

        {/* Actions */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {t.actions}
          </label>
          <div className="space-y-3">
            {actions.map((action, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="flex-1">
                  <Select
                    value={action.type}
                    onChange={(value) => handleUpdateAction(index, { type: value as AutomationAction })}
                    options={actionOptions}
                  />
                </div>
                <div className="w-24">
                  <Input
                    type="number"
                    value={action.delay || 0}
                    onChange={(e) => handleUpdateAction(index, { delay: parseInt(e.target.value) || 0 })}
                    placeholder={t.delay}
                  />
                </div>
                {actions.length > 1 && (
                  <button
                    onClick={() => handleRemoveAction(index)}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={handleAddAction}
          >
            <Plus className="w-4 h-4 mr-1" />
            {t.addAction}
          </Button>
        </div>

        {/* Footer */}
        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" fullWidth onClick={onClose}>
            {t.cancel}
          </Button>
          <Button fullWidth onClick={handleSave} disabled={!name.trim()}>
            {t.save}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// Preset automation templates
export const automationTemplates: Omit<AutomationRule, 'id' | 'createdAt' | 'triggerCount'>[] = [
  {
    name: 'Bienvenida automática',
    description: 'Envía un mensaje de bienvenida cuando se crea un nuevo lead',
    trigger: 'lead_created',
    actions: [
      { type: 'send_whatsapp', delay: 0, template: 'welcome' },
    ],
    isActive: false,
  },
  {
    name: 'Seguimiento 24h',
    description: 'Recordatorio si no hay respuesta en 24 horas',
    trigger: 'no_response_24h',
    actions: [
      { type: 'notify_team', delay: 0 },
      { type: 'send_whatsapp', delay: 30, template: 'followup_24h' },
    ],
    isActive: false,
  },
  {
    name: 'Confirmación de cita',
    description: 'Envía confirmación cuando se agenda una cita',
    trigger: 'appointment_scheduled',
    actions: [
      { type: 'send_whatsapp', delay: 0, template: 'appointment_confirmation' },
      { type: 'send_email', delay: 5, template: 'appointment_details' },
    ],
    isActive: false,
  },
  {
    name: 'Rescate de cita cancelada',
    description: 'Intenta reagendar cuando se cancela una cita',
    trigger: 'appointment_cancelled',
    actions: [
      { type: 'notify_team', delay: 0 },
      { type: 'schedule_call', delay: 60 },
    ],
    isActive: false,
  },
]
