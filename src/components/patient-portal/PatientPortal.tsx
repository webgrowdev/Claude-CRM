'use client'

import { useState, useMemo } from 'react'
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  User,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  Star,
  Bell,
  Settings,
  LogOut,
  Syringe,
  CreditCard,
  Download,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, Button, Badge, Avatar, Modal, TextArea } from '@/components/ui'
import { useLanguage } from '@/i18n/LanguageContext'

// Types
export interface PatientAppointment {
  id: string
  date: Date
  time: string
  duration: number
  treatment: string
  doctor: string
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed'
  location?: string
  notes?: string
  canCancel: boolean
  canReschedule: boolean
}

export interface PatientTreatment {
  id: string
  name: string
  date: Date
  status: 'completed' | 'in_progress' | 'scheduled'
  cost: number
  paid: number
  documents?: string[]
}

export interface PatientNotification {
  id: string
  title: string
  message: string
  date: Date
  read: boolean
  type: 'appointment' | 'payment' | 'document' | 'general'
}

interface PatientPortalProps {
  patient: {
    id: string
    name: string
    email: string
    phone: string
    avatar?: string
  }
  appointments: PatientAppointment[]
  treatments: PatientTreatment[]
  notifications: PatientNotification[]
  onCancelAppointment: (id: string, reason: string) => void
  onRescheduleAppointment: (id: string) => void
  onContactClinic: (message: string) => void
  onMarkNotificationRead: (id: string) => void
}

