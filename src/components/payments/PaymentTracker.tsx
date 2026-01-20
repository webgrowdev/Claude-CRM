'use client'

import { useState, useMemo } from 'react'
import {
  DollarSign,
  Plus,
  CreditCard,
  Banknote,
  Building,
  Smartphone,
  MoreHorizontal,
  Receipt,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
  Trash2,
} from 'lucide-react'
import { Button, Modal, Input, Select, TextArea } from '@/components/ui'
import { useLanguage } from '@/i18n/LanguageContext'
import { Payment, PaymentMethod, PaymentStatus, Treatment } from '@/types'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { es, enUS } from 'date-fns/locale'

interface PaymentTrackerProps {
  payments: Payment[]
  leadId: string
  treatments: Treatment[]
  onAddPayment: (payment: Omit<Payment, 'id' | 'createdAt'>) => void
  onDeletePayment?: (paymentId: string) => void
  totalTreatmentValue?: number
}

const methodIcons: Record<PaymentMethod, React.ReactNode> = {
  cash: <Banknote className="w-4 h-4" />,
  card: <CreditCard className="w-4 h-4" />,
  transfer: <Building className="w-4 h-4" />,
  mercadopago: <Smartphone className="w-4 h-4" />,
  other: <MoreHorizontal className="w-4 h-4" />,
}

const statusIcons: Record<PaymentStatus, React.ReactNode> = {
  paid: <CheckCircle className="w-4 h-4 text-green-500" />,
  pending: <Clock className="w-4 h-4 text-amber-500" />,
  partial: <AlertCircle className="w-4 h-4 text-blue-500" />,
  refunded: <Receipt className="w-4 h-4 text-purple-500" />,
  cancelled: <X className="w-4 h-4 text-red-500" />,
}

