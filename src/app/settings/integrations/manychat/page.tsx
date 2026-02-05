'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  MessageCircle,
  Check,
  X,
  Copy,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Settings,
  Database,
  Webhook,
  Activity,
} from 'lucide-react'
import { Header, PageContainer, AppShell } from '@/components/layout'
import { Card, Button, Input, Modal } from '@/components/ui'
import { ManyChatIntegrationSettings } from '@/types/manychat'

export default function ManyChatSettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<ManyChatIntegrationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [channelId, setChannelId] = useState('')
  const [copied, setCopied] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [syncHistory, setSyncHistory] = useState<any[]>([])
  const [webhookLogs, setWebhookLogs] = useState<any[]>([])

  const webhookUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/webhooks/manychat`
    : ''

  useEffect(() => {
    loadSettings()
    loadSyncHistory()
    loadWebhookLogs()
  }, [])

  const loadSettings = async () => {
    try {
      // In a real app, fetch from API
      // For now, use localStorage as fallback
      const stored = localStorage.getItem('manychat_settings')
      if (stored) {
        setSettings(JSON.parse(stored))
      } else {
        setSettings({
          connected: false,
          auto_create_patients: true,
          auto_sync_enabled: false,
          sync_interval_hours: 24,
        })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      showNotification('error', 'Error al cargar configuración')
    } finally {
      setLoading(false)
    }
  }

  const loadSyncHistory = async () => {
    try {
      const response = await fetch('/api/sync/manychat')
      if (response.ok) {
        const data = await response.json()
        setSyncHistory(data.recentSyncs || [])
      }
    } catch (error) {
      console.error('Error loading sync history:', error)
    }
  }

  const loadWebhookLogs = async () => {
    try {
      // In a real app, fetch from API
      // For now, mock some data
      setWebhookLogs([])
    } catch (error) {
      console.error('Error loading webhook logs:', error)
    }
  }

  const handleConnect = async () => {
    if (!apiKey || !webhookSecret) {
      showNotification('error', 'Por favor ingresa API Key y Webhook Secret')
      return
    }

    try {
      const newSettings: ManyChatIntegrationSettings = {
        connected: true,
        api_key: apiKey,
        webhook_secret: webhookSecret,
        channel_id: channelId || undefined,
        auto_create_patients: true,
        auto_sync_enabled: false,
        webhook_url: webhookUrl,
      }

      // Save to localStorage (in real app, save to API)
      localStorage.setItem('manychat_settings', JSON.stringify(newSettings))
      setSettings(newSettings)
      setShowConfigModal(false)
      showNotification('success', 'ManyChat conectado exitosamente')
      
      // Clear form
      setApiKey('')
      setWebhookSecret('')
      setChannelId('')
    } catch (error) {
      console.error('Error connecting ManyChat:', error)
      showNotification('error', 'Error al conectar ManyChat')
    }
  }

  const handleDisconnect = async () => {
    try {
      const newSettings: ManyChatIntegrationSettings = {
        connected: false,
        auto_create_patients: true,
        auto_sync_enabled: false,
      }

      localStorage.setItem('manychat_settings', JSON.stringify(newSettings))
      setSettings(newSettings)
      showNotification('success', 'ManyChat desconectado')
    } catch (error) {
      console.error('Error disconnecting ManyChat:', error)
      showNotification('error', 'Error al desconectar ManyChat')
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/sync/manychat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: 1, limit: 100 }),
      })

      if (response.ok) {
        const data = await response.json()
        showNotification('success', 
          `Sincronización completada: ${data.results.created} creados, ${data.results.updated} actualizados`
        )
        loadSyncHistory()
      } else {
        showNotification('error', 'Error al sincronizar')
      }
    } catch (error) {
      console.error('Error syncing:', error)
      showNotification('error', 'Error al sincronizar con ManyChat')
    } finally {
      setSyncing(false)
    }
  }

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  if (loading) {
    return (
      <AppShell>
        <Header title="Configuración ManyChat" subtitle="Integración con ManyChat" showBackButton />
        <PageContainer>
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </PageContainer>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <Header 
        title="Configuración ManyChat" 
        subtitle="Gestiona la integración con ManyChat"
        showBackButton 
      />
      
      <PageContainer>
        {/* Notification */}
        {notification && (
          <div className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${
            notification.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Connection Status */}
        <Card className="mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${
                settings?.connected ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <MessageCircle className={`w-6 h-6 ${
                  settings?.connected ? 'text-green-600' : 'text-gray-400'
                }`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">
                  Estado de Conexión
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {settings?.connected 
                    ? 'ManyChat está conectado y funcionando'
                    : 'ManyChat no está conectado'
                  }
                </p>
                <div className="flex items-center gap-2">
                  {settings?.connected ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      <Check className="w-4 h-4" />
                      Conectado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                      <X className="w-4 h-4" />
                      Desconectado
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {settings?.connected ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={handleDisconnect}
                  >
                    Desconectar
                  </Button>
                  <Button 
                    onClick={() => setShowConfigModal(true)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Configurar
                  </Button>
                </>
              ) : (
                <Button onClick={() => setShowConfigModal(true)}>
                  Conectar ManyChat
                </Button>
              )}
            </div>
          </div>
        </Card>

        {settings?.connected && (
          <>
            {/* Webhook URL */}
            <Card className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Webhook className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Webhook URL</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Copia esta URL y configúrala en ManyChat para recibir eventos en tiempo real.
              </p>
              <div className="flex gap-2">
                <Input
                  value={webhookUrl}
                  readOnly
                  className="flex-1 font-mono text-sm"
                />
                <Button
                  variant="outline"
                  onClick={copyWebhookUrl}
                  className="whitespace-nowrap"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Sync Controls */}
            <Card className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Sincronización</h3>
                </div>
                <Button
                  onClick={handleSync}
                  disabled={syncing}
                >
                  {syncing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Sincronizando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Sincronizar Ahora
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Sincroniza manualmente todos los subscribers de ManyChat con el CRM.
              </p>
              {settings.last_sync_at && (
                <p className="text-sm text-gray-500">
                  Última sincronización: {new Date(settings.last_sync_at).toLocaleString('es-MX')}
                </p>
              )}
            </Card>

            {/* Sync History */}
            <Card className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Activity className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Historial de Sincronización</h3>
              </div>
              {syncHistory.length > 0 ? (
                <div className="space-y-2">
                  {syncHistory.map((sync, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 rounded-lg text-sm"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{sync.description}</span>
                        <span className="text-gray-500">
                          {new Date(sync.created_at).toLocaleString('es-MX')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No hay historial de sincronización disponible
                </p>
              )}
            </Card>

            {/* Settings */}
            <Card>
              <h3 className="text-lg font-semibold mb-4">Configuración</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Crear pacientes automáticamente</p>
                    <p className="text-sm text-gray-600">
                      Crea nuevos pacientes cuando se reciben webhooks
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.auto_create_patients}
                      onChange={(e) => {
                        const newSettings = { ...settings, auto_create_patients: e.target.checked }
                        localStorage.setItem('manychat_settings', JSON.stringify(newSettings))
                        setSettings(newSettings)
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Sincronización automática</p>
                    <p className="text-sm text-gray-600">
                      Sincroniza automáticamente cada {settings.sync_interval_hours} horas
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.auto_sync_enabled}
                      onChange={(e) => {
                        const newSettings = { ...settings, auto_sync_enabled: e.target.checked }
                        localStorage.setItem('manychat_settings', JSON.stringify(newSettings))
                        setSettings(newSettings)
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* Configuration Modal */}
        {showConfigModal && (
          <Modal
            title="Configurar ManyChat"
            onClose={() => setShowConfigModal(false)}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key *
                </label>
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Ingresa tu API Key de ManyChat"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Webhook Secret *
                </label>
                <Input
                  type="password"
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  placeholder="Ingresa tu Webhook Secret"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Channel ID (Opcional)
                </label>
                <Input
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  placeholder="Ingresa tu Channel ID"
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> Puedes encontrar estos valores en tu cuenta de ManyChat
                  en Settings → API.
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowConfigModal(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleConnect}>
                  {settings?.connected ? 'Actualizar' : 'Conectar'}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </PageContainer>
    </AppShell>
  )
}
