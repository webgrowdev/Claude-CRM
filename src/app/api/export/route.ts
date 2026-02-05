import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAuth } from '@/lib/middleware'

// POST /api/export - Export data to CSV/Excel
export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const { type, format = 'csv', dateRange, includeFields } = body

    if (!type) {
      return NextResponse.json(
        { error: 'Tipo de exportación requerido' },
        { status: 400 }
      )
    }

    let data: any[] = []
    let headers: string[] = []

    // Fetch data based on type
    switch (type) {
      case 'patients':
        const { data: patients, error: patientsError } = await supabase
          .from('patients')
          .select('*')
          .eq('clinic_id', user.clinicId)
          .gte('created_at', dateRange?.start || '2000-01-01')
          .lte('created_at', dateRange?.end || '2099-12-31')

        if (patientsError) throw patientsError

        data = patients || []
        headers = includeFields || ['name', 'email', 'phone', 'source', 'status', 'created_at']
        break

      case 'appointments':
        const { data: appointments, error: appointmentsError } = await supabase
          .from('appointments')
          .select(`
            *,
            patients (name),
            users (name)
          `)
          .eq('clinic_id', user.clinicId)
          .gte('scheduled_at', dateRange?.start || '2000-01-01')
          .lte('scheduled_at', dateRange?.end || '2099-12-31')

        if (appointmentsError) throw appointmentsError

        data = appointments?.map(apt => ({
          ...apt,
          patientName: apt.patients?.name,
          doctorName: apt.users?.name,
        })) || []
        headers = includeFields || ['patientName', 'doctorName', 'scheduled_at', 'appointment_status', 'duration']
        break

      case 'revenue':
        // TODO: Implement revenue export when payments table exists
        data = []
        headers = includeFields || ['date', 'treatment', 'patient', 'amount', 'status']
        break

      default:
        return NextResponse.json(
          { error: 'Tipo de exportación no válido' },
          { status: 400 }
        )
    }

    // Generate CSV
    if (format === 'csv') {
      const csvContent = generateCSV(data, headers)
      
      // Log export activity
      await supabase.from('activity_logs').insert({
        clinic_id: user.clinicId,
        user_id: user.userId,
        action_type: 'view', // or 'export'
        resource_type: type as any,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent'),
      })

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${type}-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    // TODO: Implement Excel export
    if (format === 'excel') {
      return NextResponse.json(
        { error: 'Exportación a Excel no implementada aún' },
        { status: 501 }
      )
    }

    return NextResponse.json(
      { error: 'Formato de exportación no válido' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Error al exportar datos' },
      { status: 500 }
    )
  }
})

function generateCSV(data: any[], headers: string[]): string {
  if (data.length === 0) {
    return headers.join(',') + '\n'
  }

  // Header row
  const headerRow = headers.join(',')

  // Data rows
  const dataRows = data.map(item => {
    return headers.map(header => {
      const value = item[header]
      
      // Handle different value types
      if (value === null || value === undefined) {
        return ''
      }
      
      // Handle dates
      if (value instanceof Date || (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/))) {
        return new Date(value).toISOString().split('T')[0]
      }

      // Handle arrays
      if (Array.isArray(value)) {
        return `"${value.join(', ')}"`
      }

      // Handle objects
      if (typeof value === 'object') {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`
      }

      // Escape commas and quotes
      const stringValue = String(value)
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }

      return stringValue
    }).join(',')
  })

  return [headerRow, ...dataRows].join('\n')
}
