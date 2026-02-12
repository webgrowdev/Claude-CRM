'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LeadsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/pacientes')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-slate-600">Redirigiendo a Pacientes...</p>
      </div>
    </div>
  )
}

    // Filter by status
    if (activeTab !== 'all') {
      patients = patients.filter(p => p.status === activeTab)
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      patients = patients.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.phone.includes(query) ||
        p.email?.toLowerCase().includes(query)
      )
    }

    // Sort by date
    return patients.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [state.patients, activeTab, searchQuery])

  const tabsWithCounts = useMemo(() =>
    statusTabs.map(tab => ({
      ...tab,
      count: tab.id === 'all'
        ? state.patients.length
        : state.patients.filter(p => p.status === tab.id).length
    }))
  , [state.patients])

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

  const handleAddPatient = () => {
    if (!newPatient.name || !newPatient.phone) return

    addPatient({
      name: newPatient.name,
      phone: newPatient.phone,
      email: newPatient.email || undefined,
      source: newPatient.source,
      status: 'new',
      treatments: newPatient.treatments,
      assignedTo: state.user.id,
    })

    setNewPatient({
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

        {/* Patient List - Table view on desktop */}
        <div className="px-4 mt-4 pb-4">
          {filteredPatients.length === 0 ? (
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
                {filteredPatients.map((patient) => (
                  <Link
                    key={patient.id}
                    href={`/leads/${patient.id}`}
                    className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors lg:grid lg:grid-cols-12 lg:gap-4"
                  >
                    {/* Mobile & Desktop: Avatar + Name */}
                    <div className="lg:hidden">
                      <Avatar name={patient.name} size="md" />
                    </div>
                    <div className="flex-1 min-w-0 lg:col-span-4 lg:flex lg:items-center lg:gap-3">
                      <div className="hidden lg:block">
                        <Avatar name={patient.name} size="md" />
                      </div>
                      <div className="lg:flex-1 lg:min-w-0">
                        <p className="font-medium text-slate-800 truncate">{patient.name}</p>
                        <p className="text-sm text-slate-500 truncate lg:hidden">
                          {patient.phone}
                        </p>
                        <p className="hidden lg:block text-sm text-slate-500 truncate">
                          {patient.phone} {patient.email && `• ${patient.email}`}
                        </p>
                      </div>
                    </div>

                    {/* Mobile: Source + Time */}
                    <div className="lg:hidden flex-1 min-w-0">
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          {getSourceIcon(patient.source)}
                          {getSourceLabel(patient.source)}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-slate-400">
                          {formatTimeAgo(new Date(patient.createdAt))}
                        </span>
                      </div>
                    </div>

                    {/* Desktop: Source */}
                    <div className="hidden lg:flex lg:col-span-2 lg:items-center lg:gap-2 text-sm text-slate-600">
                      {getSourceIcon(patient.source)}
                      <span>{getSourceLabel(patient.source)}</span>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2 lg:col-span-2">
                      <Badge
                        variant={
                          patient.status === 'new' ? 'primary' :
                          patient.status === 'contacted' ? 'warning' :
                          patient.status === 'appointment' ? 'default' :
                          patient.status === 'closed' ? 'success' : 'error'
                        }
                        size="sm"
                      >
                        {patient.status === 'new' ? 'Nuevo' :
                         patient.status === 'contacted' ? 'Contactado' :
                         patient.status === 'appointment' ? 'Agendado' :
                         patient.status === 'attended' ? 'Asistió' :
                         patient.status === 'closed' ? 'Cerrado' :
                         patient.status === 'followup' ? 'Seguimiento' :
                         patient.status === 'noshow' ? 'No asistió' :
                         patient.status === 'lost' ? 'Perdido' : patient.status}
                      </Badge>
                      <ChevronRight className="w-5 h-5 text-slate-300 lg:hidden" />
                    </div>

                    {/* Desktop: Treatments */}
                    <div className="hidden lg:block lg:col-span-2 text-sm text-slate-600">
                      {patient.treatments.length > 0 ? (
                        <span className="truncate">{patient.treatments.slice(0, 2).join(', ')}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </div>

                    {/* Desktop: Date */}
                    <div className="hidden lg:flex lg:col-span-2 lg:items-center lg:justify-between">
                      <span className="text-sm text-slate-500">
                        {formatTimeAgo(new Date(patient.createdAt))}
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
            handleAddPatient()
          }}
          className="space-y-4"
        >
          <Input
            label="Nombre"
            placeholder="Nombre del cliente"
            value={newPatient.name}
            onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
            required
          />

          <Input
            label="Teléfono"
            placeholder="+52 55 1234 5678"
            type="tel"
            value={newPatient.phone}
            onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
            required
          />

          <Input
            label="Email (opcional)"
            placeholder="cliente@email.com"
            type="email"
            value={newPatient.email}
            onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
          />

          <Select
            label="Fuente"
            value={newPatient.source}
            onChange={(value) => setNewPatient({ ...newPatient, source: value as LeadSource })}
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
