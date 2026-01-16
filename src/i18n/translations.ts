export type Language = 'es' | 'en'

export const translations = {
  es: {
    // Common
    common: {
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
      add: 'Agregar',
      search: 'Buscar',
      loading: 'Cargando...',
      noResults: 'Sin resultados',
      all: 'Todos',
      yes: 'Sí',
      no: 'No',
      confirm: 'Confirmar',
      back: 'Volver',
      next: 'Siguiente',
      previous: 'Anterior',
      close: 'Cerrar',
      optional: 'opcional',
      required: 'requerido',
    },

    // Navigation
    nav: {
      dashboard: 'Dashboard',
      inbox: 'Inbox',
      patients: 'Pacientes',
      pipeline: 'Embudo',
      calendar: 'Agenda',
      reports: 'Reportes',
      treatments: 'Tratamientos',
      settings: 'Configuración',
      home: 'Inicio',
      more: 'Más',
      newPatient: 'Nuevo Paciente',
      newLead: 'Nuevo Lead',
      scheduleAppointment: 'Agendar Turno',
    },

    // Funnel Statuses
    funnel: {
      new: 'Nuevo',
      contacted: 'Contactado',
      appointment: 'Turno Agendado',
      attended: 'Asistió',
      closed: 'Cerró Tratamiento',
      followup: 'Seguimiento',
      lost: 'Perdido',
      noshow: 'No Asistió',
    },

    // Inbox
    inbox: {
      title: 'Inbox',
      subtitle: 'Leads entrantes',
      newLeads: 'Nuevos',
      inProcess: 'En proceso',
      toCallToday: 'Para llamar hoy',
      allLeads: 'Todos los leads',
      noNewLeads: 'No hay leads nuevos',
      checkFollowUp: 'Ver leads en seguimiento',
      filterByChannel: 'Filtrar por canal',
      filterByStatus: 'Filtrar por estado',
      markAsContacted: 'Marcar como contactado',
      scheduleCall: 'Agendar llamada',
      urgent: 'Urgente',
      waitingOver48h: 'Esperando +48h',
    },

    // Auth
    auth: {
      login: 'Iniciar Sesión',
      logout: 'Cerrar Sesión',
      logoutConfirm: '¿Estás seguro de que deseas cerrar sesión?',
      email: 'Correo electrónico',
      password: 'Contraseña',
      forgotPassword: '¿Olvidaste tu contraseña?',
      welcomeBack: 'Bienvenido de nuevo',
      enterCredentials: 'Ingresa tus credenciales para continuar',
    },

    // Dashboard
    dashboard: {
      greeting: 'Buenos días',
      newPatients: 'Pacientes Nuevos',
      followUps: 'Seguimientos',
      pending: 'pendientes',
      upToDate: 'Al día',
      closed: 'Cerrados',
      thisWeek: 'Esta semana',
      conversion: 'Conversión',
      vsLastMonth: 'vs mes anterior',
      recentPatients: 'Pacientes Recientes',
      viewAll: 'Ver todos',
      upcomingFollowUps: 'Próximos Seguimientos',
      viewCalendar: 'Ver agenda',
      noPatients: 'No hay pacientes todavía',
      noFollowUps: 'No hay seguimientos programados',
      salesThisMonth: 'Ventas este mes',
      closedSales: 'ventas cerradas',
      viewReports: 'Ver reportes',
    },

    // Patients
    patients: {
      title: 'Pacientes',
      totalPatients: 'pacientes en total',
      searchPatients: 'Buscar pacientes...',
      newPatient: 'Nuevo Paciente',
      addPatient: 'Agregar Paciente',
      noPatients: 'No hay pacientes',
      addFirstPatient: 'Agrega tu primer paciente para comenzar',
      selectPatient: 'Selecciona un paciente',
      selectPatientDesc: 'Elige un paciente de la lista para ver sus detalles',
      deletePatient: 'Eliminar Paciente',
      deleteConfirm: '¿Estás seguro de que deseas eliminar a',
      deleteWarning: 'Esta acción no se puede deshacer.',
      via: 'Vía',
      activity: 'Actividad',
      addNote: 'Agregar nota',
      noActivity: 'No hay actividad todavía',
      treatmentsOfInterest: 'Tratamientos de interés',
      contactInfo: 'Información de contacto',
    },

    // Patient Form
    patientForm: {
      name: 'Nombre',
      namePlaceholder: 'Nombre del paciente',
      phone: 'Teléfono',
      phonePlaceholder: '+52 55 1234 5678',
      email: 'Email',
      emailPlaceholder: 'paciente@email.com',
      source: 'Fuente',
    },

    // Sources
    sources: {
      instagram: 'Instagram',
      whatsapp: 'WhatsApp',
      phone: 'Teléfono',
      website: 'Sitio Web',
      referral: 'Referido',
      other: 'Otro',
    },

    // Status
    status: {
      new: 'Nuevo',
      contacted: 'Contactado',
      scheduled: 'Agendado',
      closed: 'Cerrado',
      lost: 'Perdido',
    },

    // Actions
    actions: {
      call: 'Llamar',
      whatsapp: 'WhatsApp',
      email: 'Email',
      schedule: 'Agendar',
    },

    // Follow-ups
    followUp: {
      title: 'Programar Seguimiento',
      type: 'Tipo',
      typeCall: 'Llamada',
      typeMessage: 'Mensaje',
      typeEmail: 'Email',
      typeMeeting: 'Reunión con videollamada',
      dateTime: 'Fecha y Hora',
      duration: 'Duración',
      notes: 'Notas',
      notesPlaceholder: 'Ej: Confirmar disponibilidad para consulta',
      schedule: 'Programar',
      createWithMeet: 'Crear con Google Meet',
      creatingEvent: 'Creando evento...',
      saving: 'Guardando...',
      scheduledFor: 'Programado para',
      completed: 'Completado',
      calendarConnected: 'Se creará evento en Google Calendar',
      calendarNotConnected: 'Google Calendar no conectado',
      meetLinkAuto: 'Se generará automáticamente un enlace de Google Meet',
      connectCalendar: 'Conecta tu calendario en Configuración → Integraciones',
    },

    // Notes
    notes: {
      title: 'Agregar Nota',
      placeholder: 'Escribe una nota sobre este paciente...',
    },

    // Calendar
    calendar: {
      title: 'Agenda',
      today: 'Hoy',
      noEventsToday: 'No hay eventos para hoy',
      upcomingEvents: 'Próximos eventos',
      markComplete: 'Marcar completado',
      joinMeet: 'Unirse a Google Meet',
    },

    // Settings
    settings: {
      title: 'Ajustes',
      editProfile: 'Editar Perfil',
      account: 'Cuenta',
      changePassword: 'Cambiar Contraseña',
      notifications: 'Notificaciones',
      team: 'Equipo',
      clinic: 'Clínica',
      clinicInfo: 'Información de la Clínica',
      treatmentsAndPrices: 'Tratamientos y Precios',
      pipelineStages: 'Etapas del Pipeline',
      integrations: 'Integraciones',
      support: 'Soporte',
      viewTutorial: 'Ver Tutorial',
      helpCenter: 'Centro de Ayuda',
      contactSupport: 'Contactar Soporte',
      rateApp: 'Calificar la App',
      version: 'Versión',
      privacy: 'Privacidad',
      terms: 'Términos',
      language: 'Idioma',
      spanish: 'Español',
      english: 'Inglés',
    },

    // Integrations
    integrations: {
      title: 'Integraciones',
      subtitle: 'Conecta tus herramientas favoritas',
      googleCalendar: 'Google Calendar',
      googleCalendarDesc: 'Sincroniza tu agenda y crea reuniones con Google Meet automáticamente',
      connected: 'Conectado',
      disconnected: 'Desconectado',
      connect: 'Conectar',
      disconnect: 'Desconectar',
      manychat: 'ManyChat',
      manychatDesc: 'Recibe leads automáticamente desde Instagram y WhatsApp',
      webhookUrl: 'URL del Webhook',
      copy: 'Copiar',
      copied: 'Copiado',
      autoCreateLeads: 'Crear leads automáticamente',
    },

    // Reports
    reports: {
      title: 'Reportes',
      period: 'Período',
      week: 'Semana',
      month: 'Mes',
      quarter: 'Trimestre',
      year: 'Año',
      totalLeads: 'Total Leads',
      conversionRate: 'Tasa de Conversión',
      closedSales: 'Ventas Cerradas',
      avgCloseTime: 'Tiempo Promedio de Cierre',
      days: 'días',
      revenue: 'Ingresos',
      funnel: 'Embudo de Ventas',
      leadSources: 'Fuentes de Leads',
    },

    // Treatments
    treatments: {
      title: 'Tratamientos',
      searchTreatments: 'Buscar tratamientos...',
      newTreatment: 'Nuevo Tratamiento',
      addTreatment: 'Agregar Tratamiento',
      editTreatment: 'Editar Tratamiento',
      deleteTreatment: 'Eliminar Tratamiento',
      deleteConfirm: '¿Estás seguro de que deseas eliminar este tratamiento?',
      name: 'Nombre',
      category: 'Categoría',
      price: 'Precio',
      duration: 'Duración',
      minutes: 'minutos',
      description: 'Descripción',
      share: 'Compartir lista',
      categories: {
        all: 'Todos',
        injectable: 'Inyectables',
        laser: 'Láser',
        facial: 'Facial',
        body: 'Corporal',
      },
    },

    // Kanban/Pipeline
    kanban: {
      title: 'Pipeline',
      dragToMove: 'Arrastra para mover',
    },

    // Onboarding
    onboarding: {
      welcome: '¡Bienvenido a Clinic CRM!',
      welcomeDesc: 'Te ayudaremos a gestionar tus pacientes de forma sencilla y eficiente. Este tutorial te mostrará cómo usar las funciones principales.',
      skipTutorial: 'Saltar tutorial',
      addPatients: 'Agregar Pacientes',
      addPatientsDesc: 'Haz clic en "Nuevo Paciente" para agregar un nuevo contacto. Puedes ingresar su nombre, teléfono, email y la fuente de donde llegó (Instagram, WhatsApp, etc).',
      contactPatients: 'Contactar Pacientes',
      contactPatientsDesc: 'Desde la ficha del paciente puedes llamar, enviar WhatsApp o email con un solo toque. ¡Sin salir de la aplicación!',
      scheduleAppointments: 'Agendar Citas',
      scheduleAppointmentsDesc: 'Haz clic en "Agendar" para programar una llamada, mensaje o reunión. Si conectas Google Calendar, se creará automáticamente un evento con link de Google Meet.',
      followUp: 'Seguimiento',
      followUpDesc: 'Agrega notas después de cada contacto para recordar detalles importantes. Verás toda la actividad en la línea de tiempo del paciente.',
      closeSales: 'Cerrar Ventas',
      closeSalesDesc: 'Cuando el paciente confirme su tratamiento, cambia el estado a "Cerrado". ¡Celebra cada venta!',
      ready: '¡Listo para empezar!',
      readyDesc: 'Ya conoces lo básico. Explora la aplicación y descubre más funciones. Si tienes dudas, revisa la sección de ayuda en Configuración.',
      tip: 'Tip',
      tipSkip: 'Puedes saltar este tutorial y volver a verlo desde Configuración.',
      tipNew: 'Los pacientes nuevos aparecen con estado "Nuevo" automáticamente.',
      tipContacted: 'Después de contactar, cambia el estado a "Contactado".',
      tipScheduled: 'Al agendar una cita, el estado cambia automáticamente a "Agendado".',
      tipNotes: 'Las notas te ayudan a dar un servicio más personalizado.',
      tipReports: 'Revisa tus estadísticas en el Dashboard y Reportes.',
      tipCalendar: 'Conecta tu Google Calendar para aprovechar al máximo la app.',
      start: 'Comenzar',
    },

    // Time
    time: {
      justNow: 'Ahora mismo',
      minutesAgo: 'hace {n} min',
      hoursAgo: 'hace {n}h',
      daysAgo: 'hace {n}d',
      today: 'Hoy',
      tomorrow: 'Mañana',
      yesterday: 'Ayer',
    },

    // Errors
    errors: {
      generic: 'Ocurrió un error. Intenta de nuevo.',
      notFound: 'No encontrado',
      unauthorized: 'No autorizado',
    },
  },

  en: {
    // Common
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      search: 'Search',
      loading: 'Loading...',
      noResults: 'No results',
      all: 'All',
      yes: 'Yes',
      no: 'No',
      confirm: 'Confirm',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      close: 'Close',
      optional: 'optional',
      required: 'required',
    },

    // Navigation
    nav: {
      dashboard: 'Dashboard',
      inbox: 'Inbox',
      patients: 'Patients',
      pipeline: 'Funnel',
      calendar: 'Calendar',
      reports: 'Reports',
      treatments: 'Treatments',
      settings: 'Settings',
      home: 'Home',
      more: 'More',
      newPatient: 'New Patient',
      newLead: 'New Lead',
      scheduleAppointment: 'Schedule Appointment',
    },

    // Funnel Statuses
    funnel: {
      new: 'New',
      contacted: 'Contacted',
      appointment: 'Appointment Scheduled',
      attended: 'Attended',
      closed: 'Treatment Closed',
      followup: 'Follow-up',
      lost: 'Lost',
      noshow: 'No Show',
    },

    // Inbox
    inbox: {
      title: 'Inbox',
      subtitle: 'Incoming leads',
      newLeads: 'New',
      inProcess: 'In process',
      toCallToday: 'To call today',
      allLeads: 'All leads',
      noNewLeads: 'No new leads',
      checkFollowUp: 'Check follow-up leads',
      filterByChannel: 'Filter by channel',
      filterByStatus: 'Filter by status',
      markAsContacted: 'Mark as contacted',
      scheduleCall: 'Schedule call',
      urgent: 'Urgent',
      waitingOver48h: 'Waiting 48h+',
    },

    // Auth
    auth: {
      login: 'Log In',
      logout: 'Log Out',
      logoutConfirm: 'Are you sure you want to log out?',
      email: 'Email',
      password: 'Password',
      forgotPassword: 'Forgot your password?',
      welcomeBack: 'Welcome back',
      enterCredentials: 'Enter your credentials to continue',
    },

    // Dashboard
    dashboard: {
      greeting: 'Good morning',
      newPatients: 'New Patients',
      followUps: 'Follow-ups',
      pending: 'pending',
      upToDate: 'Up to date',
      closed: 'Closed',
      thisWeek: 'This week',
      conversion: 'Conversion',
      vsLastMonth: 'vs last month',
      recentPatients: 'Recent Patients',
      viewAll: 'View all',
      upcomingFollowUps: 'Upcoming Follow-ups',
      viewCalendar: 'View calendar',
      noPatients: 'No patients yet',
      noFollowUps: 'No follow-ups scheduled',
      salesThisMonth: 'Sales this month',
      closedSales: 'closed sales',
      viewReports: 'View reports',
    },

    // Patients
    patients: {
      title: 'Patients',
      totalPatients: 'patients total',
      searchPatients: 'Search patients...',
      newPatient: 'New Patient',
      addPatient: 'Add Patient',
      noPatients: 'No patients',
      addFirstPatient: 'Add your first patient to get started',
      selectPatient: 'Select a patient',
      selectPatientDesc: 'Choose a patient from the list to view their details',
      deletePatient: 'Delete Patient',
      deleteConfirm: 'Are you sure you want to delete',
      deleteWarning: 'This action cannot be undone.',
      via: 'Via',
      activity: 'Activity',
      addNote: 'Add note',
      noActivity: 'No activity yet',
      treatmentsOfInterest: 'Treatments of interest',
      contactInfo: 'Contact information',
    },

    // Patient Form
    patientForm: {
      name: 'Name',
      namePlaceholder: 'Patient name',
      phone: 'Phone',
      phonePlaceholder: '+1 555 123 4567',
      email: 'Email',
      emailPlaceholder: 'patient@email.com',
      source: 'Source',
    },

    // Sources
    sources: {
      instagram: 'Instagram',
      whatsapp: 'WhatsApp',
      phone: 'Phone',
      website: 'Website',
      referral: 'Referral',
      other: 'Other',
    },

    // Status
    status: {
      new: 'New',
      contacted: 'Contacted',
      scheduled: 'Scheduled',
      closed: 'Closed',
      lost: 'Lost',
    },

    // Actions
    actions: {
      call: 'Call',
      whatsapp: 'WhatsApp',
      email: 'Email',
      schedule: 'Schedule',
    },

    // Follow-ups
    followUp: {
      title: 'Schedule Follow-up',
      type: 'Type',
      typeCall: 'Call',
      typeMessage: 'Message',
      typeEmail: 'Email',
      typeMeeting: 'Video meeting',
      dateTime: 'Date & Time',
      duration: 'Duration',
      notes: 'Notes',
      notesPlaceholder: 'E.g.: Confirm availability for consultation',
      schedule: 'Schedule',
      createWithMeet: 'Create with Google Meet',
      creatingEvent: 'Creating event...',
      saving: 'Saving...',
      scheduledFor: 'Scheduled for',
      completed: 'Completed',
      calendarConnected: 'Event will be created in Google Calendar',
      calendarNotConnected: 'Google Calendar not connected',
      meetLinkAuto: 'A Google Meet link will be automatically generated',
      connectCalendar: 'Connect your calendar in Settings → Integrations',
    },

    // Notes
    notes: {
      title: 'Add Note',
      placeholder: 'Write a note about this patient...',
    },

    // Calendar
    calendar: {
      title: 'Calendar',
      today: 'Today',
      noEventsToday: 'No events for today',
      upcomingEvents: 'Upcoming events',
      markComplete: 'Mark complete',
      joinMeet: 'Join Google Meet',
    },

    // Settings
    settings: {
      title: 'Settings',
      editProfile: 'Edit Profile',
      account: 'Account',
      changePassword: 'Change Password',
      notifications: 'Notifications',
      team: 'Team',
      clinic: 'Clinic',
      clinicInfo: 'Clinic Information',
      treatmentsAndPrices: 'Treatments & Prices',
      pipelineStages: 'Pipeline Stages',
      integrations: 'Integrations',
      support: 'Support',
      viewTutorial: 'View Tutorial',
      helpCenter: 'Help Center',
      contactSupport: 'Contact Support',
      rateApp: 'Rate the App',
      version: 'Version',
      privacy: 'Privacy',
      terms: 'Terms',
      language: 'Language',
      spanish: 'Spanish',
      english: 'English',
    },

    // Integrations
    integrations: {
      title: 'Integrations',
      subtitle: 'Connect your favorite tools',
      googleCalendar: 'Google Calendar',
      googleCalendarDesc: 'Sync your calendar and create Google Meet meetings automatically',
      connected: 'Connected',
      disconnected: 'Disconnected',
      connect: 'Connect',
      disconnect: 'Disconnect',
      manychat: 'ManyChat',
      manychatDesc: 'Receive leads automatically from Instagram and WhatsApp',
      webhookUrl: 'Webhook URL',
      copy: 'Copy',
      copied: 'Copied',
      autoCreateLeads: 'Create leads automatically',
    },

    // Reports
    reports: {
      title: 'Reports',
      period: 'Period',
      week: 'Week',
      month: 'Month',
      quarter: 'Quarter',
      year: 'Year',
      totalLeads: 'Total Leads',
      conversionRate: 'Conversion Rate',
      closedSales: 'Closed Sales',
      avgCloseTime: 'Avg. Close Time',
      days: 'days',
      revenue: 'Revenue',
      funnel: 'Sales Funnel',
      leadSources: 'Lead Sources',
    },

    // Treatments
    treatments: {
      title: 'Treatments',
      searchTreatments: 'Search treatments...',
      newTreatment: 'New Treatment',
      addTreatment: 'Add Treatment',
      editTreatment: 'Edit Treatment',
      deleteTreatment: 'Delete Treatment',
      deleteConfirm: 'Are you sure you want to delete this treatment?',
      name: 'Name',
      category: 'Category',
      price: 'Price',
      duration: 'Duration',
      minutes: 'minutes',
      description: 'Description',
      share: 'Share list',
      categories: {
        all: 'All',
        injectable: 'Injectables',
        laser: 'Laser',
        facial: 'Facial',
        body: 'Body',
      },
    },

    // Kanban/Pipeline
    kanban: {
      title: 'Pipeline',
      dragToMove: 'Drag to move',
    },

    // Onboarding
    onboarding: {
      welcome: 'Welcome to Clinic CRM!',
      welcomeDesc: 'We\'ll help you manage your patients simply and efficiently. This tutorial will show you how to use the main features.',
      skipTutorial: 'Skip tutorial',
      addPatients: 'Add Patients',
      addPatientsDesc: 'Click "New Patient" to add a new contact. You can enter their name, phone, email, and where they came from (Instagram, WhatsApp, etc).',
      contactPatients: 'Contact Patients',
      contactPatientsDesc: 'From the patient\'s profile, you can call, send WhatsApp, or email with a single tap. Without leaving the app!',
      scheduleAppointments: 'Schedule Appointments',
      scheduleAppointmentsDesc: 'Click "Schedule" to set up a call, message, or meeting. If you connect Google Calendar, an event with a Google Meet link will be created automatically.',
      followUp: 'Follow Up',
      followUpDesc: 'Add notes after each contact to remember important details. You\'ll see all activity in the patient\'s timeline.',
      closeSales: 'Close Sales',
      closeSalesDesc: 'When the patient confirms their treatment, change the status to "Closed". Celebrate every sale!',
      ready: 'Ready to start!',
      readyDesc: 'You know the basics. Explore the app and discover more features. If you have questions, check the help section in Settings.',
      tip: 'Tip',
      tipSkip: 'You can skip this tutorial and view it again from Settings.',
      tipNew: 'New patients automatically appear with "New" status.',
      tipContacted: 'After contacting, change the status to "Contacted".',
      tipScheduled: 'When scheduling an appointment, the status automatically changes to "Scheduled".',
      tipNotes: 'Notes help you provide more personalized service.',
      tipReports: 'Check your stats in the Dashboard and Reports.',
      tipCalendar: 'Connect your Google Calendar to get the most out of the app.',
      start: 'Get Started',
    },

    // Time
    time: {
      justNow: 'Just now',
      minutesAgo: '{n}m ago',
      hoursAgo: '{n}h ago',
      daysAgo: '{n}d ago',
      today: 'Today',
      tomorrow: 'Tomorrow',
      yesterday: 'Yesterday',
    },

    // Errors
    errors: {
      generic: 'An error occurred. Please try again.',
      notFound: 'Not found',
      unauthorized: 'Unauthorized',
    },
  },
} as const

// Create a type that uses string instead of literal types for compatibility
type DeepStringify<T> = {
  [K in keyof T]: T[K] extends object ? DeepStringify<T[K]> : string
}

export type TranslationKeys = DeepStringify<typeof translations.es>
