// ManyChat Integration Service
// This service handles webhook integration with ManyChat for lead automation

import { ManyChatWebhook, ManyChatSettings, Lead, LeadSource } from '@/types'

const SETTINGS_KEY = 'clinic_manychat_settings'

// Default settings
const defaultSettings: ManyChatSettings = {
  connected: false,
  autoCreateLeads: true,
}

// Get current settings from localStorage
export function getManyChatSettings(): ManyChatSettings {
  if (typeof window === 'undefined') return defaultSettings
  const stored = localStorage.getItem(SETTINGS_KEY)
  if (!stored) return defaultSettings
  try {
    return JSON.parse(stored)
  } catch {
    return defaultSettings
  }
}

// Save settings to localStorage
export function saveManyChatSettings(settings: ManyChatSettings): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

// Generate webhook URL for ManyChat
export function generateWebhookUrl(): string {
  if (typeof window === 'undefined') return ''

  // In production, this would be your API endpoint
  const baseUrl = window.location.origin
  return `${baseUrl}/api/webhooks/manychat`
}

// Configure ManyChat connection
export function configureManyChatIntegration(
  apiKey: string,
  botId: string
): ManyChatSettings {
  const webhookUrl = generateWebhookUrl()

  const settings: ManyChatSettings = {
    connected: true,
    apiKey,
    botId,
    webhookUrl,
    autoCreateLeads: true,
  }

  saveManyChatSettings(settings)
  return settings
}

// Disconnect ManyChat
export function disconnectManyChat(): void {
  saveManyChatSettings(defaultSettings)
}

// Process incoming ManyChat webhook
export function processManyChatWebhook(
  payload: ManyChatWebhook,
  onLeadCreate: (leadData: Partial<Lead>) => void
): void {
  const settings = getManyChatSettings()

  if (!settings.connected || !settings.autoCreateLeads) {
    console.warn('ManyChat integration not active')
    return
  }

  switch (payload.type) {
    case 'new_subscriber':
    case 'contact_info_shared':
      // Create a new lead from the subscriber
      onLeadCreate({
        name: payload.subscriber.name || 'Nuevo Lead',
        phone: payload.subscriber.phone || '',
        email: payload.subscriber.email,
        source: determineSource(payload.subscriber),
        status: 'new',
        treatments: payload.data?.treatment ? [payload.data.treatment] : [],
        assignedTo: settings.defaultAssignee,
      })
      break

    case 'appointment_requested':
      // Create a lead with scheduled status
      onLeadCreate({
        name: payload.subscriber.name || 'Nuevo Lead',
        phone: payload.subscriber.phone || '',
        email: payload.subscriber.email,
        source: determineSource(payload.subscriber),
        status: 'scheduled',
        treatments: payload.data?.treatment ? [payload.data.treatment] : [],
        assignedTo: settings.defaultAssignee,
      })
      break

    case 'message_received':
    case 'button_clicked':
      // These events could update existing leads or trigger notifications
      console.log('ManyChat event received:', payload.type)
      break

    default:
      console.log('Unknown ManyChat event type:', payload.type)
  }
}

// Determine lead source from subscriber data
function determineSource(subscriber: ManyChatWebhook['subscriber']): LeadSource {
  if (subscriber.instagram) {
    return 'instagram'
  }
  if (subscriber.phone?.startsWith('521')) {
    return 'whatsapp'
  }
  return 'other'
}

// Send message via ManyChat
export async function sendManyChatMessage(
  subscriberId: string,
  message: string
): Promise<boolean> {
  const settings = getManyChatSettings()

  if (!settings.connected || !settings.apiKey) {
    console.warn('ManyChat not connected')
    return false
  }

  try {
    const response = await fetch(
      `https://api.manychat.com/fb/sending/sendContent`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${settings.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriber_id: subscriberId,
          data: {
            version: 'v2',
            content: {
              messages: [
                {
                  type: 'text',
                  text: message,
                },
              ],
            },
          },
        }),
      }
    )

    return response.ok
  } catch (error) {
    console.error('Failed to send ManyChat message:', error)
    return false
  }
}

// Send template message via ManyChat
export async function sendManyChatTemplate(
  subscriberId: string,
  flowNs: string
): Promise<boolean> {
  const settings = getManyChatSettings()

  if (!settings.connected || !settings.apiKey) {
    return false
  }

  try {
    const response = await fetch(
      `https://api.manychat.com/fb/sending/sendFlow`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${settings.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriber_id: subscriberId,
          flow_ns: flowNs,
        }),
      }
    )

    return response.ok
  } catch (error) {
    console.error('Failed to send ManyChat template:', error)
    return false
  }
}

// Get subscriber info from ManyChat
export async function getManyChatSubscriber(
  subscriberId: string
): Promise<ManyChatWebhook['subscriber'] | null> {
  const settings = getManyChatSettings()

  if (!settings.connected || !settings.apiKey) {
    return null
  }

  try {
    const response = await fetch(
      `https://api.manychat.com/fb/subscriber/getInfo?subscriber_id=${subscriberId}`,
      {
        headers: {
          Authorization: `Bearer ${settings.apiKey}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to get subscriber info')
    }

    const data = await response.json()
    return {
      id: data.data.id,
      name: data.data.name || `${data.data.first_name} ${data.data.last_name}`.trim(),
      phone: data.data.phone,
      email: data.data.email,
    }
  } catch (error) {
    console.error('Failed to get ManyChat subscriber:', error)
    return null
  }
}

// Webhook handler for API route
export function createWebhookHandler(onLeadCreate: (leadData: Partial<Lead>) => void) {
  return async function handler(req: Request): Promise<Response> {
    const settings = getManyChatSettings()

    if (!settings.connected) {
      return new Response(
        JSON.stringify({ error: 'ManyChat integration not configured' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    try {
      const payload = await req.json() as ManyChatWebhook

      // Validate payload
      if (!payload.type || !payload.subscriber) {
        return new Response(
          JSON.stringify({ error: 'Invalid webhook payload' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }

      // Process the webhook
      processManyChatWebhook(payload, onLeadCreate)

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    } catch (error) {
      console.error('Error processing ManyChat webhook:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }
}

// Generate auto-response templates
export const autoResponseTemplates = {
  welcome: (clinicName: string) =>
    `¡Hola! 👋 Gracias por contactar a ${clinicName}. Un asesor te contactará en breve. ¿En qué tratamiento estás interesado/a?`,

  appointmentConfirm: (date: string, time: string) =>
    `✅ ¡Perfecto! Tu cita ha sido agendada para el ${date} a las ${time}. Te enviaremos un recordatorio un día antes. ¿Necesitas algo más?`,

  priceInquiry: (treatment: string, price: number) =>
    `El tratamiento de ${treatment} tiene un costo de $${price.toLocaleString('es-MX')} MXN. ¿Te gustaría agendar una cita de valoración gratuita?`,

  followUp: (name: string) =>
    `¡Hola ${name}! 👋 Queríamos saber cómo te sientes después de tu tratamiento. ¿Todo bien? ¿Tienes alguna duda?`,

  reminder: (date: string, time: string) =>
    `⏰ Recordatorio: Tu cita es mañana ${date} a las ${time}. ¿Confirmas tu asistencia? Responde SI o NO.`,
}
