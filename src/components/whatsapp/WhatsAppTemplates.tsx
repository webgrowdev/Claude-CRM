'use client'

import { useState, useMemo } from 'react'
import {
  MessageCircle,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Send,
  Check,
  X,
  MessageSquare,
  Calendar,
  Bell,
  UserPlus,
  CreditCard,
  Settings,
} from 'lucide-react'
import { Button, Modal, Input, Select, TextArea } from '@/components/ui'
import { useLanguage } from '@/i18n/LanguageContext'
import { WhatsAppTemplate } from '@/types'
import { cn } from '@/lib/utils'

interface WhatsAppTemplatesProps {
  templates: WhatsAppTemplate[]
  onSaveTemplate: (template: Omit<WhatsAppTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void
  onUpdateTemplate: (id: string, template: Partial<WhatsAppTemplate>) => void
  onDeleteTemplate: (id: string) => void
  onSendMessage?: (templateId: string, variables: Record<string, string>) => void
}

const categoryIcons: Record<WhatsAppTemplate['category'], React.ReactNode> = {
  greeting: <MessageSquare className="w-4 h-4" />,
  appointment: <Calendar className="w-4 h-4" />,
  reminder: <Bell className="w-4 h-4" />,
  followup: <UserPlus className="w-4 h-4" />,
  payment: <CreditCard className="w-4 h-4" />,
  custom: <Settings className="w-4 h-4" />,
}

const categoryColors: Record<WhatsAppTemplate['category'], string> = {
  greeting: 'bg-blue-100 text-blue-700',
  appointment: 'bg-purple-100 text-purple-700',
  reminder: 'bg-amber-100 text-amber-700',
  followup: 'bg-green-100 text-green-700',
  payment: 'bg-emerald-100 text-emerald-700',
  custom: 'bg-slate-100 text-slate-700',
}

// Default templates for new users
const getDefaultTemplates = (language: string): Omit<WhatsAppTemplate, 'id' | 'createdAt' | 'updatedAt'>[] => {
  if (language === 'es') {
    return [
      {
        name: 'Bienvenida',
        category: 'greeting',
        content: '¡Hola {{name}}! 👋 Gracias por contactarnos. Soy de {{clinic}}. ¿En qué podemos ayudarte hoy?',
        variables: ['name', 'clinic'],
        active: true,
      },
      {
        name: 'Confirmación de Cita',
        category: 'appointment',
        content: '¡Hola {{name}}! Te confirmamos tu cita para {{treatment}} el día {{date}} a las {{time}}. Te esperamos en {{clinic}}. ¿Tienes alguna pregunta?',
        variables: ['name', 'treatment', 'date', 'time', 'clinic'],
        active: true,
      },
      {
        name: 'Recordatorio 24h',
        category: 'reminder',
        content: '¡Hola {{name}}! 🔔 Te recordamos que mañana tienes tu cita a las {{time}} para {{treatment}}. ¡Te esperamos!',
        variables: ['name', 'time', 'treatment'],
        active: true,
      },
      {
        name: 'Seguimiento Post-Cita',
        category: 'followup',
        content: '¡Hola {{name}}! Esperamos que te encuentres bien después de tu {{treatment}}. ¿Cómo te has sentido? Cualquier duda, estamos aquí para ayudarte. 💪',
        variables: ['name', 'treatment'],
        active: true,
      },
      {
        name: 'Recordatorio de Pago',
        category: 'payment',
        content: 'Hola {{name}}, te recordamos que tienes un pago pendiente de ${{amount}} por tu {{treatment}}. ¿Necesitas información sobre métodos de pago?',
        variables: ['name', 'amount', 'treatment'],
        active: true,
      },
    ]
  }
  return [
    {
      name: 'Welcome',
      category: 'greeting',
      content: 'Hi {{name}}! 👋 Thanks for contacting us. I\'m from {{clinic}}. How can we help you today?',
      variables: ['name', 'clinic'],
      active: true,
    },
    {
      name: 'Appointment Confirmation',
      category: 'appointment',
      content: 'Hi {{name}}! We confirm your appointment for {{treatment}} on {{date}} at {{time}}. We look forward to seeing you at {{clinic}}. Any questions?',
      variables: ['name', 'treatment', 'date', 'time', 'clinic'],
      active: true,
    },
    {
      name: '24h Reminder',
      category: 'reminder',
      content: 'Hi {{name}}! 🔔 Just a reminder that you have an appointment tomorrow at {{time}} for {{treatment}}. See you there!',
      variables: ['name', 'time', 'treatment'],
      active: true,
    },
    {
      name: 'Post-Appointment Follow-up',
      category: 'followup',
      content: 'Hi {{name}}! We hope you\'re doing well after your {{treatment}}. How have you been feeling? We\'re here if you have any questions. 💪',
      variables: ['name', 'treatment'],
      active: true,
    },
    {
      name: 'Payment Reminder',
      category: 'payment',
      content: 'Hi {{name}}, this is a reminder that you have a pending payment of ${{amount}} for your {{treatment}}. Need info about payment methods?',
      variables: ['name', 'amount', 'treatment'],
      active: true,
    },
  ]
}

export function WhatsAppTemplates({
  templates,
  onSaveTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onSendMessage,
}: WhatsAppTemplatesProps) {
  const { language } = useLanguage()
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null)
  const [editingTemplate, setEditingTemplate] = useState({
    name: '',
    category: 'custom' as WhatsAppTemplate['category'],
    content: '',
    active: true,
  })
  const [previewVariables, setPreviewVariables] = useState<Record<string, string>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<WhatsAppTemplate['category'] | 'all'>('all')

