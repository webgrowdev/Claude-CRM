'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout'
import { KanbanView } from '@/components/patients/KanbanView'
import { useApp } from '@/contexts/AppContext'
import { useLanguage } from '@/i18n'
import { formatCurrency } from '@/lib/utils'
import { Patient } from '@/types'

export default function KanbanPage() {
  const router = useRouter()
  const { state } = useApp()
  const { t } = useLanguage()

  const handlePatientClick = (patient: Patient) => {
    router.push(`/pacientes?id=${patient.id}`)
  }

  // Calculate totals for header
  const totals = useMemo(() => {
    const activePatients = state.patients.filter(
      (p) => p.status !== 'closed' && p.status !== 'lost'
    ).length
    const totalValue = state.patients
      .filter((p) => p.status === 'closed')
      .reduce((sum, p) => sum + (p.value || 0), 0)
    return { activePatients, totalValue }
  }, [state.patients])

  return (
    <AppShell>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4 lg:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-display font-bold text-slate-800">
                {t.nav.pipeline}
              </h1>
              <p className="text-sm text-slate-500">
                {totals.activePatients} {t.patients.totalPatients.replace('en total', 'activos')}
              </p>
            </div>
            {totals.totalValue > 0 && (
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  {t.dashboard.closedSales}
                </p>
                <p className="text-lg font-bold text-success-600">
                  {formatCurrency(totals.totalValue)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <KanbanView
        patients={state.patients}
        onPatientClick={handlePatientClick}
        className="h-[calc(100vh-120px-64px)] lg:h-[calc(100vh-120px)]"
      />
    </AppShell>
  )
}
