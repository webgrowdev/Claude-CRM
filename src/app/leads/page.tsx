'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search,
  Plus,
  ChevronRight,
  Instagram,
  MessageCircle,
  Phone,
  Globe,
  Users,
  HelpCircle
} from 'lucide-react'
import { Header, PageContainer, AppShell } from '@/components/layout'
import { Input, Card, Avatar, Badge, Tabs, EmptyState, Modal, Button, Select, TextArea } from '@/components/ui'
import { useApp } from '@/contexts/AppContext'
import { formatTimeAgo, getStatusLabel, getSourceLabel } from '@/lib/utils'
import { LeadStatus, LeadSource } from '@/types'

const statusTabs = [
  { id: 'all', label: 'Todos' },
  { id: 'new', label: 'Nuevos', color: '#6366F1' },
  { id: 'contacted', label: 'Contactados', color: '#F59E0B' },
  { id: 'scheduled', label: 'Agendados', color: '#8B5CF6' },
  { id: 'closed', label: 'Cerrados', color: '#10B981' },
  { id: 'lost', label: 'Perdidos', color: '#EF4444' },
]

export default function LeadsPage() {
  const router = useRouter()
  const { state, addLead } = useApp()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)

  // New lead form state
  const [newLead, setNewLead] = useState({
    name: '',
    phone: '',
    email: '',
    source: 'instagram' as LeadSource,
    treatments: [] as string[],
  })

  const filteredLeads = useMemo(() => {
    let leads = [...state.leads]

    // Filter by status
    if (activeTab !== 'all') {
      leads = leads.filter(l => l.status === activeTab)
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      leads = leads.filter(l =>
        l.name.toLowerCase().includes(query) ||
        l.phone.includes(query) ||
        l.email?.toLowerCase().includes(query)
      )
    }

    // Sort by date
    return leads.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [state.leads, activeTab, searchQuery])

  const tabsWithCounts = useMemo(() =>
    statusTabs.map(tab => ({
      ...tab,
      count: tab.id === 'all'
        ? state.leads.length
        : state.leads.filter(l => l.status === tab.id).length
    }))
  , [state.leads])

  const getSourceIcon = (source: LeadSource) => {
    const icons = {
      instagram: <Instagram className="w-4 h-4" />,
      whatsapp: <MessageCircle className="w-4 h-4" />,
      phone: <Phone className="w-4 h-4" />,
      website: <Globe className="w-4 h-4" />,
      referral: <Users className="w-4 h-4" />,
      other: <HelpCircle className="w-4 h-4" />,
    }
    return icons[source]
  }

  const handleAddLead = () => {
    if (!newLead.name || !newLead.phone) return

    addLead({
      name: newLead.name,
      phone: newLead.phone,
      email: newLead.email || undefined,
      source: newLead.source,
      status: 'new',
      treatments: newLead.treatments,
      assignedTo: state.user.id,
    })

    setNewLead({
      name: '',
      phone: '',
      email: '',
      source: 'instagram',
      treatments: [],
    })
    setShowAddModal(false)
  }

  return (
    <AppShell>
      <Header
        title="Leads"
        rightContent={
          <button
            onClick={() => setShowAddModal(true)}
            className="p-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        }
      />

      <PageContainer noPadding>
        {/* Desktop Header with Search */}
        <div className="px-4 pt-4 lg:flex lg:items-center lg:justify-between lg:gap-4">
          <div className="lg:flex-1 lg:max-w-md">
            <Input
              placeholder="Buscar leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-5 h-5" />}
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Nuevo Lead</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="px-4 mt-4">
          <Tabs
            tabs={tabsWithCounts}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>

        {/* Lead List - Table view on desktop */}
        <div className="px-4 mt-4 pb-4">
          {filteredLeads.length === 0 ? (
            <EmptyState
              icon={<Users className="w-8 h-8" />}
              title={searchQuery ? 'Sin resultados' : 'No hay leads'}
              description={
                searchQuery
                  ? 'Intenta con otra búsqueda'
                  : 'Agrega tu primer lead para comenzar'
              }
              action={
                !searchQuery
                  ? { label: 'Agregar Lead', onClick: () => setShowAddModal(true) }
                  : undefined
              }
            />
          ) : (
            <Card padding="none">
              {/* Desktop Table Header */}
              <div className="hidden lg:grid lg:grid-cols-12 lg:gap-4 lg:px-4 lg:py-3 lg:bg-slate-50 lg:border-b lg:border-slate-100 lg:text-sm lg:font-medium lg:text-slate-600">
                <div className="col-span-4">Cliente</div>
                <div className="col-span-2">Fuente</div>
                <div className="col-span-2">Estado</div>
                <div className="col-span-2">Tratamientos</div>
                <div className="col-span-2">Fecha</div>
              </div>
              <div className="divide-y divide-slate-100">
                {filteredLeads.map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/leads/${lead.id}`}
                    className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors lg:grid lg:grid-cols-12 lg:gap-4"
                  >
                    {/* Mobile & Desktop: Avatar + Name */}
                    <div className="lg:hidden">
                      <Avatar name={lead.name} size="md" />
                    </div>
                    <div className="flex-1 min-w-0 lg:col-span-4 lg:flex lg:items-center lg:gap-3">
                      <div className="hidden lg:block">
                        <Avatar name={lead.name} size="md" />
                      </div>
                      <div className="lg:flex-1 lg:min-w-0">
                        <p className="font-medium text-slate-800 truncate">{lead.name}</p>
                        <p className="text-sm text-slate-500 truncate lg:hidden">
                          {lead.phone}
                        </p>
                        <p className="hidden lg:block text-sm text-slate-500 truncate">
                          {lead.phone} {lead.email && `• ${lead.email}`}
                        </p>
                      </div>
                    </div>

                    {/* Mobile: Source + Time */}
                    <div className="lg:hidden flex-1 min-w-0">
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          {getSourceIcon(lead.source)}
                          {getSourceLabel(lead.source)}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-slate-400">
                          {formatTimeAgo(new Date(lead.createdAt))}
                        </span>
                      </div>
                    </div>

                    {/* Desktop: Source */}
                    <div className="hidden lg:flex lg:col-span-2 lg:items-center lg:gap-2 text-sm text-slate-600">
                      {getSourceIcon(lead.source)}
                      <span>{getSourceLabel(lead.source)}</span>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2 lg:col-span-2">
                      <Badge
                        variant={
                          lead.status === 'new' ? 'primary' :
                          lead.status === 'contacted' ? 'warning' :
                          lead.status === 'scheduled' ? 'default' :
                          lead.status === 'closed' ? 'success' : 'error'
                        }
                        size="sm"
                      >
                        {getStatusLabel(lead.status)}
                      </Badge>
                      <ChevronRight className="w-5 h-5 text-slate-300 lg:hidden" />
                    </div>

                    {/* Desktop: Treatments */}
                    <div className="hidden lg:block lg:col-span-2 text-sm text-slate-600">
                      {lead.treatments.length > 0 ? (
                        <span className="truncate">{lead.treatments.slice(0, 2).join(', ')}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </div>

                    {/* Desktop: Date */}
                    <div className="hidden lg:flex lg:col-span-2 lg:items-center lg:justify-between">
                      <span className="text-sm text-slate-500">
                        {formatTimeAgo(new Date(lead.createdAt))}
                      </span>
                      <ChevronRight className="w-5 h-5 text-slate-300" />
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>
      </PageContainer>

      {/* Add Lead Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Nuevo Lead"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleAddLead()
          }}
          className="space-y-4"
        >
          <Input
            label="Nombre"
            placeholder="Nombre del cliente"
            value={newLead.name}
            onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
            required
          />

          <Input
            label="Teléfono"
            placeholder="+52 55 1234 5678"
            type="tel"
            value={newLead.phone}
            onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
            required
          />

          <Input
            label="Email (opcional)"
            placeholder="cliente@email.com"
            type="email"
            value={newLead.email}
            onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
          />

          <Select
            label="Fuente"
            value={newLead.source}
            onChange={(value) => setNewLead({ ...newLead, source: value as LeadSource })}
            options={[
              { value: 'instagram', label: 'Instagram' },
              { value: 'whatsapp', label: 'WhatsApp' },
              { value: 'phone', label: 'Teléfono' },
              { value: 'website', label: 'Sitio Web' },
              { value: 'referral', label: 'Referido' },
              { value: 'other', label: 'Otro' },
            ]}
          />

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={() => setShowAddModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" fullWidth>
              Agregar Lead
            </Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  )
}
