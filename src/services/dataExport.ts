import { Lead, Payment, Appointment, ExportFormat, ExportOptions } from '@/types'
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
  leads: Lead[],
  fields: string[] = ['name', 'email', 'phone', 'status', 'source', 'treatments', 'createdAt']
): string {
  const data = leads.map(lead => ({
    name: lead.name,
    email: lead.email || '',
    phone: lead.phone,
    identificationNumber: lead.identificationNumber || '',
    status: lead.status,
    source: lead.source,
    treatments: lead.treatments.join(', '),
    notes: lead.notes.length,
    followUps: lead.followUps.length,
    totalPaid: lead.totalPaid || 0,
    totalPending: lead.totalPending || 0,
    score: lead.score?.total || 0,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
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
export function downloadLeadsCSV(leads: Lead[], filename?: string): void {
  const csv = exportLeadsToCSV(leads)
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
export function downloadLeadsExcel(leads: Lead[], filename?: string): void {
  const data = leads.map(lead => ({
    Nombre: lead.name,
    Email: lead.email || '',
    Teléfono: lead.phone,
    DNI: lead.identificationNumber || '',
    Estado: lead.status,
    Fuente: lead.source,
    Tratamientos: lead.treatments.join(', '),
    'Total Pagado': lead.totalPaid || 0,
    'Total Pendiente': lead.totalPending || 0,
    Puntuación: lead.score?.total || 0,
    'Fecha Creación': lead.createdAt,
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
  leads: Lead[],
  payments: Payment[],
  language: 'en' | 'es' = 'es'
): string {
  const totalLeads = leads.length
  const closedLeads = leads.filter(l => l.status === 'closed').length
  const conversionRate = totalLeads > 0 ? (closedLeads / totalLeads * 100).toFixed(1) : '0'
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
Total de pacientes: ${totalLeads}
Pacientes cerrados: ${closedLeads}
Tasa de conversión: ${conversionRate}%

INGRESOS
--------
Total facturado: $${totalRevenue.toLocaleString()}
Pagos pendientes: $${pendingPayments.toLocaleString()}

POR ESTADO
----------
${['new', 'contacted', 'scheduled', 'closed', 'lost'].map(status => {
  const count = leads.filter(l => l.status === status).length
  return `${status}: ${count}`
}).join('\n')}
`
  }

  return `CRM SUMMARY
===========
Date: ${format(new Date(), 'MM/dd/yyyy HH:mm')}

PATIENTS
--------
Total patients: ${totalLeads}
Closed patients: ${closedLeads}
Conversion rate: ${conversionRate}%

REVENUE
-------
Total billed: $${totalRevenue.toLocaleString()}
Pending payments: $${pendingPayments.toLocaleString()}

BY STATUS
---------
${['new', 'contacted', 'scheduled', 'closed', 'lost'].map(status => {
  const count = leads.filter(l => l.status === status).length
  return `${status}: ${count}`
}).join('\n')}
`
}

/**
 * Download summary report
 */
export function downloadReportSummary(
  leads: Lead[],
  payments: Payment[],
  language: 'en' | 'es' = 'es'
): void {
  const summary = generateReportSummary(leads, payments, language)
  const dateStr = format(new Date(), 'yyyy-MM-dd')
  const filename = language === 'es'
    ? `resumen_crm_${dateStr}.txt`
    : `crm_summary_${dateStr}.txt`
  downloadFile(summary, filename, 'text/plain')
}
