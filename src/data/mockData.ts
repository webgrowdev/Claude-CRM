import { Lead, Treatment, User, FollowUp, Notification, DashboardStats, ReportData } from '@/types'

/**
 * @deprecated This file contains mock data for reference and testing only.
 * DO NOT import or use this data in production code.
 * All data should be loaded from the API endpoints instead.
 */

// ============================================================
// DEPRECATED: Current user - load from /api/auth/me instead
// ============================================================
/**
 * @deprecated Use GET /api/auth/me to load the current user
 */
export const currentUser: User = {
  id: 'user-1',
  name: 'María Santos',
  email: 'maria@glowclinic.com',
  role: 'owner',
  avatar: undefined,
}

// ============================================================
// DEPRECATED: Team members - load from /api/team instead
// ============================================================
export const teamMembers: User[] = [
  currentUser,
  {
    id: 'user-2',
    name: 'Jessica Thompson',
    email: 'jessica@glowclinic.com',
    role: 'receptionist',
  },
  {
    id: 'user-3',
    name: 'Ana García',
    email: 'ana@glowclinic.com',
    role: 'receptionist',
  },
]

// ============================================================
// REFERENCE ONLY: Treatments data
// Load from GET /api/treatments in production code
// ============================================================
export const treatments: Treatment[] = [
  {
    id: 'treat-1',
    name: 'Botox - Frente',
    category: 'Inyectables',
    price: 3500,
    duration: 30,
    description: 'Tratamiento de toxina botulínica para líneas de expresión en la frente',
  },
  {
    id: 'treat-2',
    name: 'Botox - Entrecejo',
    category: 'Inyectables',
    price: 2500,
    duration: 20,
    description: 'Tratamiento para líneas del entrecejo',
  },
  {
    id: 'treat-3',
    name: 'Botox - Patas de Gallo',
    category: 'Inyectables',
    price: 3000,
    duration: 25,
    description: 'Tratamiento para líneas alrededor de los ojos',
  },
  {
    id: 'treat-4',
    name: 'Relleno de Labios',
    category: 'Inyectables',
    price: 5500,
    duration: 45,
    description: 'Aumento y definición de labios con ácido hialurónico',
  },
  {
    id: 'treat-5',
    name: 'Depilación Láser - Axilas',
    category: 'Láser',
    price: 800,
    duration: 15,
    description: 'Sesión de depilación láser para axilas',
  },
  {
    id: 'treat-6',
    name: 'Depilación Láser - Piernas Completas',
    category: 'Láser',
    price: 2500,
    duration: 60,
    description: 'Sesión de depilación láser para piernas completas',
  },
  {
    id: 'treat-7',
    name: 'Depilación Láser - Bikini',
    category: 'Láser',
    price: 1200,
    duration: 20,
    description: 'Sesión de depilación láser para zona bikini',
  },
  {
    id: 'treat-8',
    name: 'Limpieza Facial Profunda',
    category: 'Facial',
    price: 1500,
    duration: 60,
    description: 'Limpieza facial con extracción y tratamiento hidratante',
  },
  {
    id: 'treat-9',
    name: 'Peeling Químico',
    category: 'Facial',
    price: 2000,
    duration: 45,
    description: 'Exfoliación química para renovación celular',
  },
  {
    id: 'treat-10',
    name: 'Microagujas',
    category: 'Facial',
    price: 3500,
    duration: 60,
    description: 'Tratamiento de microagujas para estimulación de colágeno',
  },
  {
    id: 'treat-11',
    name: 'Hidrafacial',
    category: 'Facial',
    price: 2500,
    duration: 50,
    description: 'Tratamiento de limpieza e hidratación profunda',
  },
  {
    id: 'treat-12',
    name: 'Contorno Corporal',
    category: 'Corporal',
    price: 4500,
    duration: 90,
    description: 'Tratamiento de radiofrecuencia para reducción de medidas',
  },
]

// Helper to create dates
const daysAgo = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}

const hoursAgo = (hours: number) => {
  const date = new Date()
  date.setHours(date.getHours() - hours)
  return date
}

const hoursFromNow = (hours: number) => {
  const date = new Date()
  date.setHours(date.getHours() + hours)
  return date
}

const daysFromNow = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date
}

