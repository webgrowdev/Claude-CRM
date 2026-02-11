import { Patient, Payment, Appointment, ExportFormat, ExportOptions } from '@/types'
import { format } from 'date-fns'

/**
 * Convert data to CSV format
 */
function toCSV(data: Record<string, unknown>[], fields: string[]): string {
  // Header row
  const header = fields.join(',')

  // Data rows
  const rows = data.map(item => {
    return fields.map(field => {
      const value = item[field]
      if (value === null || value === undefined) return ''
      if (typeof value === 'string') {
        // Escape quotes and wrap in quotes if contains comma
        const escaped = value.replace(/"/g, '""')
        return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')
          ? `"${escaped}"`
          : escaped
      }
      if (value instanceof Date) {
        return format(value, 'yyyy-MM-dd HH:mm:ss')
      }
      if (Array.isArray(value)) {
        return `"${value.join(', ')}"`
      }
      return String(value)
    }).join(',')
  })

  return [header, ...rows].join('\n')
}

/**
 * Export leads/patients to CSV
 */
export function exportLeadsToCSV(
  patients: Patient[],
  fields: string[] = ['name', 'email', 'phone', 'status', 'source', 'treatments', 'createdAt']
): string {
  const data = patients.map(patient => ({
    name: patient.name,
    email: patient.email || '',
    phone: patient.phone,
    identificationNumber: patient.identificationNumber || '',
    status: patient.status,
    source: patient.source,
    treatments: patient.treatments.join(', '),
    notes: patient.notes.length,
    followUps: patient.followUps.length,
    totalPaid: patient.totalPaid || 0,
    totalPending: patient.totalPending || 0,
    score: patient.score?.total || 0,
    createdAt: patient.createdAt,
    updatedAt: patient.updatedAt,
  }))

  return toCSV(data as Record<string, unknown>[], fields)
}

/**
 * Export payments to CSV
 */
export function exportPaymentsToCSV(
  payments: Payment[],
  fields: string[] = ['treatmentName', 'amount', 'method', 'status', 'reference', 'createdAt']
): string {
  const data = payments.map(payment => ({
    treatmentName: payment.treatmentName || '',
    amount: payment.amount,
    method: payment.method,
    status: payment.status,
    reference: payment.reference || '',
    notes: payment.notes || '',
    createdAt: payment.createdAt,
    createdBy: payment.createdBy,
  }))

  return toCSV(data as Record<string, unknown>[], fields)
}

/**
 * Download a file
 */
export function downloadFile(content: string, filename: string, type: string = 'text/csv'): void {
  const blob = new Blob([content], { type: `${type};charset=utf-8;` })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export leads to CSV file and download
 */
export function downloadLeadsCSV(patients: Patient[], filename?: string): void {
  const csv = exportLeadsToCSV(patients)
  const dateStr = format(new Date(), 'yyyy-MM-dd')
  downloadFile(csv, filename || `patients_export_${dateStr}.csv`)
}

/**
 * Export payments to CSV file and download
 */
export function downloadPaymentsCSV(payments: Payment[], filename?: string): void {
  const csv = exportPaymentsToCSV(payments)
  const dateStr = format(new Date(), 'yyyy-MM-dd')
  downloadFile(csv, filename || `payments_export_${dateStr}.csv`)
}

/**
 * Generate Excel-compatible XML (simplified Excel export)
 */
export function exportToExcelXML(
  data: Record<string, unknown>[],
  sheetName: string = 'Sheet1'
): string {
  if (data.length === 0) return ''

  const fields = Object.keys(data[0])

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="${sheetName}">
    <Table>`

  // Header row
  xml += '\n      <Row>'
  fields.forEach(field => {
    xml += `\n        <Cell><Data ss:Type="String">${escapeXML(field)}</Data></Cell>`
  })
  xml += '\n      </Row>'

  // Data rows
  data.forEach(item => {
    xml += '\n      <Row>'
    fields.forEach(field => {
      const value = item[field]
      const type = typeof value === 'number' ? 'Number' : 'String'
      const displayValue = value instanceof Date
        ? format(value, 'yyyy-MM-dd HH:mm:ss')
        : Array.isArray(value)
        ? value.join(', ')
        : String(value ?? '')
      xml += `\n        <Cell><Data ss:Type="${type}">${escapeXML(displayValue)}</Data></Cell>`
    })
    xml += '\n      </Row>'
  })

  xml += `
    </Table>
  </Worksheet>
</Workbook>`

  return xml
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Export leads to Excel-compatible XML and download
 */
export function downloadLeadsExcel(patients: Patient[], filename?: string): void {
  const data = patients.map(patient => ({
    Nombre: patient.name,
    Email: patient.email || '',
    Teléfono: patient.phone,
    DNI: patient.identificationNumber || '',
    Estado: patient.status,
    Fuente: patient.source,
    Tratamientos: patient.treatments.join(', '),
    'Total Pagado': patient.totalPaid || 0,
    'Total Pendiente': patient.totalPending || 0,
    Puntuación: patient.score?.total || 0,
    'Fecha Creación': patient.createdAt,
  }))

  const xml = exportToExcelXML(data as Record<string, unknown>[], 'Pacientes')
  const dateStr = format(new Date(), 'yyyy-MM-dd')
  downloadFile(
    xml,
    filename || `patients_export_${dateStr}.xls`,
    'application/vnd.ms-excel'
  )
}

/**
 * Export report data summary
 */
export function generateReportSummary(
  patients: Patient[],
  payments: Payment[],
  language: 'en' | 'es' = 'es'
): string {
  const totalPatients = patients.length
  const closedPatients = patients.filter(p => p.status === 'closed').length
  const conversionRate = totalPatients > 0 ? (closedPatients / totalPatients * 100).toFixed(1) : '0'
  const totalRevenue = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0)
  const pendingPayments = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0)

  if (language === 'es') {
    return `RESUMEN DEL CRM
================
Fecha: ${format(new Date(), 'dd/MM/yyyy HH:mm')}

PACIENTES
---------
Total de pacientes: ${totalPatients}
Pacientes cerrados: ${closedPatients}
Tasa de conversión: ${conversionRate}%

INGRESOS
--------
Total facturado: $${totalRevenue.toLocaleString()}
Pagos pendientes: $${pendingPayments.toLocaleString()}

POR ESTADO
----------
${['new', 'contacted', 'scheduled', 'closed', 'lost'].map(status => {
  const count = patients.filter(p => p.status === status).length
  return `${status}: ${count}`
}).join('\n')}
`
  }

  return `CRM SUMMARY
===========
Date: ${format(new Date(), 'MM/dd/yyyy HH:mm')}

PATIENTS
--------
Total patients: ${totalPatients}
Closed patients: ${closedPatients}
Conversion rate: ${conversionRate}%

REVENUE
-------
Total billed: $${totalRevenue.toLocaleString()}
Pending payments: $${pendingPayments.toLocaleString()}

BY STATUS
---------
${['new', 'contacted', 'scheduled', 'closed', 'lost'].map(status => {
  const count = patients.filter(p => p.status === status).length
  return `${status}: ${count}`
}).join('\n')}
`
}

/**
 * Download summary report
 */
export function downloadReportSummary(
  patients: Patient[],
  payments: Payment[],
  language: 'en' | 'es' = 'es'
): void {
  const summary = generateReportSummary(patients, payments, language)
  const dateStr = format(new Date(), 'yyyy-MM-dd')
  const filename = language === 'es'
    ? `resumen_crm_${dateStr}.txt`
    : `crm_summary_${dateStr}.txt`
  downloadFile(summary, filename, 'text/plain')
}
