'use client'

import { useState } from 'react'
import {
  CheckSquare,
  Square,
  X,
  Trash2,
  Tag,
  Download,
  MessageCircle,
  UserMinus,
  ChevronDown,
} from 'lucide-react'
import { Button, Modal, Select } from '@/components/ui'
import { useLanguage } from '@/i18n/LanguageContext'
import { FunnelStatus } from '@/types'
import { cn } from '@/lib/utils'

interface BulkActionsBarProps {
  selectedCount: number
  totalCount: number
  onSelectAll: () => void
  onDeselectAll: () => void
  isAllSelected: boolean
  onChangeStatus?: (status: FunnelStatus) => void
  onDelete?: () => void
  onExport?: () => void
  onSendMessage?: () => void
  className?: string
}

export function BulkActionsBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  isAllSelected,
  onChangeStatus,
  onDelete,
  onExport,
  onSendMessage,
  className,
}: BulkActionsBarProps) {
  const { language } = useLanguage()
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<FunnelStatus>('contacted')

  const t = {
    selected: language === 'es' ? 'seleccionados' : 'selected',
    selectAll: language === 'es' ? 'Seleccionar todos' : 'Select all',
    deselectAll: language === 'es' ? 'Deseleccionar' : 'Deselect all',
    changeStatus: language === 'es' ? 'Cambiar estado' : 'Change status',
    delete: language === 'es' ? 'Eliminar' : 'Delete',
    export: language === 'es' ? 'Exportar' : 'Export',
    sendMessage: language === 'es' ? 'Enviar mensaje' : 'Send message',
    confirmDelete: language === 'es'
      ? `¿Estás seguro de eliminar ${selectedCount} pacientes?`
      : `Are you sure you want to delete ${selectedCount} patients?`,
    confirmDeleteWarning: language === 'es'
      ? 'Esta acción no se puede deshacer.'
      : 'This action cannot be undone.',
    cancel: language === 'es' ? 'Cancelar' : 'Cancel',
    confirm: language === 'es' ? 'Confirmar' : 'Confirm',
    newStatus: language === 'es' ? 'Nuevo estado' : 'New status',
    apply: language === 'es' ? 'Aplicar' : 'Apply',
    statuses: {
      new: language === 'es' ? 'Nuevo' : 'New',
      contacted: language === 'es' ? 'Contactado' : 'Contacted',
      scheduled: language === 'es' ? 'Agendado' : 'Scheduled',
      closed: language === 'es' ? 'Cerrado' : 'Closed',
      lost: language === 'es' ? 'Perdido' : 'Lost',
    },
  }

  if (selectedCount === 0) return null

  return (
    <>
      <div className={cn(
        'fixed bottom-20 lg:bottom-6 left-4 right-4 lg:left-auto lg:right-6 z-40',
        'bg-slate-800 text-white rounded-2xl shadow-2xl',
        'animate-slide-up',
        className
      )}>
        <div className="flex items-center justify-between p-3 lg:p-4 gap-3">
          {/* Selection info */}
          <div className="flex items-center gap-3">
            <button
              onClick={isAllSelected ? onDeselectAll : onSelectAll}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label={isAllSelected ? t.deselectAll : t.selectAll}
            >
              {isAllSelected ? (
                <CheckSquare className="w-5 h-5" />
              ) : (
                <Square className="w-5 h-5" />
              )}
            </button>
            <div>
              <p className="text-sm font-medium">
                {selectedCount} {t.selected}
              </p>
              <p className="text-xs text-slate-400">
                {language === 'es' ? `de ${totalCount}` : `of ${totalCount}`}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 lg:gap-2">
            {onChangeStatus && (
              <button
                onClick={() => setShowStatusModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Tag className="w-4 h-4" />
                <span className="hidden sm:inline">{t.changeStatus}</span>
              </button>
            )}

            {onSendMessage && (
              <button
                onClick={onSendMessage}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">{t.sendMessage}</span>
              </button>
            )}

            {onExport && (
              <button
                onClick={onExport}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">{t.export}</span>
              </button>
            )}

            {onDelete && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">{t.delete}</span>
              </button>
            )}

            <button
              onClick={onDeselectAll}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors ml-1"
              aria-label={t.deselectAll}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Change Status Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title={t.changeStatus}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {language === 'es'
              ? `Cambiar el estado de ${selectedCount} pacientes a:`
              : `Change status of ${selectedCount} patients to:`}
          </p>
          <Select
            label={t.newStatus}
            value={selectedStatus}
            onChange={(value) => setSelectedStatus(value as FunnelStatus)}
            options={[
              { value: 'new', label: t.statuses.new },
              { value: 'contacted', label: t.statuses.contacted },
              { value: 'scheduled', label: t.statuses.scheduled },
              { value: 'closed', label: t.statuses.closed },
              { value: 'lost', label: t.statuses.lost },
            ]}
          />
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setShowStatusModal(false)}>
              {t.cancel}
            </Button>
            <Button
              fullWidth
              onClick={() => {
                onChangeStatus?.(selectedStatus)
                setShowStatusModal(false)
              }}
            >
              {t.apply}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={t.delete}
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-800 font-medium">{t.confirmDelete}</p>
            <p className="text-sm text-red-600 mt-1">{t.confirmDeleteWarning}</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setShowDeleteModal(false)}>
              {t.cancel}
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={() => {
                onDelete?.()
                setShowDeleteModal(false)
              }}
            >
              {t.confirm}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

interface SelectableItemProps {
  isSelected: boolean
  onToggle: () => void
  showCheckbox?: boolean
  children: React.ReactNode
  className?: string
}

export function SelectableItem({
  isSelected,
  onToggle,
  showCheckbox = true,
  children,
  className,
}: SelectableItemProps) {
  return (
    <div className={cn(
      'relative',
      isSelected && 'bg-primary-50',
      className
    )}>
      {showCheckbox && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggle()
          }}
          className={cn(
            'absolute left-3 top-1/2 -translate-y-1/2 z-10',
            'w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all',
            isSelected
              ? 'bg-primary-500 border-primary-500 text-white'
              : 'bg-white border-slate-300 hover:border-primary-400'
          )}
        >
          {isSelected && <CheckSquare className="w-4 h-4" />}
        </button>
      )}
      <div className={cn(showCheckbox && 'pl-12')}>
        {children}
      </div>
    </div>
  )
}