// ============================================================
// DEPRECATED: Mock Leads data
// Load from GET /api/patients in production code
// ============================================================
/**
 * @deprecated Use GET /api/patients to load patients/leads
 */
export const initialLeads: Lead[] = [
  {
    id: 'lead-1',
    name: 'Sofía Ramírez',
    email: 'sofia.ramirez@email.com',
    phone: '+52 55 1234 5678',
    source: 'instagram',
    status: 'new',
    treatments: ['Botox - Frente', 'Botox - Entrecejo'],
    notes: [
      {
        id: 'note-1',
        content: 'Interesada en paquete de Botox completo. Preguntó por promociones.',
        createdAt: hoursAgo(2),
        createdBy: 'user-1',
      },
    ],
    followUps: [
      {
        id: 'fu-1',
        leadId: 'lead-1',
        type: 'call',
        scheduledAt: hoursFromNow(3),
        completed: false,
      },
    ],
    assignedTo: 'user-2',
    createdAt: hoursAgo(3),
    updatedAt: hoursAgo(2),
  },
  {
    id: 'lead-2',
    name: 'Andrea López',
    email: 'andrea.lopez@email.com',
    phone: '+52 55 2345 6789',
    source: 'whatsapp',
    status: 'new',
    treatments: ['Depilación Láser - Piernas Completas'],
    notes: [],
    followUps: [],
    assignedTo: 'user-2',
    createdAt: hoursAgo(1),
    updatedAt: hoursAgo(1),
  },
  {
    id: 'lead-3',
    name: 'Carmen Torres',
    email: 'carmen.t@email.com',
    phone: '+52 55 3456 7890',
    source: 'instagram',
    status: 'contacted',
    treatments: ['Hidrafacial', 'Limpieza Facial Profunda'],
    notes: [
      {
        id: 'note-2',
        content: 'Llamé y está interesada. Pidió que le envíe precios por WhatsApp.',
        createdAt: hoursAgo(5),
        createdBy: 'user-2',
      },
    ],
    followUps: [
      {
        id: 'fu-2',
        leadId: 'lead-3',
        type: 'message',
        scheduledAt: hoursFromNow(1),
        completed: false,
      },
    ],
    assignedTo: 'user-2',
    createdAt: daysAgo(1),
    updatedAt: hoursAgo(5),
  },
  {
    id: 'lead-4',
    name: 'Valentina Hernández',
    email: 'vale.h@email.com',
    phone: '+52 55 4567 8901',
    source: 'phone',
    status: 'contacted',
    treatments: ['Relleno de Labios'],
    notes: [
      {
        id: 'note-3',
        content: 'Primera vez que considera rellenos. Tiene algunas dudas sobre el proceso.',
        createdAt: daysAgo(1),
        createdBy: 'user-1',
      },
    ],
    followUps: [],
    assignedTo: 'user-1',
    createdAt: daysAgo(2),
    updatedAt: daysAgo(1),
  },
  {
    id: 'lead-5',
    name: 'Isabella Martínez',
    email: 'isabella.m@email.com',
    phone: '+52 55 5678 9012',
    source: 'instagram',
    status: 'scheduled',
    treatments: ['Botox - Frente', 'Botox - Patas de Gallo'],
    notes: [
      {
        id: 'note-4',
        content: 'Cita confirmada para valoración. Ya ha tenido Botox antes.',
        createdAt: daysAgo(2),
        createdBy: 'user-2',
      },
    ],
    followUps: [
      {
        id: 'fu-3',
        leadId: 'lead-5',
        type: 'meeting',
        scheduledAt: daysFromNow(2),
        completed: false,
        notes: 'Cita de valoración',
      },
    ],
    assignedTo: 'user-2',
    createdAt: daysAgo(3),
    updatedAt: daysAgo(2),
  },
  {
    id: 'lead-6',
    name: 'Gabriela Sánchez',
    email: 'gaby.s@email.com',
    phone: '+52 55 6789 0123',
    source: 'whatsapp',
    status: 'scheduled',
    treatments: ['Depilación Láser - Bikini', 'Depilación Láser - Axilas'],
    notes: [
      {
        id: 'note-5',
        content: 'Quiere paquete de 6 sesiones. Agendada para primera sesión.',
        createdAt: daysAgo(1),
        createdBy: 'user-3',
      },
    ],
    followUps: [
      {
        id: 'fu-4',
        leadId: 'lead-6',
        type: 'meeting',
        scheduledAt: daysFromNow(1),
        completed: false,
        notes: 'Primera sesión láser',
      },
    ],
    assignedTo: 'user-3',
    createdAt: daysAgo(4),
    updatedAt: daysAgo(1),
  },
  {
    id: 'lead-7',
    name: 'Daniela Flores',
    email: 'dani.flores@email.com',
    phone: '+52 55 7890 1234',
    source: 'referral',
    status: 'scheduled',
    treatments: ['Microagujas'],
    notes: [
      {
        id: 'note-6',
        content: 'Referida por Valentina. Muy interesada en tratamiento anti-edad.',
        createdAt: daysAgo(3),
        createdBy: 'user-1',
      },
    ],
    followUps: [
      {
        id: 'fu-5',
        leadId: 'lead-7',
        type: 'meeting',
        scheduledAt: daysFromNow(3),
        completed: false,
      },
    ],
    assignedTo: 'user-1',
    createdAt: daysAgo(5),
    updatedAt: daysAgo(3),
  },
  {
    id: 'lead-8',
    name: 'Mariana Ruiz',
    email: 'mariana.r@email.com',
    phone: '+52 55 8901 2345',
    source: 'instagram',
    status: 'closed',
    treatments: ['Botox - Frente', 'Botox - Entrecejo', 'Botox - Patas de Gallo'],
    notes: [
      {
        id: 'note-7',
        content: 'Cerrado! Compró paquete completo de Botox.',
        createdAt: daysAgo(2),
        createdBy: 'user-2',
      },
    ],
    followUps: [],
    assignedTo: 'user-2',
    createdAt: daysAgo(7),
    updatedAt: daysAgo(2),
    closedAt: daysAgo(2),
    value: 9000,
  },
  {
    id: 'lead-9',
    name: 'Lucía Vargas',
    email: 'lucia.v@email.com',
    phone: '+52 55 9012 3456',
    source: 'whatsapp',
    status: 'closed',
    treatments: ['Depilación Láser - Piernas Completas'],
    notes: [
      {
        id: 'note-8',
        content: 'Compró paquete de 6 sesiones láser piernas.',
        createdAt: daysAgo(3),
        createdBy: 'user-3',
      },
    ],
    followUps: [],
    assignedTo: 'user-3',
    createdAt: daysAgo(10),
    updatedAt: daysAgo(3),
    closedAt: daysAgo(3),
    value: 12500,
  },
  {
    id: 'lead-10',
    name: 'Patricia Morales',
    email: 'paty.m@email.com',
    phone: '+52 55 0123 4567',
    source: 'instagram',
    status: 'closed',
    treatments: ['Hidrafacial'],
    notes: [
      {
        id: 'note-9',
        content: 'Cerrado. Paquete de 4 hidrafaciales.',
        createdAt: daysAgo(5),
        createdBy: 'user-1',
      },
    ],
    followUps: [],
    assignedTo: 'user-1',
    createdAt: daysAgo(12),
    updatedAt: daysAgo(5),
    closedAt: daysAgo(5),
    value: 8500,
  },
  {
    id: 'lead-11',
    name: 'Elena Castro',
    email: 'elena.c@email.com',
    phone: '+52 55 1111 2222',
    source: 'phone',
    status: 'lost',
    treatments: ['Contorno Corporal'],
    notes: [
      {
        id: 'note-10',
        content: 'No contestó en 3 intentos. Marcado como perdido.',
        createdAt: daysAgo(4),
        createdBy: 'user-2',
      },
    ],
    followUps: [],
    assignedTo: 'user-2',
    createdAt: daysAgo(14),
    updatedAt: daysAgo(4),
  },
  {
    id: 'lead-12',
    name: 'Rosa Jiménez',
    email: 'rosa.j@email.com',
    phone: '+52 55 3333 4444',
    source: 'instagram',
    status: 'lost',
    treatments: ['Peeling Químico'],
    notes: [
      {
        id: 'note-11',
        content: 'Decidió ir con otro proveedor por precio.',
        createdAt: daysAgo(6),
        createdBy: 'user-1',
      },
    ],
    followUps: [],
    assignedTo: 'user-1',
    createdAt: daysAgo(15),
    updatedAt: daysAgo(6),
  },
  {
    id: 'lead-13',
    name: 'Carolina Mendez',
    email: 'caro.m@email.com',
    phone: '+52 55 5555 6666',
    source: 'instagram',
    status: 'new',
    treatments: ['Relleno de Labios'],
    notes: [],
    followUps: [],
    assignedTo: 'user-2',
    createdAt: hoursAgo(4),
    updatedAt: hoursAgo(4),
  },
  {
    id: 'lead-14',
    name: 'Diana Ortiz',
    email: 'diana.o@email.com',
    phone: '+52 55 7777 8888',
    source: 'whatsapp',
    status: 'contacted',
    treatments: ['Botox - Frente'],
    notes: [
      {
        id: 'note-12',
        content: 'Interesada pero quiere esperar al próximo mes.',
        createdAt: hoursAgo(8),
        createdBy: 'user-3',
      },
    ],
    followUps: [
      {
        id: 'fu-6',
        leadId: 'lead-14',
        type: 'message',
        scheduledAt: daysFromNow(14),
        completed: false,
        notes: 'Seguimiento próximo mes',
      },
    ],
    assignedTo: 'user-3',
    createdAt: daysAgo(2),
    updatedAt: hoursAgo(8),
  },
  {
    id: 'lead-15',
    name: 'Fernanda Reyes',
    email: 'fer.r@email.com',
    phone: '+52 55 9999 0000',
    source: 'referral',
    status: 'closed',
    treatments: ['Limpieza Facial Profunda', 'Peeling Químico'],
    notes: [
      {
        id: 'note-13',
        content: 'Referida por Patricia. Cerró el mismo día.',
        createdAt: daysAgo(1),
        createdBy: 'user-1',
      },
    ],
    followUps: [],
    assignedTo: 'user-1',
    createdAt: daysAgo(2),
    updatedAt: daysAgo(1),
    closedAt: daysAgo(1),
    value: 3500,
  },
]

