'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, UserCog, Clock, Calendar, CheckCircle, XCircle } from 'lucide-react'
import { Button, Input, Card } from '@/components/ui'
import { Doctor } from '@/types'

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    loadDoctors()
  }, [])

  const loadDoctors = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/doctors')
      // const data = await response.json()
      // setDoctors(data.doctors)
      
      // Demo data
      setDoctors([
        {
          id: '1',
          name: 'Dr. María González',
          email: 'maria@clinic.com',
          phone: '+52 55 1234 5678',
          specialty: 'Dermatología Estética',
          color: '#3b82f6',
          avatar: '',
          active: true,
          workingHours: {
            1: { start: '09:00', end: '18:00', enabled: true },
            2: { start: '09:00', end: '18:00', enabled: true },
            3: { start: '09:00', end: '18:00', enabled: true },
            4: { start: '09:00', end: '18:00', enabled: true },
            5: { start: '09:00', end: '14:00', enabled: true },
          },
          slotDuration: 30,
        },
        {
          id: '2',
          name: 'Dr. Carlos Ramírez',
          email: 'carlos@clinic.com',
          phone: '+52 55 9876 5432',
          specialty: 'Cirugía Plástica',
          color: '#10b981',
          avatar: '',
          active: true,
          workingHours: {
            1: { start: '10:00', end: '19:00', enabled: true },
            2: { start: '10:00', end: '19:00', enabled: true },
            3: { start: '10:00', end: '19:00', enabled: true },
            4: { start: '10:00', end: '19:00', enabled: true },
            5: { start: '10:00', end: '15:00', enabled: true },
          },
          slotDuration: 60,
        },
      ])
    } catch (error) {
      console.error('Error loading doctors:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredDoctors = doctors.filter(doctor =>
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getDayName = (day: number) => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    return days[day]
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Doctores</h1>
            <p className="text-slate-500 text-sm">Gestiona los doctores de tu clínica</p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Doctor
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          type="text"
          placeholder="Buscar por nombre o especialidad..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={<Search className="w-5 h-5" />}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Doctores</p>
              <p className="text-2xl font-bold text-slate-800">{doctors.length}</p>
            </div>
            <UserCog className="w-8 h-8 text-primary-500" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Activos</p>
              <p className="text-2xl font-bold text-success-600">
                {doctors.filter(d => d.active).length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-success-500" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Inactivos</p>
              <p className="text-2xl font-bold text-slate-400">
                {doctors.filter(d => !d.active).length}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-slate-400" />
          </div>
        </Card>
      </div>

      {/* Doctors List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-slate-500">Cargando doctores...</p>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <UserCog className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No se encontraron doctores</p>
            <Button onClick={() => setShowAddModal(true)} className="mt-4">
              Agregar primer doctor
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredDoctors.map(doctor => (
            <Card key={doctor.id}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  {/* Avatar */}
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white font-semibold text-xl"
                    style={{ backgroundColor: doctor.color }}
                  >
                    {doctor.name.split(' ').map(n => n[0]).join('')}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-lg text-slate-800">
                        {doctor.name}
                      </h3>
                      {doctor.active ? (
                        <span className="px-2 py-1 text-xs font-medium bg-success-100 text-success-700 rounded-full">
                          Activo
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">
                          Inactivo
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 text-sm text-slate-600 mb-3">
                      <p className="font-medium text-primary-600">{doctor.specialty}</p>
                      <p>{doctor.email}</p>
                      <p>{doctor.phone}</p>
                    </div>

                    {/* Working Hours */}
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <p className="text-sm text-slate-600">Horarios:</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(doctor.workingHours)
                        .filter(([_, hours]) => hours.enabled)
                        .map(([day, hours]) => (
                          <div
                            key={day}
                            className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-700"
                          >
                            {getDayName(parseInt(day))}: {hours.start} - {hours.end}
                          </div>
                        ))}
                    </div>

                    <div className="flex items-center space-x-2 mt-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <p className="text-sm text-slate-600">
                        Duración de cita: {doctor.slotDuration} minutos
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={doctor.active ? 'text-slate-600' : 'text-success-600'}
                  >
                    {doctor.active ? 'Desactivar' : 'Activar'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Doctor Modal - TODO: Implement full modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Agregar Doctor</h2>
            <p className="text-slate-500 mb-4">
              Funcionalidad en desarrollo. Conecta con /api/doctors para agregar doctores.
            </p>
            <Button onClick={() => setShowAddModal(false)}>Cerrar</Button>
          </div>
        </div>
      )}
    </div>
  )
}
