import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/middleware'
import { getSubscribers } from '@/lib/manychat'
import { ManyChatSubscriber } from '@/types/manychat'

// POST /api/sync/manychat
// Manual synchronization of all ManyChat subscribers
export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    const { page = 1, limit = 100 } = await request.json().catch(() => ({}))

    // Get subscribers from ManyChat
    const result = await getSubscribers(page, limit)

    if (result.status === 'error') {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch subscribers from ManyChat' },
        { status: 500 }
      )
    }

    const subscribers = result.data || []
    const syncResults = {
      total: subscribers.length,
      created: 0,
      updated: 0,
      failed: 0,
      errors: [] as string[],
    }

    // Process each subscriber
    for (const subscriber of subscribers) {
      try {
        await syncSubscriber(subscriber, user.clinicId, syncResults)
      } catch (error) {
        syncResults.failed++
        syncResults.errors.push(
          `Failed to sync subscriber ${subscriber.subscriber_id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }

    // Log sync activity
    await supabaseAdmin.from('activity_logs').insert({
      clinic_id: user.clinicId,
      user_id: user.userId,
      action_type: 'sync',
      resource_type: 'patient',
      description: `ManyChat sync completed: ${syncResults.created} created, ${syncResults.updated} updated, ${syncResults.failed} failed`,
      changes: {
        source: 'manychat',
        results: syncResults,
      },
      created_at: new Date().toISOString(),
    })

    // Update integration settings with last sync time
    await supabaseAdmin
      .from('manychat_settings')
      .upsert({
        clinic_id: user.clinicId,
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'clinic_id',
      })

    return NextResponse.json({
      success: true,
      message: 'Synchronization completed',
      results: syncResults,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('ManyChat sync error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

/**
 * Sync a single subscriber to the database
 */
async function syncSubscriber(
  subscriber: ManyChatSubscriber,
  clinicId: string,
  results: { created: number; updated: number; failed: number }
): Promise<void> {
  // Check if patient exists
  const { data: existingPatients } = await supabaseAdmin
    .from('patients')
    .select('id')
    .eq('clinic_id', clinicId)
    .eq('manychat_subscriber_id', subscriber.subscriber_id)
    .limit(1)

  const existingPatient = existingPatients?.[0]

  // Prepare patient data
  const patientData = {
    name: subscriber.name || `${subscriber.first_name} ${subscriber.last_name}`.trim(),
    phone: subscriber.phone || '',
    email: subscriber.email,
    source: (subscriber.source as any) || 'other',
    manychat_subscriber_id: subscriber.subscriber_id,
    manychat_tags: subscriber.tags || [],
    manychat_custom_fields: subscriber.custom_fields || {},
    manychat_subscription_status: subscriber.subscription_status,
    manychat_last_message_date: subscriber.last_message_date,
    last_contact_at: subscriber.last_message_date || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  if (existingPatient) {
    // Update existing patient
    const { error } = await supabaseAdmin
      .from('patients')
      .update(patientData)
      .eq('id', existingPatient.id)

    if (error) throw error
    results.updated++
  } else {
    // Create new patient
    const { error } = await supabaseAdmin
      .from('patients')
      .insert({
        ...patientData,
        clinic_id: clinicId,
        status: 'new',
        created_at: new Date().toISOString(),
      })

    if (error) throw error
    results.created++
  }
}

// GET /api/sync/manychat
// Get sync status and history
export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    // Get last sync time
    const { data: settings } = await supabaseAdmin
      .from('manychat_settings')
      .select('last_sync_at, auto_sync_enabled, sync_interval_hours')
      .eq('clinic_id', user.clinicId)
      .single()

    // Get recent sync activity logs
    const { data: syncLogs } = await supabaseAdmin
      .from('activity_logs')
      .select('*')
      .eq('clinic_id', user.clinicId)
      .eq('resource_type', 'patient')
      .eq('action_type', 'sync')
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      success: true,
      lastSyncAt: settings?.last_sync_at,
      autoSyncEnabled: settings?.auto_sync_enabled || false,
      syncIntervalHours: settings?.sync_interval_hours || 24,
      recentSyncs: syncLogs || [],
    })
  } catch (error) {
    console.error('Error fetching sync status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