// ============================================================
// DEPRECATED: Notifications - these should come from a real notification system
// ============================================================
/**
 * @deprecated Implement a real notification system
 */
export const notifications: Notification[] = [
  {
    id: 'notif-1',
    title: 'Nuevo lead',
    message: 'Andrea López envió un mensaje por WhatsApp',
    type: 'info',
    read: false,
    createdAt: hoursAgo(1),
    leadId: 'lead-2',
  },
  {
    id: 'notif-2',
    title: 'Seguimiento pendiente',
    message: 'Llamar a Sofía Ramírez en 3 horas',
    type: 'warning',
    read: false,
    createdAt: hoursAgo(2),
    leadId: 'lead-1',
  },
  {
    id: 'notif-3',
    title: 'Venta cerrada',
    message: 'Fernanda Reyes cerró por $3,500',
    type: 'success',
    read: true,
    createdAt: daysAgo(1),
    leadId: 'lead-15',
  },
]

// ============================================================
// DEPRECATED: Dashboard stats - calculate from real data
// ============================================================
/**
 * @deprecated Calculate stats from actual database data
 */
export const dashboardStats: DashboardStats = {
  newLeads: 12,
  newLeadsChange: 15,
  followUpsDue: 5,
  overdueFollowUps: 2,
  closedThisWeek: 4,
  closedChange: 33,
  conversionRate: 34,
  conversionChange: 5,
}

// ============================================================
// DEPRECATED: Report data - calculate from real data
// ============================================================
/**
 * @deprecated Calculate reports from actual database data
 */
export const reportData: ReportData = {
  totalLeads: 47,
  totalLeadsChange: 12,
  conversionRate: 34,
  conversionRateChange: 5,
  closedSales: 16,
  closedSalesChange: 8,
  avgCloseTime: 4.2,
  avgCloseTimeChange: -0.5,
  funnel: [
    { stage: 'Nuevo', count: 47, percentage: 100 },
    { stage: 'Contactado', count: 38, percentage: 81 },
    { stage: 'Agendado', count: 24, percentage: 51 },
    { stage: 'Cerrado', count: 16, percentage: 34 },
  ],
  sources: [
    { source: 'instagram', count: 28, percentage: 60 },
    { source: 'whatsapp', count: 14, percentage: 30 },
    { source: 'phone', count: 3, percentage: 6 },
    { source: 'referral', count: 2, percentage: 4 },
  ],
}
