// =============================================
// MANYCHAT API CLIENT LIBRARY
// =============================================
// Complete library for interacting with ManyChat API

import {
  ManyChatSubscriber,
  ManyChatApiResponse,
  ManyChatSendMessagePayload,
  ManyChatTagPayload,
  ManyChatCustomFieldPayload,
} from '@/types/manychat'

const MANYCHAT_API_BASE = 'https://api.manychat.com/fb'

/**
 * Get ManyChat API key from environment
 */
function getApiKey(): string {
  const apiKey = process.env.MANYCHAT_API_KEY
  if (!apiKey) {
    throw new Error('MANYCHAT_API_KEY not configured')
  }
  return apiKey
}

/**
 * Make request to ManyChat API
 */
async function manychatRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ManyChatApiResponse<T>> {
  const apiKey = getApiKey()
  
  const url = `${MANYCHAT_API_BASE}${endpoint}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const data = await response.json()

  if (!response.ok) {
    return {
      status: 'error',
      error: data.message || data.error || 'API request failed',
      data: data,
    }
  }

  return {
    status: 'success',
    data: data.data || data,
  }
}

/**
 * Get all subscribers
 */
export async function getSubscribers(
  page: number = 1,
  limit: number = 100
): Promise<ManyChatApiResponse<ManyChatSubscriber[]>> {
  try {
    return await manychatRequest<ManyChatSubscriber[]>(
      `/subscriber/findByName?page=${page}&count=${limit}`
    )
  } catch (error) {
    console.error('Failed to get subscribers:', error)
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get specific subscriber by ID
 */
export async function getSubscriber(
  subscriberId: string
): Promise<ManyChatApiResponse<ManyChatSubscriber>> {
  try {
    return await manychatRequest<ManyChatSubscriber>(
      `/subscriber/getInfo?subscriber_id=${subscriberId}`
    )
  } catch (error) {
    console.error('Failed to get subscriber:', error)
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send message to subscriber
 */
export async function sendMessage(
  subscriberId: string,
  message: string,
  tag?: string
): Promise<ManyChatApiResponse> {
  try {
    const payload: any = {
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
    }

    if (tag) {
      payload.tag = tag
    }

    return await manychatRequest('/sending/sendContent', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.error('Failed to send message:', error)
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Add tag to subscriber
 */
export async function addTag(
  subscriberId: string,
  tag: string
): Promise<ManyChatApiResponse> {
  try {
    return await manychatRequest('/subscriber/addTag', {
      method: 'POST',
      body: JSON.stringify({
        subscriber_id: subscriberId,
        tag_name: tag,
      }),
    })
  } catch (error) {
    console.error('Failed to add tag:', error)
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Remove tag from subscriber
 */
export async function removeTag(
  subscriberId: string,
  tag: string
): Promise<ManyChatApiResponse> {
  try {
    return await manychatRequest('/subscriber/removeTag', {
      method: 'POST',
      body: JSON.stringify({
        subscriber_id: subscriberId,
        tag_name: tag,
      }),
    })
  } catch (error) {
    console.error('Failed to remove tag:', error)
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Set custom field for subscriber
 */
export async function setCustomField(
  subscriberId: string,
  field: string,
  value: any
): Promise<ManyChatApiResponse> {
  try {
    return await manychatRequest('/subscriber/setCustomField', {
      method: 'POST',
      body: JSON.stringify({
        subscriber_id: subscriberId,
        field_name: field,
        field_value: value,
      }),
    })
  } catch (error) {
    console.error('Failed to set custom field:', error)
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get custom field value for subscriber
 */
export async function getCustomField(
  subscriberId: string,
  field: string
): Promise<ManyChatApiResponse<any>> {
  try {
    return await manychatRequest<any>(
      `/subscriber/getCustomField?subscriber_id=${subscriberId}&field_name=${field}`
    )
  } catch (error) {
    console.error('Failed to get custom field:', error)
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send flow (template) to subscriber
 */
export async function sendFlow(
  subscriberId: string,
  flowNamespace: string
): Promise<ManyChatApiResponse> {
  try {
    return await manychatRequest('/sending/sendFlow', {
      method: 'POST',
      body: JSON.stringify({
        subscriber_id: subscriberId,
        flow_ns: flowNamespace,
      }),
    })
  } catch (error) {
    console.error('Failed to send flow:', error)
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Add multiple tags to subscriber
 */
export async function addTags(
  subscriberId: string,
  tags: string[]
): Promise<ManyChatApiResponse[]> {
  const results = await Promise.all(
    tags.map(tag => addTag(subscriberId, tag))
  )
  return results
}

/**
 * Remove multiple tags from subscriber
 */
export async function removeTags(
  subscriberId: string,
  tags: string[]
): Promise<ManyChatApiResponse[]> {
  const results = await Promise.all(
    tags.map(tag => removeTag(subscriberId, tag))
  )
  return results
}

/**
 * Set multiple custom fields for subscriber
 */
export async function setCustomFields(
  subscriberId: string,
  fields: Record<string, any>
): Promise<ManyChatApiResponse[]> {
  const results = await Promise.all(
    Object.entries(fields).map(([field, value]) =>
      setCustomField(subscriberId, field, value)
    )
  )
  return results
}

/**
 * Check if API is configured
 */
export function isConfigured(): boolean {
  return !!process.env.MANYCHAT_API_KEY
}

/**
 * Get channel ID from environment
 */
export function getChannelId(): string | undefined {
  return process.env.MANYCHAT_CHANNEL_ID
}

/**
 * Get webhook secret from environment
 */
export function getWebhookSecret(): string | undefined {
  return process.env.MANYCHAT_WEBHOOK_SECRET
}
