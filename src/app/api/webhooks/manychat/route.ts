import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase.server'
import { verifyWebhookRequest } from '@/lib/manychat-verify'
import { ManyChatWebhookPayload } from '@/types/manychat'

// Type guard to validate source field
function isValidSource(source: string | undefined): source is 'instagram' | 'whatsapp' | 'phone' | 'website' | 'referral' | 'other' {
  if (!source) return false
  return ['instagram', 'whatsapp', 'phone', 'website', 'referral', 'other'].includes(source)
}

// Convert ManyChat source to CRM source
function convertSource(source: string | undefined): 'instagram' | 'whatsapp' | 'phone' | 'website' | 'referral' | 'other' {
  if (isValidSource(source)) {
    return source
  }
  return 'other'
}

// POST /api/webhooks/manychat
// Receives webhook data from ManyChat in real-time
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    
    // Get raw body for signature verification
    const bodyText = await request.text()
    let payload: ManyChatWebhookPayload
    
    try {
      payload = JSON.parse(bodyText)
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!payload.subscriber_id || !payload.first_name) {
      return NextResponse.json(
        { error: 'Invalid webhook payload - missing required fields' },
        { status: 400 }
      )
    }

    // Verify webhook signature and rate limit
    const signature = request.headers.get('x-manychat-signature')
    const timestamp = request.headers.get('x-manychat-timestamp')
    
    const verification = verifyWebhookRequest(
      bodyText,
      signature,
      timestamp,
      payload.subscriber_id
    )

    if (!verification.valid) {
      console.error('Webhook verification failed:', verification.error)
      return NextResponse.json(
        { error: verification.error || 'Webhook verification failed' },
        { status: 403 }
      )
    }

    // Determine clinic_id from webhook authentication
    const webhookSecret = request.headers.get('X-Webhook-Secret') || request.headers.get('x-webhook-secret')
    const clinicIdParam = new URL(request.url).searchParams.get('clinic_id')

    let clinicId: string | null = null

    if (clinicIdParam) {
      // Verify clinic exists
      const { data: clinic } = await supabaseAdmin
        .from('clinics')
        .select('id')
        .eq('id', clinicIdParam)
        .single()
      if (clinic) clinicId = clinic.id
    } else if (webhookSecret) {
      // Look up clinic by webhook secret
      const { data: settings } = await supabaseAdmin
        .from('manychat_settings')
        .select('clinic_id')
        .eq('webhook_secret', webhookSecret)
        .single()
      if (settings) clinicId = settings.clinic_id
    }

    if (!clinicId) {
      // Fallback to env variable for backward compatibility
      clinicId = process.env.NEXT_PUBLIC_DEFAULT_CLINIC_ID || null
    }

    if (!clinicId) {
      console.error('Could not determine clinic_id')
      return NextResponse.json(
        { error: 'Could not determine clinic. Provide clinic_id param or configure webhook secret.' },
        { status: 400 }
      )
    }

    // Check if patient already exists by phone or subscriber_id
    const { data: existingPatients } = await supabaseAdmin
      .from('patients')
      .select('id, name, phone, email, manychat_subscriber_id')
      .eq('clinic_id', clinicId)
      .or(`phone.eq.${payload.phone},manychat_subscriber_id.eq.${payload.subscriber_id}`)
      .limit(1)

    const existingPatient = existingPatients?.[0]

    // Prepare patient data
    const patientData = {
      name: `${payload.first_name} ${payload.last_name || ''}`.trim(),
      phone: payload.phone || '',
      email: payload.email,
      source: convertSource(payload.source),
      status: 'new' as const,
      manychat_subscriber_id: payload.subscriber_id,
      manychat_tags: payload.tags || [],
      manychat_custom_fields: payload.custom_fields || {},
      last_contact_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    let patientId: string
    let action: 'create' | 'update'

    if (existingPatient) {
      // Update existing patient
      const { error } = await supabaseAdmin
        .from('patients')
        .update(patientData)
        .eq('id', existingPatient.id)

      if (error) {
        console.error('Error updating patient:', error)
        return NextResponse.json(
          { error: 'Error updating patient' },
          { status: 500 }
        )
      }

      patientId = existingPatient.id
      action = 'update'
    } else {
      // Create new patient
      const { data: newPatient, error } = await supabaseAdmin
        .from('patients')
        .insert({
          ...patientData,
          clinic_id: clinicId,
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (error) {
        console.error('Error creating patient:', error)
        return NextResponse.json(
          { error: 'Error creating patient' },
          { status: 500 }
        )
      }

      patientId = newPatient.id
      action = 'create'
    }

    // Log activity
    await supabaseAdmin.from('activity_logs').insert({
      clinic_id: clinicId,
      action_type: action,
      resource_type: 'patient',
      resource_id: patientId,
      description: `Patient ${action === 'create' ? 'created' : 'updated'} from ManyChat webhook`,
      changes: {
        source: 'manychat',
        subscriber_id: payload.subscriber_id,
        tags: payload.tags,
        custom_fields: payload.custom_fields,
      },
      created_at: new Date().toISOString(),
    })

    // Log webhook received
    await supabaseAdmin.from('manychat_webhook_logs').insert({
      clinic_id: clinicId,
      subscriber_id: payload.subscriber_id,
      event_type: payload.event || 'webhook_received',
      payload: payload,
      processed: true,
      patient_id: patientId,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      action,
      patientId,
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
    timestamp: new Date().toISOString(),
  })
}
