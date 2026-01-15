'use client'

import { useState, useMemo } from 'react'
import {
  Search,
  Plus,
  ChevronRight,
  Share2,
  Edit,
  Trash2,
  Clock,
} from 'lucide-react'
import { Header, PageContainer, AppShell } from '@/components/layout'
import {
  Input,
  Card,
  Badge,
  Tabs,
  EmptyState,
  Modal,
  Button,
  Select,
} from '@/components/ui'
import { useApp } from '@/contexts/AppContext'
import { formatCurrency } from '@/lib/utils'
import { Treatment } from '@/types'

const categories = [
  { id: 'all', label: 'Todos' },
  { id: 'Inyectables', label: 'Inyectables' },
  { id: 'Láser', label: 'Láser' },
  { id: 'Facial', label: 'Facial' },
  { id: 'Corporal', label: 'Corporal' },
]

export default function TreatmentsPage() {
  const { state, addTreatment, updateTreatment, deleteTreatment } = useApp()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(
    null
  )
  const [formData, setFormData] = useState({
    name: '',
    category: 'Facial',
    price: '',
    duration: '',
    description: '',
  })

  const filteredTreatments = useMemo(() => {
    let treatments = [...state.treatments]

    // Filter by category
    if (activeCategory !== 'all') {
      treatments = treatments.filter((t) => t.category === activeCategory)
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      treatments = treatments.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query)
      )
    }

    return treatments
  }, [state.treatments, activeCategory, searchQuery])

  const categoriesWithCounts = useMemo(
    () =>
      categories.map((cat) => ({
        ...cat,
        count:
          cat.id === 'all'
            ? state.treatments.length
            : state.treatments.filter((t) => t.category === cat.id).length,
      })),
    [state.treatments]
  )

  const handleAdd = () => {
    if (!formData.name || !formData.price) return

    addTreatment({
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price),
      duration: parseInt(formData.duration) || 30,
      description: formData.description,
    })

    setFormData({
      name: '',
      category: 'Facial',
      price: '',
      duration: '',
      description: '',
    })
    setShowAddModal(false)
  }

  const handleEdit = () => {
    if (!selectedTreatment || !formData.name || !formData.price) return

    updateTreatment({
      ...selectedTreatment,
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price),
      duration: parseInt(formData.duration) || 30,
      description: formData.description,
    })

    setShowEditModal(false)
    setSelectedTreatment(null)
  }

  const handleDelete = () => {
    if (!selectedTreatment) return
    deleteTreatment(selectedTreatment.id)
    setShowDeleteConfirm(false)
    setSelectedTreatment(null)
  }

  const openEdit = (treatment: Treatment) => {
    setSelectedTreatment(treatment)
    setFormData({
      name: treatment.name,
      category: treatment.category,
      price: treatment.price.toString(),
      duration: treatment.duration.toString(),
      description: treatment.description || '',
    })
    setShowEditModal(true)
  }

  const openDelete = (treatment: Treatment) => {
    setSelectedTreatment(treatment)
    setShowDeleteConfirm(true)
  }

  const handleShare = async () => {
    const treatmentList = state.treatments
      .map((t) => `• ${t.name}: ${formatCurrency(t.price)} (${t.duration} min)`)
      .join('\n')

    const text = `*Lista de Tratamientos*\n\n${treatmentList}\n\n_Contáctanos para más información_`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Lista de Tratamientos',
          text: text,
        })
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(text)
      alert('Lista copiada al portapapeles')
    }
  }

  return (
    <AppShell>
      <Header
        title="Tratamientos"
        showBack
        rightContent={
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setFormData({
                  name: '',
                  category: 'Facial',
                  price: '',
                  duration: '',
                  description: '',
                })
                setShowAddModal(true)
              }}
              className="p-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        }
      />

      <PageContainer noPadding>
        {/* Desktop Header */}
        <div className="px-4 pt-4 lg:flex lg:items-center lg:justify-between lg:gap-4">
          <div className="lg:flex-1 lg:max-w-md">
            <Input
              placeholder="Buscar tratamientos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-5 h-5" />}
            />
          </div>
          <div className="hidden lg:flex lg:items-center lg:gap-2">
            <Button
              variant="outline"
              onClick={handleShare}
              icon={<Share2 className="w-5 h-5" />}
            >
              Compartir
            </Button>
            <Button
              onClick={() => {
                setFormData({
                  name: '',
                  category: 'Facial',
                  price: '',
                  duration: '',
                  description: '',
                })
                setShowAddModal(true)
              }}
              icon={<Plus className="w-5 h-5" />}
            >
              Nuevo Tratamiento
            </Button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-4 mt-4">
          <Tabs
            tabs={categoriesWithCounts}
            activeTab={activeCategory}
            onChange={setActiveCategory}
          />
        </div>

        {/* Treatment List */}
        <div className="px-4 mt-4 pb-24 lg:pb-8">
          {filteredTreatments.length === 0 ? (
            <EmptyState
              icon={<Clock className="w-8 h-8" />}
              title={searchQuery ? 'Sin resultados' : 'Sin tratamientos'}
              description={
                searchQuery
                  ? 'Intenta con otra búsqueda'
                  : 'Agrega tu primer tratamiento'
              }
              action={
                !searchQuery
                  ? {
                      label: 'Agregar Tratamiento',
                      onClick: () => setShowAddModal(true),
                    }
                  : undefined
              }
            />
          ) : (
            <Card padding="none">
              <div className="divide-y divide-slate-100">
                {filteredTreatments.map((treatment) => (
                  <div
                    key={treatment.id}
                    className="flex items-center gap-3 p-4"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 truncate">
                        {treatment.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" size="sm">
                          {treatment.category}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {treatment.duration} min
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary-600">
                        {formatCurrency(treatment.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(treatment)}
                        className="p-2 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDelete(treatment)}
                        className="p-2 rounded-lg text-slate-400 hover:text-error-600 hover:bg-error-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Share Button Fixed - Mobile only */}
        <div className="fixed bottom-6 left-4 right-4 lg:hidden">
          <Button
            fullWidth
            onClick={handleShare}
            icon={<Share2 className="w-5 h-5" />}
          >
            Compartir Lista de Precios
          </Button>
        </div>
      </PageContainer>

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Nuevo Tratamiento"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleAdd()
          }}
          className="space-y-4"
        >
          <Input
            label="Nombre"
            placeholder="Ej: Botox - Frente"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Select
            label="Categoría"
            value={formData.category}
            onChange={(value) => setFormData({ ...formData, category: value })}
            options={categories
              .filter((c) => c.id !== 'all')
              .map((c) => ({ value: c.id, label: c.label }))}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Precio"
              placeholder="0.00"
              type="number"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              required
            />
            <Input
              label="Duración (min)"
              placeholder="30"
              type="number"
              value={formData.duration}
              onChange={(e) =>
                setFormData({ ...formData, duration: e.target.value })
              }
            />
          </div>

          <Input
            label="Descripción (opcional)"
            placeholder="Breve descripción del tratamiento"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={() => setShowAddModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" fullWidth>
              Agregar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Tratamiento"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleEdit()
          }}
          className="space-y-4"
        >
          <Input
            label="Nombre"
            placeholder="Ej: Botox - Frente"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Select
            label="Categoría"
            value={formData.category}
            onChange={(value) => setFormData({ ...formData, category: value })}
            options={categories
              .filter((c) => c.id !== 'all')
              .map((c) => ({ value: c.id, label: c.label }))}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Precio"
              placeholder="0.00"
              type="number"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              required
            />
            <Input
              label="Duración (min)"
              placeholder="30"
              type="number"
              value={formData.duration}
              onChange={(e) =>
                setFormData({ ...formData, duration: e.target.value })
              }
            />
          </div>

          <Input
            label="Descripción (opcional)"
            placeholder="Breve descripción del tratamiento"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={() => setShowEditModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" fullWidth>
              Guardar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Eliminar Tratamiento"
        size="sm"
      >
        <p className="text-slate-600 mb-6">
          ¿Estás seguro de que deseas eliminar{' '}
          <strong>{selectedTreatment?.name}</strong>?
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            fullWidth
            onClick={() => setShowDeleteConfirm(false)}
          >
            Cancelar
          </Button>
          <Button variant="danger" fullWidth onClick={handleDelete}>
            Eliminar
          </Button>
        </div>
      </Modal>
    </AppShell>
  )
}
