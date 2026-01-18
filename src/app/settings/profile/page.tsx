'use client'

import { useState } from 'react'
import { User as UserIcon, Mail, Phone, Building, Camera } from 'lucide-react'
import { Header, PageContainer, AppShell } from '@/components/layout'
import { Card, Input, Button, Avatar } from '@/components/ui'
import { useApp } from '@/contexts/AppContext'
import { useLanguage } from '@/i18n'

export default function ProfilePage() {
  const { state, updateUser } = useApp()
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    name: state.user.name,
    email: state.user.email,
    phone: state.user.phone || '',
    specialty: state.user.specialty || '',
  })
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    updateUser({
      ...state.user,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      specialty: formData.specialty,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <AppShell>
      <Header title={t.settings.editProfile} showBack />

      <PageContainer>
        <div className="lg:max-w-2xl lg:mx-auto">
          {/* Avatar Section */}
          <Card className="text-center">
            <div className="relative inline-block">
              <Avatar name={formData.name} size="xl" />
              <button className="absolute bottom-0 right-0 p-2 bg-primary-500 text-white rounded-full shadow-lg hover:bg-primary-600 transition-colors">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mt-3">{t.settings.tapToChangePhoto}</p>
          </Card>

          {/* Form */}
          <Card className="mt-6">
            <h3 className="font-semibold text-slate-800 mb-4">{t.settings.personalInfo}</h3>
            <div className="space-y-4">
              <Input
                label={t.common.name}
                placeholder={t.settings.enterName}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                icon={<UserIcon className="w-5 h-5" />}
              />

              <Input
                label={t.common.email}
                placeholder={t.settings.enterEmail}
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                icon={<Mail className="w-5 h-5" />}
              />

              <Input
                label={t.common.phone}
                placeholder={t.settings.enterPhone}
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                icon={<Phone className="w-5 h-5" />}
              />

              <Input
                label={t.settings.role}
                placeholder={t.settings.enterRole}
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                icon={<Building className="w-5 h-5" />}
              />
            </div>

            <div className="mt-6">
              <Button fullWidth onClick={handleSave}>
                {saved ? t.common.saved : t.common.save}
              </Button>
            </div>
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  )
}
