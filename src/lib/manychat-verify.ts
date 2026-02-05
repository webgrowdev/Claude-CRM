// =============================================
// MANYCHAT WEBHOOK SIGNATURE VERIFICATION
// =============================================
// Security middleware for verifying ManyChat webhook requests

import crypto from 'crypto'

/**
 * Verify HMAC-SHA256 signature from ManyChat webhook
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')

    // Use timingSafeEqual to prevent timing attacks
    const signatureBuffer = Buffer.from(signature)
    const expectedBuffer = Buffer.from(expectedSignature)

    if (signatureBuffer.length !== expectedBuffer.length) {
      return false
    }

    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  } catch (error) {
    console.error('Error verifying webhook signature:', error)
    return false
  }
}

/**
 * Validate webhook timestamp to prevent replay attacks
 * Rejects requests older than 5 minutes
 */
export function validateTimestamp(timestamp: string | number, maxAgeMinutes: number = 5): boolean {
  try {
    const requestTime = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp
    const currentTime = Math.floor(Date.now() / 1000)
    const difference = currentTime - requestTime

    // Reject if older than maxAgeMinutes
    return difference < maxAgeMinutes * 60
  } catch (error) {
    console.error('Error validating timestamp:', error)
    return false
  }
}

/**
 * Rate limiting tracker (in-memory, simple implementation)
 * In production, use Redis or similar
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

/**
 * Check rate limit for subscriber
 * Allows maxRequests per windowMinutes
 */
export function checkRateLimit(
  subscriberId: string,
  maxRequests: number = 10,
  windowMinutes: number = 1
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const windowMs = windowMinutes * 60 * 1000

  const entry = rateLimitMap.get(subscriberId)

  if (!entry || entry.resetAt < now) {
    // Create new entry or reset expired one
    rateLimitMap.set(subscriberId, {
      count: 1,
      resetAt: now + windowMs,
    })
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: now + windowMs,
    }
  }

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    }
  }

  entry.count++
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetAt,
  }
}

/**
 * Clean up expired rate limit entries
 * Should be called periodically
 */
export function cleanupRateLimits(): void {
  const now = Date.now()
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetAt < now) {
      rateLimitMap.delete(key)
    }
  }
}

/**
 * Get webhook secret from environment
 */
export function getWebhookSecret(): string {
  const secret = process.env.MANYCHAT_WEBHOOK_SECRET
  if (!secret) {
    throw new Error('MANYCHAT_WEBHOOK_SECRET not configured')
  }
  return secret
}

/**
 * Verify complete webhook request
 */
export function verifyWebhookRequest(
  payload: string,
  signature: string | null,
  timestamp: string | number | null,
  subscriberId: string
): {
  valid: boolean
  error?: string
  rateLimit?: { allowed: boolean; remaining: number; resetAt: number }
} {
  // Check signature if provided
  if (signature) {
    try {
      const secret = getWebhookSecret()
      if (!verifyWebhookSignature(payload, signature, secret)) {
        return {
          valid: false,
          error: 'Invalid webhook signature',
        }
      }
    } catch (error) {
      // If secret not configured, skip signature verification
      console.warn('Webhook secret not configured, skipping signature verification')
    }
  }

  // Validate timestamp if provided
  if (timestamp) {
    if (!validateTimestamp(timestamp)) {
      return {
        valid: false,
        error: 'Webhook timestamp too old (possible replay attack)',
      }
    }
  }

  // Check rate limit
  const rateLimit = checkRateLimit(subscriberId)
  if (!rateLimit.allowed) {
    return {
      valid: false,
      error: 'Rate limit exceeded',
      rateLimit,
    }
  }

  return {
    valid: true,
    rateLimit,
  }
}

// Cleanup rate limits every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimits, 5 * 60 * 1000)
}
