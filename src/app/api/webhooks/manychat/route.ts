import { NextRequest, NextResponse } from 'next/server'
import { ManyChatWebhook } from '@/types'

// POST /api/webhooks/manychat
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json() as ManyChatWebhook

    // Validate payload
    if (!payload.type || !payload.subscriber) {
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      )
    }

    // Log the webhook for debugging
    console.log('ManyChat webhook received:', {
      type: payload.type,
      subscriberId: payload.subscriber.id,
      subscriberName: payload.subscriber.name,
    })

    // In a real implementation, you would:
    // 1. Verify the webhook signature (if ManyChat provides one)
    // 2. Store the lead data in a database
    // 3. Send notifications to the CRM users
    // 4. Trigger any automated workflows

    // For now, we'll just acknowledge receipt
    // The actual lead creation happens client-side via localStorage

    return NextResponse.json({
      success: true,
      message: 'Webhook received successfully',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error processing ManyChat webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/webhooks/manychat - For webhook verification
export async function GET(request: NextRequest) {
  // ManyChat may ping this endpoint to verify it's active
  return NextResponse.json({
    status: 'active',
    service: 'Clinic CRM - ManyChat Integration',
    version: '1.0.0',
  })
}
