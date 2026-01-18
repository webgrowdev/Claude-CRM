'use client'

import { useState } from 'react'
import { GripVertical, Plus, Edit, Trash2, Check, X } from 'lucide-react'
import { Header, PageContainer, AppShell } from '@/components/layout'
import { Card, Button, Input, Modal } from '@/components/ui'
import { useLanguage } from '@/i18n'

interface PipelineStage {
  id: string
  name: string
  color: string
  order: number
  isDefault?: boolean
}

const defaultStages: PipelineStage[] = [
  { id: 'new', name: 'Nuevo', color: '#3B82F6', order: 0, isDefault: true },
  { id: 'contacted', name: 'Contactado', color: '#F59E0B', order: 1, isDefault: true },
  { id: 'scheduled', name: 'Agendado', color: '#8B5CF6', order: 2, isDefault: true },
  { id: 'attended', name: 'Asistió', color: '#14B8A6', order: 3, isDefault: true },
  { id: 'closed', name: 'Cerrado', color: '#22C55E', order: 4, isDefault: true },
  { id: 'lost', name: 'Perdido', color: '#6B7280', order: 5, isDefault: true },
]

const colorOptions = [
  '#3B82F6', // Blue
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#14B8A6', // Teal
  '#22C55E', // Green
  '#EF4444', // Red
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#F97316', // Orange
  '#6B7280', // Gray
]

export default function PipelinePage() {
  const { t } = useLanguage()
  const [stages, setStages] = useState<PipelineStage[]>(defaultStages)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedStage, setSelectedStage] = useState<PipelineStage | null>(null)
  const [formData, setFormData] = useState({ name: '', color: '#3B82F6' })
  const [saved, setSaved] = useState(false)

  const handleAdd = () => {
    if (!formData.name) return

    const newStage: PipelineStage = {
      id: Date.now().toString(),
      name: formData.name,
      color: formData.color,
      order: stages.length,
    }

    setStages([...stages, newStage])
    setFormData({ name: '', color: '#3B82F6' })
    setShowAddModal(false)
  }

  const handleEdit = () => {
    if (!selectedStage || !formData.name) return

    setStages(stages.map(s =>
      s.id === selectedStage.id
        ? { ...s, name: formData.name, color: formData.color }
        : s
    ))
    setShowEditModal(false)
    setSelectedStage(null)
  }

  const handleDelete = () => {
    if (!selectedStage) return

    setStages(stages.filter(s => s.id !== selectedStage.id))
    setShowDeleteConfirm(false)
    setSelectedStage(null)
  }

  const openEdit = (stage: PipelineStage) => {
    setSelectedStage(stage)
    setFormData({ name: stage.name, color: stage.color })
    setShowEditModal(true)
  }

  const openDelete = (stage: PipelineStage) => {
    setSelectedStage(stage)
    setShowDeleteConfirm(true)
  }

  const handleSave = () => {
    // In a real app, this would save to API
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const moveStage = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= stages.length) return

    const newStages = [...stages]
    const temp = newStages[index]
    newStages[index] = newStages[newIndex]
    newStages[newIndex] = temp

    // Update order values
    newStages.forEach((s, i) => s.order = i)
    setStages(newStages)
  }

  return (
    <AppShell>
      <Header
        title={t.settings.pipelineStages}
        showBack
        rightContent={
          <button
            onClick={() => {
              setFormData({ name: '', color: '#3B82F6' })
              setShowAddModal(true)
            }}
            className="p-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        }
      />

      <PageContainer>
        <div className="lg:max-w-2xl lg:mx-auto">
          {/* Info */}
          <Card className="bg-slate-50 mb-6">
            <p className="text-sm text-slate-600">
              {t.settings.pipelineDescription}
            </p>
          </Card>

          {/* Desktop Header */}
          <div className="hidden lg:flex lg:items-center lg:justify-between lg:mb-4">
            <h2 className="text-lg font-semibold text-slate-800">{t.settings.stages}</h2>
            <Button
              onClick={() => {
                setFormData({ name: '', color: '#3B82F6' })
                setShowAddModal(true)
              }}
              icon={<Plus className="w-5 h-5" />}
            >
              {t.settings.addStage}
            </Button>
          </div>

          {/* Stages List */}
          <Card padding="none">
            <div className="divide-y divide-slate-100">
              {stages.map((stage, index) => (
                <div key={stage.id} className="flex items-center gap-3 p-4">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveStage(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveStage(index, 'down')}
                      disabled={index === stages.length - 1}
                      className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: stage.color }}
                  />

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800">{stage.name}</p>
                    {stage.isDefault && (
                      <p className="text-xs text-slate-400">{t.settings.defaultStage}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(stage)}
                      className="p-2 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {!stage.isDefault && (
                      <button
                        onClick={() => openDelete(stage)}
                        className="p-2 rounded-lg text-slate-400 hover:text-error-600 hover:bg-error-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Save Button */}
          <div className="mt-6">
            <Button fullWidth onClick={handleSave}>
              {saved ? t.common.saved : t.common.save}
            </Button>
          </div>
        </div>
      </PageContainer>

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={t.settings.addStage}
      >
        <form onSubmit={(e) => { e.preventDefault(); handleAdd(); }} className="space-y-4">
          <Input
            label={t.settings.stageName}
            placeholder={t.settings.stageNamePlaceholder}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t.settings.stageColor}
            </label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 rounded-lg transition-transform ${
                    formData.color === color ? 'ring-2 ring-offset-2 ring-primary-500 scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                >
                  {formData.color === color && (
                    <Check className="w-4 h-4 text-white mx-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" fullWidth onClick={() => setShowAddModal(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" fullWidth>
              {t.common.add}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={t.settings.editStage}
      >
        <form onSubmit={(e) => { e.preventDefault(); handleEdit(); }} className="space-y-4">
          <Input
            label={t.settings.stageName}
            placeholder={t.settings.stageNamePlaceholder}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t.settings.stageColor}
            </label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 rounded-lg transition-transform ${
                    formData.color === color ? 'ring-2 ring-offset-2 ring-primary-500 scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                >
                  {formData.color === color && (
                    <Check className="w-4 h-4 text-white mx-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" fullWidth onClick={() => setShowEditModal(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" fullWidth>
              {t.common.save}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title={t.settings.deleteStage}
        size="sm"
      >
        <p className="text-slate-600 mb-6">
          {t.settings.deleteStageConfirm} <strong>{selectedStage?.name}</strong>?
        </p>
        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={() => setShowDeleteConfirm(false)}>
            {t.common.cancel}
          </Button>
          <Button variant="danger" fullWidth onClick={handleDelete}>
            {t.common.delete}
          </Button>
        </div>
      </Modal>
    </AppShell>
  )
}
