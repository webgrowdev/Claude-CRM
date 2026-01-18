'use client'

import { useState } from 'react'
import { Users, Plus, Mail, Phone, MoreVertical, Edit, Trash2, Shield, User } from 'lucide-react'
import { Header, PageContainer, AppShell } from '@/components/layout'
import { Card, Button, Input, Modal, Avatar, Badge, Select, EmptyState } from '@/components/ui'
import { useLanguage } from '@/i18n'

interface TeamMember {
  id: string
  name: string
  email: string
  phone: string
  role: 'admin' | 'user' | 'viewer'
  status: 'active' | 'pending'
  createdAt: Date
}

export default function TeamPage() {
  const { t } = useLanguage()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'user' as 'admin' | 'user' | 'viewer',
  })

  // Mock data - in real app this would come from state/API
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: 'Dr. María García',
      email: 'maria@clinica.com',
      phone: '+1 234 567 8900',
      role: 'admin',
      status: 'active',
      createdAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      name: 'Ana López',
      email: 'ana@clinica.com',
      phone: '+1 234 567 8901',
      role: 'user',
      status: 'active',
      createdAt: new Date('2024-02-15'),
    },
  ])

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return t.settings.roleAdmin
      case 'user': return t.settings.roleUser
      case 'viewer': return t.settings.roleViewer
      default: return role
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return 'primary'
      case 'user': return 'default'
      case 'viewer': return 'outline'
      default: return 'default'
    }
  }

  const handleAdd = () => {
    if (!formData.name || !formData.email) return

    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      role: formData.role,
      status: 'pending',
      createdAt: new Date(),
    }

    setTeamMembers([...teamMembers, newMember])
    setFormData({ name: '', email: '', phone: '', role: 'user' })
    setShowAddModal(false)
  }

  const handleEdit = () => {
    if (!selectedMember || !formData.name || !formData.email) return

    setTeamMembers(teamMembers.map(m =>
      m.id === selectedMember.id
        ? { ...m, ...formData }
        : m
    ))
    setShowEditModal(false)
    setSelectedMember(null)
  }

  const handleDelete = () => {
    if (!selectedMember) return

    setTeamMembers(teamMembers.filter(m => m.id !== selectedMember.id))
    setShowDeleteConfirm(false)
    setSelectedMember(null)
  }

  const openEdit = (member: TeamMember) => {
    setSelectedMember(member)
    setFormData({
      name: member.name,
      email: member.email,
      phone: member.phone,
      role: member.role,
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
              setFormData({ name: '', email: '', phone: '', role: 'user' })
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
                setFormData({ name: '', email: '', phone: '', role: 'user' })
                setShowAddModal(true)
              }}
              icon={<Plus className="w-5 h-5" />}
            >
              {t.settings.inviteMember}
            </Button>
          </div>

          {/* Team List */}
          {teamMembers.length === 0 ? (
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
                        {member.status === 'pending' && (
                          <Badge variant="warning" size="sm">{t.settings.pending}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          {member.email}
                        </span>
                        {member.phone && (
                          <span className="hidden sm:flex items-center gap-1">
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

          <Select
            label={t.settings.role}
            value={formData.role}
            onChange={(value) => setFormData({ ...formData, role: value as 'admin' | 'user' | 'viewer' })}
            options={[
              { value: 'admin', label: t.settings.roleAdmin },
              { value: 'user', label: t.settings.roleUser },
              { value: 'viewer', label: t.settings.roleViewer },
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
            onChange={(value) => setFormData({ ...formData, role: value as 'admin' | 'user' | 'viewer' })}
            options={[
              { value: 'admin', label: t.settings.roleAdmin },
              { value: 'user', label: t.settings.roleUser },
              { value: 'viewer', label: t.settings.roleViewer },
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