export function PaymentTracker({
  payments,
  leadId,
  treatments,
  onAddPayment,
  onDeletePayment,
  totalTreatmentValue = 0,
}: PaymentTrackerProps) {
  const { language } = useLanguage()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [newPayment, setNewPayment] = useState({
    treatmentId: '',
    amount: '',
    method: 'cash' as PaymentMethod,
    status: 'paid' as PaymentStatus,
    reference: '',
    notes: '',
  })

  const t = {
    title: language === 'es' ? 'Registro de Pagos' : 'Payment Tracking',
    addPayment: language === 'es' ? 'Registrar Pago' : 'Add Payment',
    totalPaid: language === 'es' ? 'Total Pagado' : 'Total Paid',
    totalPending: language === 'es' ? 'Pendiente' : 'Pending',
    noPayments: language === 'es' ? 'Sin pagos registrados' : 'No payments recorded',
    amount: language === 'es' ? 'Monto' : 'Amount',
    method: language === 'es' ? 'Método de Pago' : 'Payment Method',
    status: language === 'es' ? 'Estado' : 'Status',
    treatment: language === 'es' ? 'Tratamiento' : 'Treatment',
    reference: language === 'es' ? 'Referencia / Comprobante' : 'Reference / Receipt',
    notes: language === 'es' ? 'Notas' : 'Notes',
    history: language === 'es' ? 'Historial de Pagos' : 'Payment History',
    methods: {
      cash: language === 'es' ? 'Efectivo' : 'Cash',
      card: language === 'es' ? 'Tarjeta' : 'Card',
      transfer: language === 'es' ? 'Transferencia' : 'Transfer',
      mercadopago: 'MercadoPago',
      other: language === 'es' ? 'Otro' : 'Other',
    },
    statuses: {
      paid: language === 'es' ? 'Pagado' : 'Paid',
      pending: language === 'es' ? 'Pendiente' : 'Pending',
      partial: language === 'es' ? 'Parcial' : 'Partial',
      refunded: language === 'es' ? 'Reembolsado' : 'Refunded',
      cancelled: language === 'es' ? 'Cancelado' : 'Cancelled',
    },
    selectTreatment: language === 'es' ? 'Seleccionar tratamiento' : 'Select treatment',
    optional: language === 'es' ? 'opcional' : 'optional',
    save: language === 'es' ? 'Guardar' : 'Save',
    cancel: language === 'es' ? 'Cancelar' : 'Cancel',
    delete: language === 'es' ? 'Eliminar' : 'Delete',
  }

  const stats = useMemo(() => {
    const totalPaid = payments
      .filter(p => p.status === 'paid' || p.status === 'partial')
      .reduce((sum, p) => sum + p.amount, 0)
    const totalPending = totalTreatmentValue - totalPaid
    return { totalPaid, totalPending: Math.max(0, totalPending) }
  }, [payments, totalTreatmentValue])

  const sortedPayments = useMemo(() => {
    return [...payments].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [payments])

  const handleAddPayment = () => {
    if (!newPayment.amount || parseFloat(newPayment.amount) <= 0) return

    const selectedTreatment = treatments.find(t => t.id === newPayment.treatmentId)

    onAddPayment({
      leadId,
      treatmentId: newPayment.treatmentId || undefined,
      treatmentName: selectedTreatment?.name,
      amount: parseFloat(newPayment.amount),
      method: newPayment.method,
      status: newPayment.status,
      reference: newPayment.reference || undefined,
      notes: newPayment.notes || undefined,
      createdBy: 'current-user', // Would come from context
    })

    setNewPayment({
      treatmentId: '',
      amount: '',
      method: 'cash',
      status: 'paid',
      reference: '',
      notes: '',
    })
    setShowAddModal(false)
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-green-700 mb-1">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs font-medium">{t.totalPaid}</span>
          </div>
          <p className="text-2xl font-bold text-green-800">
            ${stats.totalPaid.toLocaleString()}
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-700 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-medium">{t.totalPending}</span>
          </div>
          <p className="text-2xl font-bold text-amber-800">
            ${stats.totalPending.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Add Payment Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50 transition-all flex items-center justify-center gap-2 font-medium"
      >
        <Plus className="w-5 h-5" />
        {t.addPayment}
      </button>

      {/* Payment History Toggle */}
      {payments.length > 0 && (
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <span className="font-medium text-slate-700">{t.history}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">{payments.length}</span>
            {showHistory ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </button>
      )}

      {/* Payment History List */}
      {showHistory && payments.length > 0 && (
        <div className="space-y-2">
          {sortedPayments.map((payment) => (
            <div
              key={payment.id}
              className="p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'p-2 rounded-lg',
                    payment.status === 'paid' ? 'bg-green-100' :
                    payment.status === 'pending' ? 'bg-amber-100' :
                    payment.status === 'partial' ? 'bg-blue-100' :
                    payment.status === 'refunded' ? 'bg-purple-100' :
                    'bg-red-100'
                  )}>
                    {methodIcons[payment.method]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900">
                        ${payment.amount.toLocaleString()}
                      </p>
                      {statusIcons[payment.status]}
                    </div>
                    <p className="text-sm text-slate-500">
                      {t.methods[payment.method]}
                      {payment.treatmentName && ` • ${payment.treatmentName}`}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {format(new Date(payment.createdAt), 'PPP', {
                        locale: language === 'es' ? es : enUS
                      })}
                    </p>
                    {payment.reference && (
                      <p className="text-xs text-slate-500 mt-1">
                        Ref: {payment.reference}
                      </p>
                    )}
                  </div>
                </div>
                {onDeletePayment && (
                  <button
                    onClick={() => onDeletePayment(payment.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {payments.length === 0 && (
        <div className="text-center py-6 text-slate-500 text-sm">
          {t.noPayments}
        </div>
      )}

      {/* Add Payment Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={t.addPayment}
      >
        <div className="space-y-4">
          <Input
            label={t.amount}
            type="number"
            placeholder="0.00"
            value={newPayment.amount}
            onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
            required
          />

          <Select
            label={t.method}
            value={newPayment.method}
            onChange={(value) => setNewPayment({ ...newPayment, method: value as PaymentMethod })}
            options={[
              { value: 'cash', label: t.methods.cash },
              { value: 'card', label: t.methods.card },
              { value: 'transfer', label: t.methods.transfer },
              { value: 'mercadopago', label: t.methods.mercadopago },
              { value: 'other', label: t.methods.other },
            ]}
          />

          <Select
            label={t.status}
            value={newPayment.status}
            onChange={(value) => setNewPayment({ ...newPayment, status: value as PaymentStatus })}
            options={[
              { value: 'paid', label: t.statuses.paid },
              { value: 'pending', label: t.statuses.pending },
              { value: 'partial', label: t.statuses.partial },
            ]}
          />

          {treatments.length > 0 && (
            <Select
              label={`${t.treatment} (${t.optional})`}
              value={newPayment.treatmentId}
              onChange={(value) => setNewPayment({ ...newPayment, treatmentId: value })}
              options={[
                { value: '', label: t.selectTreatment },
                ...treatments.map(treatment => ({
                  value: treatment.id,
                  label: `${treatment.name} - $${treatment.price.toLocaleString()}`,
                })),
              ]}
            />
          )}

          <Input
            label={`${t.reference} (${t.optional})`}
            placeholder="TXN-12345"
            value={newPayment.reference}
            onChange={(e) => setNewPayment({ ...newPayment, reference: e.target.value })}
          />

          <TextArea
            label={`${t.notes} (${t.optional})`}
            placeholder={language === 'es' ? 'Notas adicionales...' : 'Additional notes...'}
            value={newPayment.notes}
            onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
          />

          <div className="flex gap-3 pt-2">
            <Button variant="outline" fullWidth onClick={() => setShowAddModal(false)}>
              {t.cancel}
            </Button>
            <Button fullWidth onClick={handleAddPayment}>
              {t.save}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
