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
import { Header, BottomNav, PageContainer } from '@/components/layout'
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
    <>
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
        {/* Search */}
        <div className="px-4 pt-4">
          <Input
            placeholder="Buscar leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-5 h-5" />}
          />
        </div>

        {/* Tabs */}
        <div className="px-4 mt-4">
          <Tabs
            tabs={tabsWithCounts}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>

        {/* Lead List */}
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
              <div className="divide-y divide-slate-100">
                {filteredLeads.map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/leads/${lead.id}`}
                    className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors"
                  >
                    <Avatar name={lead.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-800 truncate">{lead.name}</p>
                      </div>
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
                    <div className="flex items-center gap-2">
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
                      <ChevronRight className="w-5 h-5 text-slate-300" />
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>
      </PageContainer>

      <BottomNav />

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
    </>
  )
}
