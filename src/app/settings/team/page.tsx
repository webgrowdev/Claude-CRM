'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, Mail, Phone, MoreVertical, Edit, Trash2, Shield, User } from 'lucide-react'
import { Header, PageContainer, AppShell } from '@/components/layout'
import { Card, Button, Input, Modal, Avatar, Badge, Select, EmptyState } from '@/components/ui'
import { useLanguage } from '@/i18n'

type TeamRole = 'owner' | 'manager' | 'doctor' | 'receptionist'

interface TeamMember {
  id: string
  name: string
  email: string
  phone: string
  role: TeamRole
  status: 'active' | 'pending'
  is_active: boolean
  created_at: string
}

export default function TeamPage() {
  const { t } = useLanguage()
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'receptionist' as TeamRole,
    password: '',
  })
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])

  // Helper to get JWT token from cookie
  const getAuthToken = (): string | null => {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1]
    return token || null
  }

  // Load team members on mount
  useEffect(() => {
    loadTeamMembers()
  }, [])

  const loadTeamMembers = async () => {
    const token = getAuthToken()
    if (!token) {
      console.warn('No authentication token found')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/team', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        const members = (data.team || []).map((member: any) => ({
          id: member.id,
          name: member.name,
          email: member.email || '',
          phone: member.phone || '',
          role: member.role,
          status: member.is_active ? 'active' : 'pending',
          is_active: member.is_active,
          created_at: member.created_at,
        }))
        setTeamMembers(members)
      } else {
        console.error('Failed to load team members')
      }
    } catch (error) {
      console.error('Error loading team members:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner': return 'Propietario'
      case 'manager': return 'Gerente'
      case 'doctor': return 'Doctor'
      case 'receptionist': return 'Recepcionista'
      default: return role
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner': return 'primary'
      case 'manager': return 'default'
      case 'doctor': return 'default'
      case 'receptionist': return 'outline'
      default: return 'default'
    }
  }

  const handleAdd = async () => {
    if (!formData.name || !formData.email || !formData.password) return

    const token = getAuthToken()
    if (!token) return

    try {
      const response = await fetch('/api/team', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await loadTeamMembers()
        setFormData({ name: '', email: '', phone: '', role: 'receptionist', password: '' })
        setShowAddModal(false)
      } else {
        console.error('Failed to create team member')
      }
    } catch (error) {
      console.error('Error creating team member:', error)
    }
  }

  const handleEdit = async () => {
    if (!selectedMember || !formData.name || !formData.email) return

    const token = getAuthToken()
    if (!token) return

    try {
      const response = await fetch(`/api/team?id=${selectedMember.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          role: formData.role,
        }),
      })

      if (response.ok) {
        await loadTeamMembers()
        setShowEditModal(false)
        setSelectedMember(null)
      } else {
        console.error('Failed to update team member')
      }
    } catch (error) {
      console.error('Error updating team member:', error)
    }
  }

  const handleDelete = async () => {
    if (!selectedMember) return

    const token = getAuthToken()
    if (!token) return

    try {
      const response = await fetch(`/api/team?id=${selectedMember.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        await loadTeamMembers()
        setShowDeleteConfirm(false)
        setSelectedMember(null)
      } else {
        console.error('Failed to delete team member')
      }
    } catch (error) {
      console.error('Error deleting team member:', error)
    }
  }

  const openEdit = (member: TeamMember) => {
    setSelectedMember(member)
    setFormData({
      name: member.name,
      email: '',
      phone: member.phone || '',
      role: member.role,
      password: '',
    })
    setShowEditModal(true)
  }

  const openDelete = (member: TeamMember) => {
    setSelectedMember(member)
    setShowDeleteConfirm(true)
  }

  return (
    <AppShell>
      <Header
        title={t.settings.team}
        showBack
        rightContent={
          <button
            onClick={() => {
              setFormData({ name: '', email: '', phone: '', role: 'receptionist', password: '' })
              setShowAddModal(true)
            }}
            className="p-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        }
      />

      <PageContainer>
        <div className="lg:max-w-3xl lg:mx-auto">
          {/* Desktop Header */}
          <div className="hidden lg:flex lg:items-center lg:justify-between lg:mb-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-800">{t.settings.teamMembers}</h2>
              <p className="text-sm text-slate-500 mt-1">{t.settings.teamDescription}</p>
            </div>
            <Button
              onClick={() => {
                setFormData({ name: '', email: '', phone: '', role: 'receptionist', password: '' })
                setShowAddModal(true)
              }}
              icon={<Plus className="w-5 h-5" />}
            >
              {t.settings.inviteMember}
            </Button>
          </div>

          {/* Team List */}
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <p className="text-slate-500">Cargando miembros del equipo...</p>
            </div>
          ) : teamMembers.length === 0 ? (
            <EmptyState
              icon={<Users className="w-8 h-8" />}
              title={t.settings.noTeamMembers}
              description={t.settings.inviteFirstMember}
              action={{
                label: t.settings.inviteMember,
                onClick: () => setShowAddModal(true),
              }}
            />
          ) : (
            <Card padding="none">
              <div className="divide-y divide-slate-100">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-4 p-4">
                    <Avatar name={member.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-800 truncate">{member.name}</p>
                        <Badge variant={getRoleBadge(member.role) as 'primary' | 'default' | 'outline'} size="sm">
                          {getRoleLabel(member.role)}
                        </Badge>
                        {!member.is_active && (
                          <Badge variant="warning" size="sm">{t.settings.pending}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                        {member.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />
                            {member.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(member)}
                        className="p-2 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDelete(member)}
                        className="p-2 rounded-lg text-slate-400 hover:text-error-600 hover:bg-error-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Roles Explanation */}
          <Card className="mt-6 bg-slate-50">
            <h3 className="font-semibold text-slate-800 mb-3">{t.settings.rolesExplanation}</h3>
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-700">{t.settings.roleAdmin}</p>
                  <p>{t.settings.roleAdminDesc}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-700">{t.settings.roleUser}</p>
                  <p>{t.settings.roleUserDesc}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-slate-300 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-700">{t.settings.roleViewer}</p>
                  <p>{t.settings.roleViewerDesc}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </PageContainer>

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={t.settings.inviteMember}
      >
        <form onSubmit={(e) => { e.preventDefault(); handleAdd(); }} className="space-y-4">
          <Input
            label={t.common.name}
            placeholder={t.settings.memberNamePlaceholder}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label={t.common.email}
            placeholder={t.settings.memberEmailPlaceholder}
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <Input
            label={`${t.common.phone} (${t.common.optional})`}
            placeholder={t.settings.memberPhonePlaceholder}
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />

          <Input
            label="Contraseña"
            placeholder="Contraseña temporal"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />

          <Select
            label={t.settings.role}
            value={formData.role}
            onChange={(value) => setFormData({ ...formData, role: value as TeamRole })}
            options={[
              { value: 'owner', label: 'Propietario' },
              { value: 'manager', label: 'Gerente' },
              { value: 'doctor', label: 'Doctor' },
              { value: 'receptionist', label: 'Recepcionista' },
            ]}
          />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" fullWidth onClick={() => setShowAddModal(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" fullWidth>
              {t.settings.sendInvitation}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={t.settings.editMember}
      >
        <form onSubmit={(e) => { e.preventDefault(); handleEdit(); }} className="space-y-4">
          <Input
            label={t.common.name}
            placeholder={t.settings.memberNamePlaceholder}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label={t.common.email}
            placeholder={t.settings.memberEmailPlaceholder}
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <Input
            label={`${t.common.phone} (${t.common.optional})`}
            placeholder={t.settings.memberPhonePlaceholder}
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />

          <Select
            label={t.settings.role}
            value={formData.role}
            onChange={(value) => setFormData({ ...formData, role: value as TeamRole })}
            options={[
              { value: 'owner', label: 'Propietario' },
              { value: 'manager', label: 'Gerente' },
              { value: 'doctor', label: 'Doctor' },
              { value: 'receptionist', label: 'Recepcionista' },
            ]}
          />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" fullWidth onClick={() => setShowEditModal(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" fullWidth>
              {t.common.save}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title={t.settings.removeMember}
        size="sm"
      >
        <p className="text-slate-600 mb-6">
          {t.settings.removeMemberConfirm} <strong>{selectedMember?.name}</strong>?
        </p>
        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={() => setShowDeleteConfirm(false)}>
            {t.common.cancel}
          </Button>
          <Button variant="danger" fullWidth onClick={handleDelete}>
            {t.settings.remove}
          </Button>
        </div>
      </Modal>
    </AppShell>
  )
}
