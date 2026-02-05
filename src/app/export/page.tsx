'use client'

import { useState } from 'react'
import { Download, FileSpreadsheet, Calendar, DollarSign, Users } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { format } from 'date-fns'

type ExportType = 'patients' | 'appointments' | 'revenue'
type ExportFormat = 'csv' | 'excel'

export default function ExportPage() {
  const [exportType, setExportType] = useState<ExportType>('patients')
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv')
  const [dateRange, setDateRange] = useState({
    start: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  })
  const [includeFields, setIncludeFields] = useState<string[]>([])
  const [isExporting, setIsExporting] = useState(false)

  const patientFields = [
    { id: 'name', label: 'Nombre' },
    { id: 'email', label: 'Email' },
    { id: 'phone', label: 'Teléfono' },
    { id: 'source', label: 'Fuente' },
    { id: 'status', label: 'Estado' },
    { id: 'createdAt', label: 'Fecha de Registro' },
    { id: 'lastContact', label: 'Último Contacto' },
    { id: 'value', label: 'Valor' },
  ]

  const appointmentFields = [
    { id: 'patientName', label: 'Paciente' },
    { id: 'doctorName', label: 'Doctor' },
    { id: 'treatment', label: 'Tratamiento' },
    { id: 'date', label: 'Fecha' },
    { id: 'time', label: 'Hora' },
    { id: 'status', label: 'Estado' },
    { id: 'duration', label: 'Duración' },
    { id: 'notes', label: 'Notas' },
  ]

  const revenueFields = [
    { id: 'date', label: 'Fecha' },
    { id: 'treatment', label: 'Tratamiento' },
    { id: 'patient', label: 'Paciente' },
    { id: 'amount', label: 'Monto' },
    { id: 'paymentMethod', label: 'Método de Pago' },
    { id: 'status', label: 'Estado' },
  ]

  const handleExport = async () => {
    setIsExporting(true)

    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: exportType,
          format: exportFormat,
          dateRange,
          includeFields,
        }),
      })

      if (response.ok) {
        // Download file
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${exportType}-${format(new Date(), 'yyyy-MM-dd')}.${exportFormat}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } else {
        console.error('Export failed')
        alert('Error al exportar datos. Por favor intenta de nuevo.')
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Error de conexión. Por favor intenta de nuevo.')
    } finally {
      setIsExporting(false)
    }
  }

  const getFieldsForType = () => {
    switch (exportType) {
      case 'patients':
        return patientFields
      case 'appointments':
        return appointmentFields
      case 'revenue':
        return revenueFields
      default:
        return []
    }
  }

  const toggleField = (fieldId: string) => {
    if (includeFields.includes(fieldId)) {
      setIncludeFields(includeFields.filter(f => f !== fieldId))
    } else {
      setIncludeFields([...includeFields, fieldId])
    }
  }

  const selectAllFields = () => {
    const allFields = getFieldsForType().map(f => f.id)
    setIncludeFields(allFields)
  }

  const clearAllFields = () => {
    setIncludeFields([])
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Exportar Datos</h1>
        <p className="text-slate-500 text-sm">
          Descarga tus datos en formato CSV o Excel
        </p>
      </div>

      <div className="space-y-6">
        {/* Export Type Selection */}
        <Card>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            ¿Qué datos deseas exportar?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setExportType('patients')}
              className={`p-4 border-2 rounded-lg transition-all ${
                exportType === 'patients'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-slate-200 hover:border-primary-300'
              }`}
            >
              <Users className={`w-8 h-8 mx-auto mb-2 ${
                exportType === 'patients' ? 'text-primary-600' : 'text-slate-400'
              }`} />
              <h3 className="font-semibold text-slate-800">Pacientes</h3>
              <p className="text-xs text-slate-500 mt-1">
                Lista completa de pacientes
              </p>
            </button>

            <button
              onClick={() => setExportType('appointments')}
              className={`p-4 border-2 rounded-lg transition-all ${
                exportType === 'appointments'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-slate-200 hover:border-primary-300'
              }`}
            >
              <Calendar className={`w-8 h-8 mx-auto mb-2 ${
                exportType === 'appointments' ? 'text-primary-600' : 'text-slate-400'
              }`} />
              <h3 className="font-semibold text-slate-800">Citas</h3>
              <p className="text-xs text-slate-500 mt-1">
                Historial de citas
              </p>
            </button>

            <button
              onClick={() => setExportType('revenue')}
              className={`p-4 border-2 rounded-lg transition-all ${
                exportType === 'revenue'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-slate-200 hover:border-primary-300'
              }`}
            >
              <DollarSign className={`w-8 h-8 mx-auto mb-2 ${
                exportType === 'revenue' ? 'text-primary-600' : 'text-slate-400'
              }`} />
              <h3 className="font-semibold text-slate-800">Ingresos</h3>
              <p className="text-xs text-slate-500 mt-1">
                Reporte de ingresos
              </p>
            </button>
          </div>
        </Card>

        {/* Format Selection */}
        <Card>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Formato de Exportación
          </h2>
          <div className="flex space-x-4">
            <button
              onClick={() => setExportFormat('csv')}
              className={`flex-1 p-4 border-2 rounded-lg transition-all ${
                exportFormat === 'csv'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-slate-200 hover:border-primary-300'
              }`}
            >
              <FileSpreadsheet className={`w-6 h-6 mx-auto mb-2 ${
                exportFormat === 'csv' ? 'text-primary-600' : 'text-slate-400'
              }`} />
              <h3 className="font-semibold text-slate-800">CSV</h3>
              <p className="text-xs text-slate-500 mt-1">
                Compatible con Excel, Google Sheets
              </p>
            </button>

            <button
              onClick={() => setExportFormat('excel')}
              className={`flex-1 p-4 border-2 rounded-lg transition-all ${
                exportFormat === 'excel'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-slate-200 hover:border-primary-300'
              }`}
            >
              <FileSpreadsheet className={`w-6 h-6 mx-auto mb-2 ${
                exportFormat === 'excel' ? 'text-primary-600' : 'text-slate-400'
              }`} />
              <h3 className="font-semibold text-slate-800">Excel</h3>
              <p className="text-xs text-slate-500 mt-1">
                Formato XLSX nativo
              </p>
            </button>
          </div>
        </Card>

        {/* Date Range */}
        <Card>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Rango de Fechas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Desde
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Hasta
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
          </div>
        </Card>

        {/* Field Selection */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">
              Campos a Incluir
            </h2>
            <div className="space-x-2">
              <Button variant="ghost" size="sm" onClick={selectAllFields}>
                Seleccionar todos
              </Button>
              <Button variant="ghost" size="sm" onClick={clearAllFields}>
                Limpiar
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {getFieldsForType().map(field => (
              <label
                key={field.id}
                className="flex items-center space-x-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={includeFields.includes(field.id)}
                  onChange={() => toggleField(field.id)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-slate-700">{field.label}</span>
              </label>
            ))}
          </div>
        </Card>

        {/* Export Button */}
        <Card className="bg-primary-50 border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-800 mb-1">
                ¿Listo para exportar?
              </h3>
              <p className="text-sm text-slate-600">
                {includeFields.length > 0 
                  ? `Se exportarán ${includeFields.length} campos`
                  : 'Selecciona al menos un campo para exportar'}
              </p>
            </div>
            <Button
              onClick={handleExport}
              disabled={includeFields.length === 0 || isExporting}
              loading={isExporting}
              size="lg"
            >
              <Download className="w-5 h-5 mr-2" />
              Exportar
            </Button>
          </div>
        </Card>

        {/* Info */}
        <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600">
          <p className="font-medium mb-2">📋 Nota:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Los datos se exportarán según el rango de fechas seleccionado</li>
            <li>El archivo se descargará automáticamente</li>
            <li>Los datos sensibles están protegidos según tu configuración de privacidad</li>
            <li>Máximo 10,000 registros por exportación</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
