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
import { useLanguage } from '@/i18n/LanguageContext'
import { formatCurrency } from '@/lib/utils'
import { Treatment } from '@/types'

export default function TreatmentsPage() {
  const { state, addTreatment, updateTreatment, deleteTreatment } = useApp()
  const { t, language } = useLanguage()

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
    duration: '', // Default videocall duration
    inPersonDuration: '', // In-person appointment duration
    description: '',
  })

  // Categories with translations
  const categories = useMemo(() => [
    { id: 'all', label: t.treatments.categories.all },
    { id: 'Inyectables', label: t.treatments.categories.injectable },
    { id: 'Láser', label: t.treatments.categories.laser },
    { id: 'Facial', label: t.treatments.categories.facial },
    { id: 'Corporal', label: t.treatments.categories.body },
  ], [t])

  const filteredTreatments = useMemo(() => {
    let treatments = [...state.treatments]

    // Filter by category
    if (activeCategory !== 'all') {
      treatments = treatments.filter((tr) => tr.category === activeCategory)
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      treatments = treatments.filter(
        (tr) =>
          tr.name.toLowerCase().includes(query) ||
          tr.category.toLowerCase().includes(query)
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
            : state.treatments.filter((tr) => tr.category === cat.id).length,
      })),
    [state.treatments, categories]
  )

  const handleAdd = () => {
    if (!formData.name || !formData.price) return

    const videocallDuration = parseInt(formData.duration) || 30
    const inPersonDuration = parseInt(formData.inPersonDuration) || videocallDuration

    addTreatment({
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price),
      duration: videocallDuration, // Default/videocall duration
      videocallDuration: videocallDuration,
      inPersonDuration: inPersonDuration,
      description: formData.description,
    })

    setFormData({
      name: '',
      category: 'Facial',
      price: '',
      duration: '',
      inPersonDuration: '',
      description: '',
    })
    setShowAddModal(false)
  }

  const handleEdit = () => {
    if (!selectedTreatment || !formData.name || !formData.price) return

    const videocallDuration = parseInt(formData.duration) || 30
    const inPersonDuration = parseInt(formData.inPersonDuration) || videocallDuration

    updateTreatment({
      ...selectedTreatment,
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price),
      duration: videocallDuration,
      videocallDuration: videocallDuration,
      inPersonDuration: inPersonDuration,
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
      duration: (treatment.videocallDuration || treatment.duration).toString(),
      inPersonDuration: (treatment.inPersonDuration || treatment.duration).toString(),
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
      .map((tr) => `• ${tr.name}: ${formatCurrency(tr.price)} (${tr.duration} min)`)
      .join('\n')

    const text = `*${t.treatments.title}*\n\n${treatmentList}\n\n_${t.treatments.contactForInfo}_`

    if (navigator.share) {
      try {
        await navigator.share({
          title: t.treatments.title,
          text: text,
        })
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(text)
      alert(t.treatments.copiedToClipboard)
    }
  }

  // Get category label for display
  const getCategoryLabel = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId)
    return cat ? cat.label : categoryId
  }

  return (
    <AppShell>
      <Header
        title={t.treatments.title}
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
                  inPersonDuration: '',
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
              placeholder={t.treatments.searchTreatments}
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
              {t.treatments.share}
            </Button>
            <Button
              onClick={() => {
                setFormData({
                  name: '',
                  category: 'Facial',
                  price: '',
                  duration: '',
                  inPersonDuration: '',
                  description: '',
                })
                setShowAddModal(true)
              }}
              icon={<Plus className="w-5 h-5" />}
            >
              {t.treatments.newTreatment}
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
              title={searchQuery ? t.common.noResults : t.treatments.noTreatments}
              description={
                searchQuery
                  ? t.treatments.tryAnotherSearch
                  : t.treatments.addFirstTreatment
              }
              action={
                !searchQuery
                  ? {
                      label: t.treatments.addTreatment,
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
                          {getCategoryLabel(treatment.category)}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {treatment.duration} {t.treatments.minutes}
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
            {t.treatments.shareList}
          </Button>
        </div>
      </PageContainer>

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={t.treatments.newTreatment}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleAdd()
          }}
          className="space-y-4"
        >
          <Input
            label={t.treatments.name}
            placeholder={t.treatments.namePlaceholder}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Select
            label={t.treatments.category}
            value={formData.category}
            onChange={(value) => setFormData({ ...formData, category: value })}
            options={categories
              .filter((c) => c.id !== 'all')
              .map((c) => ({ value: c.id, label: c.label }))}
          />

          <Input
            label={t.treatments.price}
            placeholder="0.00"
            type="number"
            value={formData.price}
            onChange={(e) =>
              setFormData({ ...formData, price: e.target.value })
            }
            required
          />

          {/* Duration Fields - Videocall and In-Person */}
          <div className="p-3 bg-slate-50 rounded-lg space-y-3">
            <p className="text-sm font-medium text-slate-700">
              {language === 'es' ? 'Duraciones' : 'Durations'}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={language === 'es' ? 'Videollamada (min)' : 'Videocall (min)'}
                placeholder="30"
                type="number"
                value={formData.duration}
                onChange={(e) =>
                  setFormData({ ...formData, duration: e.target.value })
                }
              />
              <Input
                label={language === 'es' ? 'Presencial (min)' : 'In-Person (min)'}
                placeholder="45"
                type="number"
                value={formData.inPersonDuration}
                onChange={(e) =>
                  setFormData({ ...formData, inPersonDuration: e.target.value })
                }
              />
            </div>
            <p className="text-xs text-slate-500">
              {language === 'es'
                ? 'Define la duración para cada tipo de cita'
                : 'Set duration for each appointment type'}
            </p>
          </div>

          <Input
            label={`${t.treatments.description} (${t.common.optional})`}
            placeholder={t.treatments.descriptionPlaceholder}
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
        title={t.treatments.editTreatment}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleEdit()
          }}
          className="space-y-4"
        >
          <Input
            label={t.treatments.name}
            placeholder={t.treatments.namePlaceholder}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Select
            label={t.treatments.category}
            value={formData.category}
            onChange={(value) => setFormData({ ...formData, category: value })}
            options={categories
              .filter((c) => c.id !== 'all')
              .map((c) => ({ value: c.id, label: c.label }))}
          />

          <Input
            label={t.treatments.price}
            placeholder="0.00"
            type="number"
            value={formData.price}
            onChange={(e) =>
              setFormData({ ...formData, price: e.target.value })
            }
            required
          />

          {/* Duration Fields - Videocall and In-Person */}
          <div className="p-3 bg-slate-50 rounded-lg space-y-3">
            <p className="text-sm font-medium text-slate-700">
              {language === 'es' ? 'Duraciones' : 'Durations'}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={language === 'es' ? 'Videollamada (min)' : 'Videocall (min)'}
                placeholder="30"
                type="number"
                value={formData.duration}
                onChange={(e) =>
                  setFormData({ ...formData, duration: e.target.value })
                }
              />
              <Input
                label={language === 'es' ? 'Presencial (min)' : 'In-Person (min)'}
                placeholder="45"
                type="number"
                value={formData.inPersonDuration}
                onChange={(e) =>
                  setFormData({ ...formData, inPersonDuration: e.target.value })
                }
              />
            </div>
            <p className="text-xs text-slate-500">
              {language === 'es'
                ? 'Define la duración para cada tipo de cita'
                : 'Set duration for each appointment type'}
            </p>
          </div>

          <Input
            label={`${t.treatments.description} (${t.common.optional})`}
            placeholder={t.treatments.descriptionPlaceholder}
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
        title={t.treatments.deleteTreatment}
        size="sm"
      >
        <p className="text-slate-600 mb-6">
          {t.treatments.deleteConfirm}{' '}
          <strong>{selectedTreatment?.name}</strong>?
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            fullWidth
            onClick={() => setShowDeleteConfirm(false)}
          >
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
