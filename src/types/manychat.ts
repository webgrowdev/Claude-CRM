// =============================================
// MANYCHAT TYPES
// =============================================
// Complete TypeScript types for ManyChat integration

export type ManyChatSource = 'instagram' | 'whatsapp' | 'messenger' | 'telegram'
export type ManyChatSubscriptionStatus = 'subscribed' | 'unsubscribed'

// Subscriber information from ManyChat API
export interface ManyChatSubscriber {
  subscriber_id: string
  first_name: string
  last_name: string
  name?: string // full name
  email?: string
  phone?: string
  source: ManyChatSource
  tags: string[]
  custom_fields: Record<string, any>
  last_message_date?: string
  subscription_status: ManyChatSubscriptionStatus
  created_at?: string
  updated_at?: string
  instagram_username?: string
  whatsapp_number?: string
}

// Webhook payload received from ManyChat
export interface ManyChatWebhookPayload {
  subscriber_id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  source?: ManyChatSource
  tags?: string[]
  custom_fields?: Record<string, any>
  event?: string
  timestamp?: string
}

// Response from ManyChat API
export interface ManyChatApiResponse<T = any> {
  status: 'success' | 'error'
  data?: T
  error?: string
  message?: string
}

// Send message payload
export interface ManyChatSendMessagePayload {
  subscriber_id: string
  message: string
  tag?: string
}

// Tag operation payload
export interface ManyChatTagPayload {
  subscriber_id: string
  tag: string
}

// Custom field payload
export interface ManyChatCustomFieldPayload {
  subscriber_id: string
  field: string
  value: any
}

// Sync operation result
export interface ManyChatSyncResult {
  success: boolean
  synced_count: number
  created_count: number
  updated_count: number
  failed_count: number
  errors?: string[]
  timestamp: string
}

// Webhook log entry
export interface ManyChatWebhookLog {
  id: string
  subscriber_id: string
  event_type: string
  payload: any
  processed: boolean
  created_at: string
  patient_id?: string
  error?: string
}

// Settings for ManyChat integration
export interface ManyChatIntegrationSettings {
  connected: boolean
  api_key?: string
  webhook_secret?: string
  channel_id?: string
  auto_create_patients: boolean
  auto_sync_enabled: boolean
  sync_interval_hours?: number
  last_sync_at?: string
  default_assignee?: string
  webhook_url?: string
}