export function PatientPortal({
  patient,
  appointments,
  treatments,
  notifications,
  onCancelAppointment,
  onRescheduleAppointment,
  onContactClinic,
  onMarkNotificationRead,
}: PatientPortalProps) {
  const { language } = useLanguage()
  const [activeTab, setActiveTab] = useState<'home' | 'appointments' | 'treatments' | 'messages'>('home')
  const [showCancelModal, setShowCancelModal] = useState<string | null>(null)
  const [showContactModal, setShowContactModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [contactMessage, setContactMessage] = useState('')

  const t = {
    welcome: language === 'es' ? 'Bienvenido' : 'Welcome',
    home: language === 'es' ? 'Inicio' : 'Home',
    myAppointments: language === 'es' ? 'Mis Citas' : 'My Appointments',
    myTreatments: language === 'es' ? 'Mis Tratamientos' : 'My Treatments',
    messages: language === 'es' ? 'Mensajes' : 'Messages',
    upcomingAppointments: language === 'es' ? 'Próximas Citas' : 'Upcoming Appointments',
    noAppointments: language === 'es' ? 'No tienes citas programadas' : 'No scheduled appointments',
    scheduleNow: language === 'es' ? 'Agendar ahora' : 'Schedule now',
    confirmed: language === 'es' ? 'Confirmada' : 'Confirmed',
    pending: language === 'es' ? 'Pendiente' : 'Pending',
    cancelled: language === 'es' ? 'Cancelada' : 'Cancelled',
    completed: language === 'es' ? 'Completada' : 'Completed',
    cancel: language === 'es' ? 'Cancelar' : 'Cancel',
    reschedule: language === 'es' ? 'Reagendar' : 'Reschedule',
    cancelAppointment: language === 'es' ? 'Cancelar Cita' : 'Cancel Appointment',
    cancelReason: language === 'es' ? 'Motivo de cancelación' : 'Cancellation reason',
    confirmCancel: language === 'es' ? 'Confirmar Cancelación' : 'Confirm Cancellation',
    contactUs: language === 'es' ? 'Contáctanos' : 'Contact Us',
    sendMessage: language === 'es' ? 'Enviar Mensaje' : 'Send Message',
    messagePlaceholder: language === 'es' ? '¿En qué podemos ayudarte?' : 'How can we help you?',
    paymentStatus: language === 'es' ? 'Estado de Pago' : 'Payment Status',
    paid: language === 'es' ? 'Pagado' : 'Paid',
    pending_payment: language === 'es' ? 'Pendiente' : 'Pending',
    viewDetails: language === 'es' ? 'Ver detalles' : 'View details',
    quickActions: language === 'es' ? 'Acciones Rápidas' : 'Quick Actions',
    notifications: language === 'es' ? 'Notificaciones' : 'Notifications',
  }

  // Filter upcoming appointments
  const upcomingAppointments = useMemo(() => {
    const now = new Date()
    return appointments
      .filter(apt => new Date(apt.date) >= now && apt.status !== 'cancelled')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3)
  }, [appointments])

  // Unread notifications count
  const unreadCount = notifications.filter(n => !n.read).length

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: 'success' | 'warning' | 'error' | 'default'; label: string }> = {
      confirmed: { variant: 'success', label: t.confirmed },
      pending: { variant: 'warning', label: t.pending },
      cancelled: { variant: 'error', label: t.cancelled },
      completed: { variant: 'default', label: t.completed },
    }
    const config = statusMap[status] || statusMap.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const handleCancelSubmit = () => {
    if (showCancelModal && cancelReason.trim()) {
      onCancelAppointment(showCancelModal, cancelReason)
      setShowCancelModal(null)
      setCancelReason('')
    }
  }

  const handleContactSubmit = () => {
    if (contactMessage.trim()) {
      onContactClinic(contactMessage)
      setShowContactModal(false)
      setContactMessage('')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar name={patient.name} size="md" />
            <div>
              <p className="text-sm text-slate-500">{t.welcome},</p>
              <p className="font-semibold text-slate-800">{patient.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {activeTab === 'home' && (
          <div className="space-y-6">
            {/* Upcoming Appointments */}
            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-3">{t.upcomingAppointments}</h2>
              {upcomingAppointments.length === 0 ? (
                <Card className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500 mb-4">{t.noAppointments}</p>
                  <Button>{t.scheduleNow}</Button>
                </Card>
              ) : (
                <div className="space-y-3">
                  {upcomingAppointments.map(apt => (
                    <Card key={apt.id} className="hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 bg-primary-100 rounded-xl flex flex-col items-center justify-center text-primary-600">
                          <span className="text-lg font-bold">
                            {new Date(apt.date).getDate()}
                          </span>
                          <span className="text-xs uppercase">
                            {new Date(apt.date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { month: 'short' })}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium text-slate-800">{apt.treatment}</h3>
                              <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                                <User className="w-3.5 h-3.5" />
                                {apt.doctor}
                              </p>
                            </div>
                            {getStatusBadge(apt.status)}
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {apt.time} ({apt.duration} min)
                            </span>
                            {apt.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {apt.location}
                              </span>
                            )}
                          </div>
                          {(apt.canCancel || apt.canReschedule) && (
                            <div className="flex gap-2 mt-3">
                              {apt.canReschedule && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onRescheduleAppointment(apt.id)}
                                >
                                  {t.reschedule}
                                </Button>
                              )}
                              {apt.canCancel && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 hover:bg-red-50"
                                  onClick={() => setShowCancelModal(apt.id)}
                                >
                                  {t.cancel}
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* Quick Actions */}
            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-3">{t.quickActions}</h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowContactModal(true)}
                  className="p-4 bg-white rounded-xl shadow-card hover:shadow-card-hover transition-shadow text-left"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="font-medium text-slate-800">{t.contactUs}</p>
                </button>
                <button className="p-4 bg-white rounded-xl shadow-card hover:shadow-card-hover transition-shadow text-left">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="font-medium text-slate-800">{t.scheduleNow}</p>
                </button>
                <button className="p-4 bg-white rounded-xl shadow-card hover:shadow-card-hover transition-shadow text-left">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mb-2">
                    <CreditCard className="w-5 h-5 text-amber-600" />
                  </div>
                  <p className="font-medium text-slate-800">{t.paymentStatus}</p>
                </button>
                <button className="p-4 bg-white rounded-xl shadow-card hover:shadow-card-hover transition-shadow text-left">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="font-medium text-slate-800">{language === 'es' ? 'Documentos' : 'Documents'}</p>
                </button>
              </div>
            </section>

            {/* Recent Treatments */}
            {treatments.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-slate-800 mb-3">{t.myTreatments}</h2>
                <div className="space-y-3">
                  {treatments.slice(0, 3).map(treatment => (
                    <Card key={treatment.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <Syringe className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{treatment.name}</p>
                          <p className="text-sm text-slate-500">
                            {new Date(treatment.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {treatment.paid < treatment.cost ? (
                          <Badge variant="warning">{t.pending_payment}</Badge>
                        ) : (
                          <Badge variant="success">{t.paid}</Badge>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">{t.myAppointments}</h2>
            {appointments.length === 0 ? (
              <Card className="text-center py-8">
                <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500">{t.noAppointments}</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {appointments.map(apt => (
                  <Card key={apt.id}>
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        'w-14 h-14 rounded-xl flex flex-col items-center justify-center',
                        apt.status === 'completed' ? 'bg-green-100 text-green-600' :
                        apt.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                        'bg-primary-100 text-primary-600'
                      )}>
                        <span className="text-lg font-bold">
                          {new Date(apt.date).getDate()}
                        </span>
                        <span className="text-xs uppercase">
                          {new Date(apt.date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { month: 'short' })}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <h3 className="font-medium text-slate-800">{apt.treatment}</h3>
                          {getStatusBadge(apt.status)}
                        </div>
                        <p className="text-sm text-slate-500 mt-1">{apt.doctor}</p>
                        <p className="text-sm text-slate-600 mt-1">
                          {apt.time} • {apt.duration} min
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'treatments' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">{t.myTreatments}</h2>
            <div className="space-y-3">
              {treatments.map(treatment => (
                <Card key={treatment.id}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Syringe className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-800">{treatment.name}</h3>
                        <p className="text-sm text-slate-500">
                          {new Date(treatment.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(treatment.status)}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div>
                      <p className="text-sm text-slate-500">{t.paymentStatus}</p>
                      <p className="font-medium text-slate-800">
                        ${treatment.paid.toLocaleString()} / ${treatment.cost.toLocaleString()}
                      </p>
                    </div>
                    <Button size="sm" variant="outline">
                      {t.viewDetails}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 safe-area-bottom">
        <div className="max-w-4xl mx-auto flex items-center justify-around h-16">
          {([
            { id: 'home', icon: <User className="w-5 h-5" />, label: t.home },
            { id: 'appointments', icon: <Calendar className="w-5 h-5" />, label: t.myAppointments },
            { id: 'treatments', icon: <Syringe className="w-5 h-5" />, label: t.myTreatments },
            { id: 'messages', icon: <MessageCircle className="w-5 h-5" />, label: t.messages },
          ] as const).map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full py-2 transition-colors',
                activeTab === item.id ? 'text-primary-600' : 'text-slate-400'
              )}
            >
              {item.icon}
              <span className="text-[10px] mt-1">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Cancel Modal */}
      <Modal
        isOpen={!!showCancelModal}
        onClose={() => setShowCancelModal(null)}
        title={t.cancelAppointment}
      >
        <div className="space-y-4">
          <p className="text-slate-600">
            {language === 'es'
              ? '¿Estás seguro de que deseas cancelar esta cita?'
              : 'Are you sure you want to cancel this appointment?'}
          </p>
          <TextArea
            placeholder={t.cancelReason}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setShowCancelModal(null)}>
              {language === 'es' ? 'Volver' : 'Go back'}
            </Button>
            <Button variant="danger" fullWidth onClick={handleCancelSubmit}>
              {t.confirmCancel}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Contact Modal */}
      <Modal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        title={t.contactUs}
      >
        <div className="space-y-4">
          <TextArea
            placeholder={t.messagePlaceholder}
            value={contactMessage}
            onChange={(e) => setContactMessage(e.target.value)}
            className="min-h-[120px]"
          />
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setShowContactModal(false)}>
              {language === 'es' ? 'Cancelar' : 'Cancel'}
            </Button>
            <Button fullWidth onClick={handleContactSubmit}>
              {t.sendMessage}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
