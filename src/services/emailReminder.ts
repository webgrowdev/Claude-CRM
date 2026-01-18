// Email Reminder Service
// This service handles sending reminder emails before appointments and meetings

import { FollowUp, Lead } from '@/types'

export interface ReminderEmailData {
  patientName: string
  patientEmail: string
  appointmentType: 'meeting' | 'appointment'
  scheduledAt: Date
  treatmentName?: string
  meetLink?: string
  clinicName: string
  clinicAddress?: string
  clinicPhone?: string
}

// Email templates
export function generateReminderEmailHtml(data: ReminderEmailData, language: 'es' | 'en' = 'es'): string {
  const isSpanish = language === 'es'
  const isMeeting = data.appointmentType === 'meeting'

  const translations = {
    es: {
      subject: isMeeting ? 'Recordatorio: Tu videollamada es en 10 minutos' : 'Recordatorio: Tu cita presencial es en 10 minutos',
      greeting: `Hola ${data.patientName},`,
      meetingReminder: 'Tu videollamada está programada para:',
      appointmentReminder: 'Tu cita presencial está programada para:',
      treatment: 'Tratamiento:',
      joinMeeting: 'Unirse a la videollamada',
      location: 'Ubicación:',
      questions: '¿Tienes preguntas?',
      contact: 'Contáctanos al',
      seeYouSoon: isMeeting ? '¡Nos vemos en línea!' : '¡Te esperamos!',
      team: 'El equipo de',
    },
    en: {
      subject: isMeeting ? 'Reminder: Your video call is in 10 minutes' : 'Reminder: Your appointment is in 10 minutes',
      greeting: `Hello ${data.patientName},`,
      meetingReminder: 'Your video call is scheduled for:',
      appointmentReminder: 'Your in-person appointment is scheduled for:',
      treatment: 'Treatment:',
      joinMeeting: 'Join video call',
      location: 'Location:',
      questions: 'Have questions?',
      contact: 'Contact us at',
      seeYouSoon: isMeeting ? 'See you online!' : 'See you soon!',
      team: 'The team at',
    },
  }

  const t = translations[language]

  const formattedDate = new Intl.DateTimeFormat(language === 'es' ? 'es-MX' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(data.scheduledAt)

  return `
<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="min-width: 100%; background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">${data.clinicName}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                ${t.greeting}
              </p>

              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                ${isMeeting ? t.meetingReminder : t.appointmentReminder}
              </p>

              <div style="background-color: #f0fdfa; border-left: 4px solid #14b8a6; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0 0 10px; color: #0f766e; font-size: 18px; font-weight: 600;">
                  📅 ${formattedDate}
                </p>
                ${data.treatmentName ? `
                <p style="margin: 0; color: #0f766e; font-size: 14px;">
                  ${t.treatment} ${data.treatmentName}
                </p>
                ` : ''}
              </div>

              ${isMeeting && data.meetLink ? `
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.meetLink}" style="display: inline-block; padding: 14px 32px; background-color: #14b8a6; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  🎥 ${t.joinMeeting}
                </a>
              </div>
              ` : ''}

              ${!isMeeting && data.clinicAddress ? `
              <div style="background-color: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <p style="margin: 0 0 5px; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                  ${t.location}
                </p>
                <p style="margin: 0; color: #374151; font-size: 14px;">
                  📍 ${data.clinicAddress}
                </p>
              </div>
              ` : ''}

              <p style="margin: 30px 0 0; color: #374151; font-size: 16px; line-height: 1.6;">
                ${t.seeYouSoon}
              </p>

              <p style="margin: 10px 0 0; color: #6b7280; font-size: 14px;">
                ${t.team} ${data.clinicName}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                ${t.questions} ${t.contact} ${data.clinicPhone || ''}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

// Check if a reminder should be sent (10 minutes before)
export function shouldSendReminder(scheduledAt: Date): boolean {
  const now = new Date()
  const tenMinutesBefore = new Date(scheduledAt.getTime() - 10 * 60 * 1000)
  const fiveMinutesBefore = new Date(scheduledAt.getTime() - 5 * 60 * 1000)

  // Send reminder if we're within the 10-5 minute window before the appointment
  return now >= tenMinutesBefore && now < fiveMinutesBefore
}

// Get all follow-ups that need reminders
export function getFollowUpsNeedingReminders(
  leads: Lead[],
  types: ('meeting' | 'appointment')[] = ['meeting', 'appointment']
): Array<{ lead: Lead; followUp: FollowUp }> {
  const result: Array<{ lead: Lead; followUp: FollowUp }> = []

  leads.forEach(lead => {
    lead.followUps.forEach(followUp => {
      if (
        !followUp.completed &&
        !followUp.reminderSent &&
        types.includes(followUp.type as 'meeting' | 'appointment') &&
        (followUp.type === 'meeting' || followUp.type === 'appointment') &&
        lead.email &&
        shouldSendReminder(new Date(followUp.scheduledAt))
      ) {
        result.push({ lead, followUp })
      }
    })
  })

  return result
}

// Simulate sending email (in production, this would use an email service like SendGrid, Resend, etc.)
export async function sendReminderEmail(
  data: ReminderEmailData,
  language: 'es' | 'en' = 'es'
): Promise<{ success: boolean; error?: string }> {
  try {
    // Generate email HTML
    const html = generateReminderEmailHtml(data, language)

    // In a real implementation, you would call your email service here
    // For example with Resend:
    // await resend.emails.send({
    //   from: 'noreply@yourclinic.com',
    //   to: data.patientEmail,
    //   subject: '...',
    //   html: html
    // })

    console.log(`[Email Service] Would send reminder email to ${data.patientEmail}`)
    console.log(`[Email Service] Appointment: ${data.appointmentType} at ${data.scheduledAt}`)

    // Simulate success
    return { success: true }
  } catch (error) {
    console.error('[Email Service] Error sending email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
