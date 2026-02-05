'use client'

import { useState } from 'react'
import { Mail, Phone, MessageSquare, Send, CheckCircle } from 'lucide-react'
import { Button, Input, Card } from '@/components/ui'

type SupportCategory = 'technical' | 'billing' | 'feature' | 'other'
type Priority = 'low' | 'medium' | 'high'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: 'technical' as SupportCategory,
    priority: 'medium' as Priority,
    subject: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      console.log('Support request:', formData)
      setSubmitted(true)
      
      // Reset form
      setTimeout(() => {
        setFormData({
          name: '',
          email: '',
          phone: '',
          category: 'technical',
          priority: 'medium',
          subject: '',
          message: '',
        })
        setSubmitted(false)
      }, 3000)
    } catch (error) {
      console.error('Error submitting support request:', error)
      alert('Error al enviar la solicitud. Por favor intenta de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Contactar Soporte</h1>
        <p className="text-slate-500 text-sm">
          Estamos aquí para ayudarte. Envíanos tu consulta o problema
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Form */}
        <div className="lg:col-span-2">
          {submitted ? (
            <Card className="text-center py-12">
              <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-success-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                ¡Mensaje Enviado!
              </h3>
              <p className="text-slate-600 mb-4">
                Hemos recibido tu solicitud. Te responderemos lo antes posible.
              </p>
              <p className="text-sm text-slate-500">
                Número de ticket: #SOP-{Math.floor(Math.random() * 10000)}
              </p>
            </Card>
          ) : (
            <Card>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name and Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Nombre Completo *
                    </label>
                    <Input
                      type="text"
                      placeholder="Tu nombre"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Email *
                    </label>
                    <Input
                      type="email"
                      placeholder="tu@email.com"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Teléfono (opcional)
                  </label>
                  <Input
                    type="tel"
                    placeholder="+52 55 1234 5678"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                  />
                </div>

                {/* Category and Priority */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Categoría *
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.category}
                      onChange={(e) => handleChange('category', e.target.value)}
                      required
                    >
                      <option value="technical">Soporte Técnico</option>
                      <option value="billing">Facturación</option>
                      <option value="feature">Nueva Función</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Prioridad *
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.priority}
                      onChange={(e) => handleChange('priority', e.target.value)}
                      required
                    >
                      <option value="low">Baja</option>
                      <option value="medium">Media</option>
                      <option value="high">Alta</option>
                    </select>
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Asunto *
                  </label>
                  <Input
                    type="text"
                    placeholder="Breve descripción del problema"
                    value={formData.subject}
                    onChange={(e) => handleChange('subject', e.target.value)}
                    required
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Mensaje *
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[150px]"
                    placeholder="Describe tu consulta o problema en detalle..."
                    value={formData.message}
                    onChange={(e) => handleChange('message', e.target.value)}
                    required
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <Button type="submit" loading={isSubmitting} size="lg">
                    <Send className="w-5 h-5 mr-2" />
                    Enviar Mensaje
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>

        {/* Contact Info Sidebar */}
        <div className="space-y-4">
          {/* Direct Contact */}
          <Card>
            <h3 className="font-semibold text-slate-800 mb-4">
              Contacto Directo
            </h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Email</p>
                  <a href="mailto:soporte@cliniccrm.com" className="text-sm text-primary-600 hover:underline">
                    soporte@cliniccrm.com
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-success-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Teléfono</p>
                  <a href="tel:+525512345678" className="text-sm text-primary-600 hover:underline">
                    +52 55 1234 5678
                  </a>
                  <p className="text-xs text-slate-500">Lun-Vie 9:00-18:00</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-5 h-5 text-secondary-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">WhatsApp</p>
                  <a href="https://wa.me/525512345678" className="text-sm text-primary-600 hover:underline">
                    Chat en vivo
                  </a>
                  <p className="text-xs text-slate-500">Respuesta inmediata</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Response Time */}
          <Card className="bg-primary-50 border-primary-200">
            <h3 className="font-semibold text-slate-800 mb-3">
              Tiempo de Respuesta
            </h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-success-500 rounded-full"></span>
                <span><strong>Alta:</strong> 2-4 horas</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                <span><strong>Media:</strong> 8-12 horas</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-slate-400 rounded-full"></span>
                <span><strong>Baja:</strong> 24-48 horas</span>
              </li>
            </ul>
          </Card>

          {/* FAQ Link */}
          <Card>
            <h3 className="font-semibold text-slate-800 mb-2">
              ¿Pregunta rápida?
            </h3>
            <p className="text-sm text-slate-600 mb-3">
              Visita nuestro Centro de Ayuda para respuestas inmediatas
            </p>
            <a
              href="/help"
              className="inline-block w-full text-center px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
            >
              Ver Preguntas Frecuentes
            </a>
          </Card>

          {/* Status */}
          <Card className="bg-success-50 border-success-200">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-3 h-3 bg-success-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-success-800">
                Todos los sistemas operativos
              </span>
            </div>
            <p className="text-xs text-success-700">
              Última actualización: Hace 5 minutos
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
