import { NextRequest, NextResponse } from 'next/server'

// API for external systems to create appointments
// This endpoint allows clinic management systems to schedule in-person appointments

export interface CreateAppointmentRequest {
  // Patient identification - required
  patientIdentificationNumber: string

  // Or create new patient with these fields
  patientName?: string
  patientPhone?: string
  patientEmail?: string

  // Appointment details - required
  scheduledAt: string // ISO 8601 date string
  duration?: number // minutes, default 30

  // Optional
  treatmentId?: string
  treatmentName?: string
  notes?: string

  // API authentication
  apiKey?: string
}

export interface CreateAppointmentResponse {
  success: boolean
  appointmentId?: string
  patientId?: string
  message?: string
  error?: string
}

// GET - List appointments for a date range
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const patientId = searchParams.get('patientId')
    const identificationNumber = searchParams.get('identificationNumber')

    // In a real implementation, you would:
    // 1. Validate API key from headers
    // 2. Query your database for appointments
    // 3. Filter by date range and/or patient

    // For now, return a sample response structure
    return NextResponse.json({
      success: true,
      appointments: [],
      message: 'API endpoint ready. Connect to database for real data.',
      usage: {
        description: 'Query appointments by date range or patient',
        params: {
          startDate: 'ISO 8601 date string (optional)',
          endDate: 'ISO 8601 date string (optional)',
          patientId: 'Patient ID in CRM (optional)',
          identificationNumber: 'Patient DNI/ID number (optional)',
        },
        headers: {
          'X-API-Key': 'Your API key for authentication',
        },
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// POST - Create a new appointment
export async function POST(request: NextRequest) {
  try {
    const body: CreateAppointmentRequest = await request.json()

    // Validate required fields
    if (!body.patientIdentificationNumber && !body.patientName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Either patientIdentificationNumber or patientName is required',
        },
        { status: 400 }
      )
    }

    if (!body.scheduledAt) {
      return NextResponse.json(
        {
          success: false,
          error: 'scheduledAt is required (ISO 8601 format)',
        },
        { status: 400 }
      )
    }

    // Validate date format
    const appointmentDate = new Date(body.scheduledAt)
    if (isNaN(appointmentDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid date format. Use ISO 8601 (e.g., 2024-01-15T14:30:00Z)',
        },
        { status: 400 }
      )
    }

    // In a real implementation, you would:
    // 1. Validate API key from headers: request.headers.get('X-API-Key')
    // 2. Look up patient by identification number
    // 3. Create patient if not found (when patientName is provided)
    // 4. Create the appointment/follow-up
    // 5. Return the created appointment ID

    // Generate mock IDs for response
    const appointmentId = `apt-${Date.now()}`
    const patientId = `lead-${Date.now()}`

    return NextResponse.json({
      success: true,
      appointmentId,
      patientId,
      message: 'Appointment created successfully',
      data: {
        scheduledAt: body.scheduledAt,
        duration: body.duration || 30,
        treatmentName: body.treatmentName,
        notes: body.notes,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// PUT - Update appointment status (attendance)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    const { appointmentId, status, notes } = body

    if (!appointmentId) {
      return NextResponse.json(
        {
          success: false,
          error: 'appointmentId is required',
        },
        { status: 400 }
      )
    }

    const validStatuses = ['pending', 'attended', 'noshow', 'cancelled', 'rescheduled']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // In a real implementation, you would:
    // 1. Validate API key
    // 2. Find the appointment
    // 3. Update the status
    // 4. Return confirmation

    return NextResponse.json({
      success: true,
      message: `Appointment ${appointmentId} updated`,
      data: {
        appointmentId,
        status: status || 'pending',
        notes,
        updatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// DELETE - Cancel an appointment
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const appointmentId = searchParams.get('appointmentId')

    if (!appointmentId) {
      return NextResponse.json(
        {
          success: false,
          error: 'appointmentId query parameter is required',
        },
        { status: 400 }
      )
    }

    // In a real implementation, you would:
    // 1. Validate API key
    // 2. Find the appointment
    // 3. Mark as cancelled or delete
    // 4. Return confirmation

    return NextResponse.json({
      success: true,
      message: `Appointment ${appointmentId} cancelled`,
      data: {
        appointmentId,
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