  const t = {
    title: language === 'es' ? 'Plantillas de WhatsApp' : 'WhatsApp Templates',
    addTemplate: language === 'es' ? 'Nueva Plantilla' : 'New Template',
    editTemplate: language === 'es' ? 'Editar Plantilla' : 'Edit Template',
    name: language === 'es' ? 'Nombre' : 'Name',
    category: language === 'es' ? 'Categoría' : 'Category',
    content: language === 'es' ? 'Contenido' : 'Content',
    variables: language === 'es' ? 'Variables' : 'Variables',
    variablesHelp: language === 'es'
      ? 'Usa {{variable}} para insertar datos dinámicos'
      : 'Use {{variable}} to insert dynamic data',
    preview: language === 'es' ? 'Vista Previa' : 'Preview',
    send: language === 'es' ? 'Enviar' : 'Send',
    copy: language === 'es' ? 'Copiar' : 'Copy',
    copied: language === 'es' ? 'Copiado' : 'Copied',
    delete: language === 'es' ? 'Eliminar' : 'Delete',
    save: language === 'es' ? 'Guardar' : 'Save',
    cancel: language === 'es' ? 'Cancelar' : 'Cancel',
    active: language === 'es' ? 'Activo' : 'Active',
    inactive: language === 'es' ? 'Inactivo' : 'Inactive',
    noTemplates: language === 'es' ? 'No hay plantillas' : 'No templates',
    createFirst: language === 'es' ? 'Crea tu primera plantilla' : 'Create your first template',
    categories: {
      all: language === 'es' ? 'Todas' : 'All',
      greeting: language === 'es' ? 'Bienvenida' : 'Greeting',
      appointment: language === 'es' ? 'Cita' : 'Appointment',
      reminder: language === 'es' ? 'Recordatorio' : 'Reminder',
      followup: language === 'es' ? 'Seguimiento' : 'Follow-up',
      payment: language === 'es' ? 'Pago' : 'Payment',
      custom: language === 'es' ? 'Personalizado' : 'Custom',
    },
    fillVariables: language === 'es' ? 'Completa las variables' : 'Fill in the variables',
  }

