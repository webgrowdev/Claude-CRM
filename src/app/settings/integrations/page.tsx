'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Calendar,
  MessageCircle,
  Check,
  X,
  ExternalLink,
  Copy,
  RefreshCw,
  Video,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { Header, PageContainer, AppShell } from '@/components/layout'
import { Card, Button, Input, Modal } from '@/components/ui'
import {
  getGoogleCalendarSettings,
  connectGoogleCalendar,
  disconnectGoogleCalendar,
  getUpcomingEvents,
  generateMeetLink,
} from '@/services/googleCalendar'
import {
  getManyChatSettings,
  configureManyChatIntegration,
  disconnectManyChat,
  generateWebhookUrl,
} from '@/services/manychat'
import { GoogleCalendarSettings, ManyChatSettings, CalendarEvent } from '@/types'

export default function IntegrationsPage() {
  const searchParams = useSearchParams()
  const [googleSettings, setGoogleSettings] = useState<GoogleCalendarSettings | null>(null)
  const [manychatSettings, setManychatSettings] = useState<ManyChatSettings | null>(null)
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [showManyChatModal, setShowManyChatModal] = useState(false)
  const [manychatForm, setManychatForm] = useState({ apiKey: '', botId: '' })
  const [copied, setCopied] = useState(false)
  const [meetLink, setMeetLink] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Handle OAuth callback results
  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')

    if (success === 'google_connected') {
      setNotification({
        type: 'success',
        message: 'Google Calendar conectado exitosamente',
      })
      // Refresh settings
      setGoogleSettings(getGoogleCalendarSettings())
      // Clear URL params
      window.history.replaceState({}, '', '/settings/integrations')
    }

    if (error) {
      const errorMessages: Record<string, string> = {
        google_auth_failed: 'Error al autenticar con Google',
        no_code: 'No se recibió código de autorización',
        token_exchange_failed: 'Error al obtener el token de acceso',
        callback_failed: 'Error en el proceso de autenticación',
      }
      setNotification({
        type: 'error',
        message: errorMessages[error] || 'Error desconocido',
      })
      window.history.replaceState({}, '', '/settings/integrations')
    }

    // Auto-dismiss notification after 5 seconds
    if (success || error) {
      setTimeout(() => setNotification(null), 5000)
    }
  }, [searchParams])

  useEffect(() => {
    setGoogleSettings(getGoogleCalendarSettings())
    setManychatSettings(getManyChatSettings())
  }, [])

  useEffect(() => {
    if (googleSettings?.connected) {
      loadUpcomingEvents()
    }
  }, [googleSettings?.connected])

  const loadUpcomingEvents = async () => {
    const events = await getUpcomingEvents(5)
    setUpcomingEvents(events)
  }

  const handleConnectGoogle = () => {
    try {
      connectGoogleCalendar() // This redirects to Google OAuth
    } catch (error) {
      console.error('Failed to connect Google Calendar:', error)
      setNotification({
        type: 'error',
        message: 'No se pudo conectar con Google Calendar. Verifica que las credenciales estén configuradas.',
      })
    }
  }

  const handleDisconnectGoogle = () => {
    disconnectGoogleCalendar()
    setGoogleSettings(getGoogleCalendarSettings())
    setUpcomingEvents([])
  }

  const handleConnectManyChat = () => {
    if (!manychatForm.apiKey || !manychatForm.botId) {
      alert('Por favor ingresa tu API Key y Bot ID de ManyChat')
      return
    }

    const settings = configureManyChatIntegration(manychatForm.apiKey, manychatForm.botId)
    setManychatSettings(settings)
    setShowManyChatModal(false)
    setManychatForm({ apiKey: '', botId: '' })
  }

  const handleDisconnectManyChat = () => {
    disconnectManyChat()
    setManychatSettings(getManyChatSettings())
  }

  const copyWebhookUrl = async () => {
    const url = generateWebhookUrl()
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleGenerateMeetLink = async () => {
    setLoading(true)
    try {
      const link = await generateMeetLink()
      setMeetLink(link)
    } catch (error) {
      console.error('Failed to generate Meet link:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatEventDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-MX', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <AppShell>
      <Header title="Integraciones" showBack />

      <PageContainer>
        {/* Notification */}
        {notification && (
          <div
            className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${
              notification.type === 'success'
                ? 'bg-success-50 text-success-800'
                : 'bg-error-50 text-error-800'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-success-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-error-600" />
            )}
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-auto p-1 hover:bg-black/5 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="space-y-6 lg:max-w-2xl">
          {/* Google Calendar Integration */}
          <Card>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800">Google Calendar</h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Sincroniza seguimientos y crea reuniones con Google Meet
                    </p>
                  </div>
                  {googleSettings?.connected ? (
                    <span className="flex items-center gap-1 text-sm text-success-600 bg-success-50 px-2 py-1 rounded-full">
                      <Check className="w-4 h-4" />
                      Conectado
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-sm text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                      <X className="w-4 h-4" />
                      Desconectado
                    </span>
                  )}
                </div>

                {googleSettings?.connected ? (
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <span>Cuenta:</span>
                      <span className="font-medium">{googleSettings.email}</span>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleGenerateMeetLink}
                        disabled={loading}
                        icon={<Video className="w-4 h-4" />}
                      >
                        Crear Meet
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={loadUpcomingEvents}
                        icon={<RefreshCw className="w-4 h-4" />}
                      >
                        Actualizar
                      </Button>
                    </div>

                    {/* Meet Link */}
                    {meetLink && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-800 mb-2">
                          Link de Google Meet creado:
                        </p>
                        <div className="flex items-center gap-2">
                          <a
                            href={meetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline truncate"
                          >
                            {meetLink}
                          </a>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              await navigator.clipboard.writeText(meetLink)
                              alert('Link copiado!')
                            }}
                            icon={<Copy className="w-4 h-4" />}
                          />
                        </div>
                      </div>
                    )}

                    {/* Upcoming Events */}
                    {upcomingEvents.length > 0 && (
                      <div className="border-t border-slate-100 pt-4">
                        <h4 className="text-sm font-medium text-slate-700 mb-2">
                          Próximos Eventos
                        </h4>
                        <div className="space-y-2">
                          {upcomingEvents.slice(0, 3).map((event) => (
                            <div
                              key={event.id}
                              className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-700 truncate">
                                  {event.title}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {formatEventDate(event.start)}
                                </p>
                              </div>
                              {event.meetLink && (
                                <a
                                  href={event.meetLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"
                                >
                                  <Video className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDisconnectGoogle}
                        className="text-error-600 hover:bg-error-50"
                      >
                        Desconectar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4">
                    <Button
                      onClick={handleConnectGoogle}
                      disabled={loading}
                      icon={<Calendar className="w-4 h-4" />}
                    >
                      {loading ? 'Conectando...' : 'Conectar Google Calendar'}
                    </Button>
                    <p className="text-xs text-slate-400 mt-2">
                      Requiere configurar NEXT_PUBLIC_GOOGLE_CLIENT_ID
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* ManyChat Integration */}
          <Card>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800">ManyChat</h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Recibe leads automáticamente desde Instagram y WhatsApp
                    </p>
                  </div>
                  {manychatSettings?.connected ? (
                    <span className="flex items-center gap-1 text-sm text-success-600 bg-success-50 px-2 py-1 rounded-full">
                      <Check className="w-4 h-4" />
                      Conectado
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-sm text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                      <X className="w-4 h-4" />
                      Desconectado
                    </span>
                  )}
                </div>

                {manychatSettings?.connected ? (
                  <div className="mt-4 space-y-4">
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm font-medium text-purple-800 mb-2">
                        URL del Webhook:
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-white px-2 py-1 rounded border border-purple-200 flex-1 truncate">
                          {manychatSettings.webhookUrl}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={copyWebhookUrl}
                          icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        />
                      </div>
                    </div>

                    <div className="text-sm text-slate-600 space-y-1">
                      <p>• Leads de Instagram se crean automáticamente</p>
                      <p>• Leads de WhatsApp se crean automáticamente</p>
                      <p>• Citas agendadas se sincronizan</p>
                    </div>

                    <div className="pt-2 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open('https://manychat.com', '_blank')}
                        icon={<ExternalLink className="w-4 h-4" />}
                      >
                        Ir a ManyChat
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDisconnectManyChat}
                        className="text-error-600 hover:bg-error-50"
                      >
                        Desconectar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4">
                    <Button
                      onClick={() => setShowManyChatModal(true)}
                      icon={<MessageCircle className="w-4 h-4" />}
                    >
                      Conectar ManyChat
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Help Section */}
          <Card className="bg-slate-50">
            <h3 className="font-semibold text-slate-800 mb-3">¿Cómo funcionan las integraciones?</h3>
            <div className="space-y-3 text-sm text-slate-600">
              <div>
                <p className="font-medium text-slate-700">Google Calendar + Meet</p>
                <p>Los seguimientos tipo "Reunión" crean eventos automáticos con link de Meet para videollamadas con tus clientes.</p>
              </div>
              <div>
                <p className="font-medium text-slate-700">ManyChat</p>
                <p>Cuando alguien te contacta por Instagram o WhatsApp y ManyChat captura sus datos, se crea un lead automáticamente en el CRM.</p>
              </div>
            </div>
          </Card>
        </div>
      </PageContainer>

      {/* ManyChat Configuration Modal */}
      <Modal
        isOpen={showManyChatModal}
        onClose={() => setShowManyChatModal(false)}
        title="Configurar ManyChat"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Ingresa tu API Key y Bot ID de ManyChat para recibir leads automáticamente.
          </p>

          <Input
            label="API Key"
            placeholder="Tu API Key de ManyChat"
            value={manychatForm.apiKey}
            onChange={(e) => setManychatForm({ ...manychatForm, apiKey: e.target.value })}
          />

          <Input
            label="Bot ID"
            placeholder="ID de tu bot de ManyChat"
            value={manychatForm.botId}
            onChange={(e) => setManychatForm({ ...manychatForm, botId: e.target.value })}
          />

          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-sm font-medium text-slate-700 mb-1">
              URL del Webhook para configurar en ManyChat:
            </p>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-white px-2 py-1 rounded border flex-1 truncate">
                {generateWebhookUrl()}
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={copyWebhookUrl}
                icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              fullWidth
              onClick={() => setShowManyChatModal(false)}
            >
              Cancelar
            </Button>
            <Button fullWidth onClick={handleConnectManyChat}>
              Conectar
            </Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  )
}
