'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function LeadDetailPage() {
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    // Redirect to pacientes with the patient ID as a query parameter
    router.replace(`/pacientes?id=${params.id}`)
  }, [router, params.id])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-slate-600">Redirigiendo a Pacientes...</p>
      </div>
    </div>
  )
}

  const [showMenu, setShowMenu] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [showFollowUpModal, setShowFollowUpModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [noteContent, setNoteContent] = useState('')
  const [isCreatingFollowUp, setIsCreatingFollowUp] = useState(false)

  const [followUp, setFollowUp] = useState<{
    type: FollowUpType
    scheduledAt: string
    notes: string
    duration: number
  }>({
    type: 'call',
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    notes: '',
    duration: 30,
  })

  const calendarConnected = isCalendarConnected()

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'instagram':
        return <Instagram className="w-4 h-4" />
      case 'whatsapp':
        return <MessageCircle className="w-4 h-4" />
      case 'website':
        return <Globe className="w-4 h-4" />
      case 'referral':
        return <Users className="w-4 h-4" />
      default:
        return <Phone className="w-4 h-4" />
    }
  }

  // ✅ FIX: Hook must NOT be after a conditional return.
  // Make it safe when `patient` is null.
  const timeline = useMemo(() => {
    if (!patient) return []

    const items: Array<{
      id: string
      type: 'note' | 'followup'
      content: string
      date: Date
      completed?: boolean
      meetLink?: string
      followUpType?: string
    }> = []

    patient.notes.forEach((note) => {
      items.push({
        id: note.id,
        type: 'note',
        content: note.content,
        date: new Date(note.createdAt),
      })
    })

    patient.followUps.forEach((fu) => {
      items.push({
        id: fu.id,
        type: 'followup',
        content: `${fu.type === 'call' ? 'Llamada' : fu.type === 'message' ? 'Mensaje' : fu.type === 'email' ? 'Email' : 'Reunión'}${
          fu.notes ? `: ${fu.notes}` : ''
        }`,
        date: new Date(fu.scheduledAt),
        completed: fu.completed,
        meetLink: fu.meetLink,
        followUpType: fu.type,
      })
    })

    return items.sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [patient])

  if (!patient) {
    return (
      <>
        <Header title="Paciente no encontrado" showBack />
        <PageContainer>
          <div className="text-center py-12">
            <p className="text-slate-500">Este paciente no existe o fue eliminado</p>
            <Button onClick={() => router.push('/leads')} className="mt-4">
              Volver a Pacientes
            </Button>
          </div>
        </PageContainer>
      </>
    )
  }

  const handleAddNote = () => {
    if (!noteContent.trim()) return
    addNote(patient.id, noteContent)
    setNoteContent('')
    setShowNoteModal(false)
  }

  const handleAddFollowUp = async () => {
    setIsCreatingFollowUp(true)
    try {
      await addFollowUp(patient.id, {
        type: followUp.type,
        scheduledAt: new Date(followUp.scheduledAt),
        notes: followUp.notes,
        duration: followUp.duration,
      })
      setFollowUp({
        type: 'call',
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        notes: '',
        duration: 30,
      })
      setShowFollowUpModal(false)
    } catch (error) {
      console.error('Error creating follow-up:', error)
    } finally {
      setIsCreatingFollowUp(false)
    }
  }

  const handleDelete = () => {
    deletePatient(patient.id)
    router.push('/leads')
  }

  return (
    <>
      <Header title={patient.name} showBack showMenu onMenuClick={() => setShowMenu(true)} />

      <PageContainer withBottomNav={false} className="pb-8">
        {/* Profile Section */}
        <Card className="text-center">
          <Avatar name={patient.name} size="xl" className="mx-auto" />
          <h2 className="text-xl font-bold text-slate-800 mt-3">{patient.name}</h2>
          <div className="flex items-center justify-center gap-1 mt-1 text-slate-500">
            {getSourceIcon(patient.source)}
            <span className="text-sm">Vía {getSourceLabel(patient.source)}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Agregado {formatTimeAgo(new Date(patient.createdAt))}</p>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <a
            href={getPhoneUrl(patient.phone)}
            className="flex flex-col items-center justify-center p-3 bg-white rounded-xl shadow-card hover:shadow-card-hover transition-shadow"
          >
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center mb-1">
              <Phone className="w-5 h-5 text-primary-600" />
            </div>
            <span className="text-xs text-slate-600">Llamar</span>
          </a>

          <a
            href={getWhatsAppUrl(patient.phone)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center p-3 bg-white rounded-xl shadow-card hover:shadow-card-hover transition-shadow"
          >
            <div className="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center mb-1">
              <MessageCircle className="w-5 h-5 text-success-600" />
            </div>
            <span className="text-xs text-slate-600">WhatsApp</span>
          </a>

          {patient.email && (
            <a
              href={getEmailUrl(patient.email)}
              className="flex flex-col items-center justify-center p-3 bg-white rounded-xl shadow-card hover:shadow-card-hover transition-shadow"
            >
              <div className="w-10 h-10 rounded-lg bg-warning-100 flex items-center justify-center mb-1">
                <Mail className="w-5 h-5 text-warning-600" />
              </div>
              <span className="text-xs text-slate-600">Email</span>
            </a>
          )}

          <button
            onClick={() => setShowFollowUpModal(true)}
            className="flex flex-col items-center justify-center p-3 bg-white rounded-xl shadow-card hover:shadow-card-hover transition-shadow"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mb-1">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-xs text-slate-600">Agendar</span>
          </button>
        </div>

        {/* Status Selector */}
        <Card className="mt-4">
          <p className="text-sm font-medium text-slate-700 mb-3">Estado</p>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => updatePatientStatus(patient.id, option.value)}
                className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all ${
                  patient.status === option.value
                    ? `${option.color} text-white`
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${patient.status === option.value ? 'bg-white' : option.color}`} />
                {option.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Contact Info */}
        <Card className="mt-4">
          <p className="text-sm font-medium text-slate-700 mb-3">Información de Contacto</p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <Phone className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Teléfono</p>
                <p className="text-sm text-slate-800">{patient.phone}</p>
              </div>
            </div>

            {patient.email && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="text-sm text-slate-800">{patient.email}</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Treatments */}
        {patient.treatments.length > 0 && (
          <Card className="mt-4">
            <p className="text-sm font-medium text-slate-700 mb-3">Tratamientos de Interés</p>
            <div className="flex flex-wrap gap-2">
              {patient.treatments.map((treatment, i) => (
                <Badge key={`${treatment}-${i}`} variant="outline">
                  {treatment}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        {/* Notes & Activity */}
        <Card className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-slate-700">Notas y Actividad</p>
            <Button size="sm" variant="ghost" onClick={() => setShowNoteModal(true)} icon={<FileText className="w-4 h-4" />}>
              Agregar nota
            </Button>
          </div>

          {timeline.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No hay actividad todavía</p>
          ) : (
            <div className="space-y-4">
              {timeline.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        item.type === 'note'
                          ? 'bg-slate-100'
                          : item.followUpType === 'meeting'
                          ? item.completed
                            ? 'bg-success-100'
                            : 'bg-purple-100'
                          : item.completed
                          ? 'bg-success-100'
                          : 'bg-primary-100'
                      }`}
                    >
                      {item.type === 'note' ? (
                        <FileText className="w-4 h-4 text-slate-500" />
                      ) : item.completed ? (
                        <CheckCircle className="w-4 h-4 text-success-600" />
                      ) : item.followUpType === 'meeting' ? (
                        <Video className="w-4 h-4 text-purple-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-primary-600" />
                      )}
                    </div>
                    <div className="flex-1 w-px bg-slate-200 mt-2" />
                  </div>

                  <div className="flex-1 pb-4">
                    <p className="text-sm text-slate-800">{item.content}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {item.type === 'followup'
                        ? (item.completed ? 'Completado ' : 'Programado para ') + formatRelativeDate(item.date)
                        : formatTimeAgo(item.date)}
                    </p>

                    {item.meetLink && (
                      <a
                        href={item.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-medium rounded-lg transition-colors"
                      >
                        <Video className="w-3.5 h-3.5" />
                        Unirse a Google Meet
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </PageContainer>

      {/* Menu Modal */}
      <Modal isOpen={showMenu} onClose={() => setShowMenu(false)} title="Opciones" size="sm">
        <div className="space-y-2">
          <button
            onClick={() => {
              setShowMenu(false)
              // Edit functionality would go here
            }}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Edit className="w-5 h-5 text-slate-500" />
            <span className="text-slate-700">Editar paciente</span>
          </button>

          <button
            onClick={() => {
              setShowMenu(false)
              setShowDeleteConfirm(true)
            }}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-error-50 transition-colors text-error-600"
          >
            <Trash2 className="w-5 h-5" />
            <span>Eliminar paciente</span>
          </button>
        </div>
      </Modal>

      {/* Add Note Modal */}
      <Modal isOpen={showNoteModal} onClose={() => setShowNoteModal(false)} title="Agregar Nota">
        <div className="space-y-4">
          <TextArea
            placeholder="Escribe una nota sobre este paciente..."
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            className="min-h-[120px]"
          />
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setShowNoteModal(false)}>
              Cancelar
            </Button>
            <Button fullWidth onClick={handleAddNote}>
              Guardar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Follow-up Modal */}
      <Modal isOpen={showFollowUpModal} onClose={() => setShowFollowUpModal(false)} title="Programar Seguimiento">
        <div className="space-y-4">
          <Select
            label="Tipo"
            value={followUp.type}
            onChange={(value) => setFollowUp({ ...followUp, type: value as FollowUpType })}
            options={[
              { value: 'call', label: 'Llamada' },
              { value: 'message', label: 'Mensaje' },
              { value: 'email', label: 'Email' },
              { value: 'meeting', label: 'Reunión con videollamada' },
            ]}
          />

          {followUp.type === 'meeting' && (
            <div
              className={`flex items-center gap-2 p-3 rounded-lg ${
                calendarConnected ? 'bg-purple-50 border border-purple-200' : 'bg-slate-50 border border-slate-200'
              }`}
            >
              <Video className={`w-5 h-5 ${calendarConnected ? 'text-purple-600' : 'text-slate-400'}`} />
              <div className="flex-1">
                <p className={`text-sm font-medium ${calendarConnected ? 'text-purple-700' : 'text-slate-600'}`}>
                  {calendarConnected ? 'Se creará evento en Google Calendar' : 'Google Calendar no conectado'}
                </p>
                <p className="text-xs text-slate-500">
                  {calendarConnected
                    ? 'Se generará automáticamente un enlace de Google Meet'
                    : 'Conecta tu calendario en Configuración → Integraciones'}
                </p>
              </div>
              {calendarConnected && <CheckCircle className="w-5 h-5 text-purple-600" />}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha y Hora</label>
            <input
              type="datetime-local"
              value={followUp.scheduledAt}
              onChange={(e) => setFollowUp({ ...followUp, scheduledAt: e.target.value })}
              className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white"
            />
          </div>

          {followUp.type === 'meeting' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Duración</label>
              <div className="flex gap-2">
                {[15, 30, 45, 60, 90].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setFollowUp({ ...followUp, duration: mins })}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      followUp.duration === mins ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Input
            label="Notas (opcional)"
            placeholder="Ej: Confirmar disponibilidad para consulta"
            value={followUp.notes}
            onChange={(e) => setFollowUp({ ...followUp, notes: e.target.value })}
          />

          <div className="flex gap-3 pt-2">
            <Button variant="outline" fullWidth onClick={() => setShowFollowUpModal(false)} disabled={isCreatingFollowUp}>
              Cancelar
            </Button>
            <Button fullWidth onClick={handleAddFollowUp} disabled={isCreatingFollowUp}>
              {isCreatingFollowUp ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {followUp.type === 'meeting' && calendarConnected ? 'Creando evento...' : 'Guardando...'}
                </span>
              ) : followUp.type === 'meeting' && calendarConnected ? (
                'Crear con Google Meet'
              ) : (
                'Programar'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Eliminar Paciente" size="sm">
        <p className="text-slate-600 mb-6">
          ¿Estás seguro de que deseas eliminar a <strong>{patient.name}</strong>? Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={() => setShowDeleteConfirm(false)}>
            Cancelar
          </Button>
          <Button variant="danger" fullWidth onClick={handleDelete}>
            Eliminar
          </Button>
        </div>
      </Modal>
    </>
  )
}