  const filteredTemplates = useMemo(() => {
    if (filterCategory === 'all') return templates
    return templates.filter(t => t.category === filterCategory)
  }, [templates, filterCategory])

  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{\{(\w+)\}\}/g) || []

    const unique = new Set(
      matches.map((m) => m.replace(/[{}]/g, ''))
    )

    return Array.from(unique)
  }


  const handleOpenNew = () => {
    setSelectedTemplate(null)
    setEditingTemplate({
      name: '',
      category: 'custom',
      content: '',
      active: true,
    })
    setShowEditModal(true)
  }

  const handleOpenEdit = (template: WhatsAppTemplate) => {
    setSelectedTemplate(template)
    setEditingTemplate({
      name: template.name,
      category: template.category,
      content: template.content,
      active: template.active,
    })
    setShowEditModal(true)
  }

  const handleSaveTemplate = () => {
    const variables = extractVariables(editingTemplate.content)

    if (selectedTemplate) {
      onUpdateTemplate(selectedTemplate.id, {
        ...editingTemplate,
        variables,
      })
    } else {
      onSaveTemplate({
        ...editingTemplate,
        variables,
      })
    }
    setShowEditModal(false)
  }

  const handlePreview = (template: WhatsAppTemplate) => {
    setSelectedTemplate(template)
    const initialVars: Record<string, string> = {}
    template.variables.forEach(v => {
      initialVars[v] = ''
    })
    setPreviewVariables(initialVars)
    setShowPreviewModal(true)
  }

  const getPreviewContent = () => {
    if (!selectedTemplate) return ''
    let content = selectedTemplate.content
    Object.entries(previewVariables).forEach(([key, value]) => {
      content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || `[${key}]`)
    })
    return content
  }

  const handleCopy = (template: WhatsAppTemplate) => {
    let content = template.content
    // Replace variables with placeholder text for quick editing
    template.variables.forEach(v => {
      content = content.replace(new RegExp(`\\{\\{${v}\\}\\}`, 'g'), `[${v}]`)
    })
    navigator.clipboard.writeText(content)
    setCopiedId(template.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-green-100 rounded-lg">
            <MessageCircle className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="font-semibold text-slate-800">{t.title}</h3>
        </div>
        <Button size="sm" onClick={handleOpenNew}>
          <Plus className="w-4 h-4 mr-1" />
          {t.addTemplate}
        </Button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['all', 'greeting', 'appointment', 'reminder', 'followup', 'payment', 'custom'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all',
              filterCategory === cat
                ? 'bg-green-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            {t.categories[cat]}
          </button>
        ))}
      </div>

      {/* Templates List */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-8">
          <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">{t.noTemplates}</p>
          <button
            onClick={handleOpenNew}
            className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            {t.createFirst}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className={cn(
                'p-4 border rounded-xl transition-all',
                template.active
                  ? 'bg-white border-slate-200 hover:border-slate-300'
                  : 'bg-slate-50 border-slate-200 opacity-60'
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      'p-1.5 rounded-lg',
                      categoryColors[template.category]
                    )}>
                      {categoryIcons[template.category]}
                    </span>
                    <h4 className="font-medium text-slate-800">{template.name}</h4>
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      template.active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-200 text-slate-500'
                    )}>
                      {template.active ? t.active : t.inactive}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">{template.content}</p>
                  {template.variables.length > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-xs text-slate-400">{t.variables}:</span>
                      {template.variables.map((v) => (
                        <span
                          key={v}
                          className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-xs rounded"
                        >
                          {`{{${v}}}`}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleCopy(template)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title={t.copy}
                  >
                    {copiedId === template.id ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handlePreview(template)}
                    className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title={t.preview}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(template)}
                    className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title={t.editTemplate}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteTemplate(template.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title={t.delete}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit/Create Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={selectedTemplate ? t.editTemplate : t.addTemplate}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label={t.name}
            value={editingTemplate.name}
            onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
            placeholder={language === 'es' ? 'Nombre de la plantilla' : 'Template name'}
            required
          />

          <Select
            label={t.category}
            value={editingTemplate.category}
            onChange={(value) => setEditingTemplate({
              ...editingTemplate,
              category: value as WhatsAppTemplate['category']
            })}
            options={[
              { value: 'greeting', label: t.categories.greeting },
              { value: 'appointment', label: t.categories.appointment },
              { value: 'reminder', label: t.categories.reminder },
              { value: 'followup', label: t.categories.followup },
              { value: 'payment', label: t.categories.payment },
              { value: 'custom', label: t.categories.custom },
            ]}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.content}</label>
            <TextArea
              value={editingTemplate.content}
              onChange={(e) => setEditingTemplate({ ...editingTemplate, content: e.target.value })}
              placeholder={language === 'es'
                ? 'Hola {{name}}, gracias por contactarnos...'
                : 'Hi {{name}}, thanks for contacting us...'}
              className="min-h-[120px]"
            />
            <p className="text-xs text-slate-500 mt-1">{t.variablesHelp}</p>
          </div>

          {editingTemplate.content && (
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs font-medium text-slate-500 mb-1">{t.variables}:</p>
              <div className="flex flex-wrap gap-1">
                {extractVariables(editingTemplate.content).map((v) => (
                  <span
                    key={v}
                    className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full"
                  >
                    {`{{${v}}}`}
                  </span>
                ))}
                {extractVariables(editingTemplate.content).length === 0 && (
                  <span className="text-xs text-slate-400">
                    {language === 'es' ? 'Sin variables' : 'No variables'}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" fullWidth onClick={() => setShowEditModal(false)}>
              {t.cancel}
            </Button>
            <Button fullWidth onClick={handleSaveTemplate}>
              {t.save}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title={t.preview}
      >
        {selectedTemplate && (
          <div className="space-y-4">
            {selectedTemplate.variables.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-700">{t.fillVariables}:</p>
                {selectedTemplate.variables.map((v) => (
                  <Input
                    key={v}
                    label={v}
                    value={previewVariables[v] || ''}
                    onChange={(e) => setPreviewVariables({
                      ...previewVariables,
                      [v]: e.target.value
                    })}
                    placeholder={`Enter ${v}`}
                  />
                ))}
              </div>
            )}

            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-500 rounded-full">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-800 whitespace-pre-wrap">
                    {getPreviewContent()}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" fullWidth onClick={() => setShowPreviewModal(false)}>
                {t.cancel}
              </Button>
              <Button
                fullWidth
                onClick={() => {
                  handleCopy(selectedTemplate)
                  setShowPreviewModal(false)
                }}
              >
                <Copy className="w-4 h-4 mr-2" />
                {t.copy}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export { getDefaultTemplates }
