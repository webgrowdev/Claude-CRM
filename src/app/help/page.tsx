'use client'

import { useState } from 'react'
import { Search, Book, Video, FileText, ChevronDown, ChevronRight } from 'lucide-react'
import { Input, Card } from '@/components/ui'

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
}

interface Tutorial {
  id: string
  title: string
  description: string
  videoUrl: string
  duration: string
}

export default function HelpPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const faqs: FAQ[] = [
    {
      id: '1',
      category: 'Pacientes',
      question: '¿Cómo agrego un nuevo paciente?',
      answer: 'Ve a la página de Pacientes y haz clic en el botón "Agregar Paciente". Completa el formulario con la información del paciente y guarda.',
    },
    {
      id: '2',
      category: 'Pacientes',
      question: '¿Cómo edito la información de un paciente?',
      answer: 'En la lista de pacientes, haz clic en el paciente que deseas editar. Luego haz clic en "Editar" y actualiza la información necesaria.',
    },
    {
      id: '3',
      category: 'Citas',
      question: '¿Cómo programo una cita?',
      answer: 'Ve al Calendario o a la página de Citas, selecciona una fecha y hora disponible, elige el paciente y el tratamiento, y confirma la cita.',
    },
    {
      id: '4',
      category: 'Citas',
      question: '¿Puedo reprogramar una cita?',
      answer: 'Sí, haz clic en la cita en el calendario, selecciona "Editar" y cambia la fecha/hora. La cita se actualizará automáticamente.',
    },
    {
      id: '5',
      category: 'Tratamientos',
      question: '¿Cómo agrego un nuevo tratamiento?',
      answer: 'Ve a Configuración > Tratamientos, haz clic en "Agregar Tratamiento" y completa los detalles como nombre, precio y duración.',
    },
    {
      id: '6',
      category: 'Reportes',
      question: '¿Cómo genero un reporte de ingresos?',
      answer: 'Ve a la página de Reportes, selecciona el rango de fechas deseado y el sistema generará automáticamente los gráficos y estadísticas.',
    },
    {
      id: '7',
      category: 'Integraciones',
      question: '¿Cómo conecto Google Calendar?',
      answer: 'Ve a Configuración > Integraciones, busca Google Calendar y sigue los pasos para autorizar la conexión.',
    },
    {
      id: '8',
      category: 'Seguridad',
      question: '¿Cómo cambio mi contraseña?',
      answer: 'Ve a Configuración > Perfil > Seguridad y haz clic en "Cambiar Contraseña". Ingresa tu contraseña actual y la nueva.',
    },
  ]

  const tutorials: Tutorial[] = [
    {
      id: '1',
      title: 'Introducción al Sistema',
      description: 'Conoce las funciones principales y cómo navegar por el CRM',
      videoUrl: '#',
      duration: '5:30',
    },
    {
      id: '2',
      title: 'Gestión de Pacientes',
      description: 'Aprende a agregar, editar y organizar pacientes',
      videoUrl: '#',
      duration: '8:45',
    },
    {
      id: '3',
      title: 'Calendario y Citas',
      description: 'Cómo programar y gestionar citas eficientemente',
      videoUrl: '#',
      duration: '10:20',
    },
    {
      id: '4',
      title: 'Reportes y Análisis',
      description: 'Genera reportes y analiza el rendimiento de tu clínica',
      videoUrl: '#',
      duration: '7:15',
    },
  ]

  const categories = ['all', ...Array.from(new Set(faqs.map(f => f.category)))]

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = searchTerm === '' || 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const toggleFaq = (id: string) => {
    setExpandedFaq(expandedFaq === id ? null : id)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Centro de Ayuda</h1>
        <p className="text-slate-500 text-sm">
          Encuentra respuestas, guías y tutoriales
        </p>
      </div>

      {/* Search */}
      <div className="mb-8">
        <Input
          type="text"
          placeholder="Busca tu pregunta..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={<Search className="w-5 h-5" />}
          className="text-lg"
        />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Book className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Documentación</h3>
              <p className="text-sm text-slate-500">Guías completas</p>
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
              <Video className="w-6 h-6 text-secondary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Video Tutoriales</h3>
              <p className="text-sm text-slate-500">Aprende visualmente</p>
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-success-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Contactar Soporte</h3>
              <p className="text-sm text-slate-500">Necesitas ayuda</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FAQs Section */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            Preguntas Frecuentes
          </h2>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-primary-500 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat === 'all' ? 'Todas' : cat}
              </button>
            ))}
          </div>

          {/* FAQ List */}
          <div className="space-y-3">
            {filteredFaqs.length === 0 ? (
              <Card>
                <div className="text-center py-8">
                  <p className="text-slate-500">
                    No se encontraron preguntas que coincidan con tu búsqueda
                  </p>
                </div>
              </Card>
            ) : (
              filteredFaqs.map(faq => (
                <Card key={faq.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <div onClick={() => toggleFaq(faq.id)}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded">
                            {faq.category}
                          </span>
                        </div>
                        <h3 className="font-semibold text-slate-800 mb-2">
                          {faq.question}
                        </h3>
                        {expandedFaq === faq.id && (
                          <p className="text-slate-600 text-sm leading-relaxed">
                            {faq.answer}
                          </p>
                        )}
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        {expandedFaq === faq.id ? (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Video Tutorials Sidebar */}
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            Video Tutoriales
          </h2>
          <div className="space-y-3">
            {tutorials.map(tutorial => (
              <Card key={tutorial.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Video className="w-6 h-6 text-secondary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800 text-sm mb-1">
                      {tutorial.title}
                    </h3>
                    <p className="text-xs text-slate-500 mb-2">
                      {tutorial.description}
                    </p>
                    <span className="text-xs text-primary-600 font-medium">
                      ⏱️ {tutorial.duration}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Contact Support CTA */}
          <Card className="mt-6 bg-primary-50 border-primary-200">
            <h3 className="font-semibold text-slate-800 mb-2">
              ¿No encontraste lo que buscas?
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Nuestro equipo de soporte está listo para ayudarte
            </p>
            <a
              href="/contact"
              className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
            >
              Contactar Soporte
            </a>
          </Card>
        </div>
      </div>
    </div>
  )
}
