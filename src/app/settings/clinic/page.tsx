'use client'

import { useState } from 'react'
import { Building, MapPin, Phone, Mail, Globe, Clock, Camera } from 'lucide-react'
import { Header, PageContainer, AppShell } from '@/components/layout'
import { Card, Input, Button, Select } from '@/components/ui'
import { useLanguage } from '@/i18n'

export default function ClinicPage() {
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    name: 'Clinic Estética',
    address: 'Av. Principal 123, Ciudad',
    phone: '+1 234 567 8900',
    email: 'contacto@clinica.com',
    website: 'www.clinica.com',
    timezone: 'America/Mexico_City',
    currency: 'USD',
    workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    openTime: '09:00',
    closeTime: '19:00',
  })
  const [saved, setSaved] = useState(false)

  const timezones = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Mexico_City', label: 'Mexico City (CST)' },
    { value: 'America/Bogota', label: 'Colombia (COT)' },
    { value: 'America/Argentina/Buenos_Aires', label: 'Argentina (ART)' },
    { value: 'Europe/Madrid', label: 'Spain (CET)' },
  ]

  const currencies = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'MXN', label: 'MXN ($)' },
    { value: 'COP', label: 'COP ($)' },
    { value: 'ARS', label: 'ARS ($)' },
  ]

  const handleSave = () => {
    // In a real app, this would save to API/state
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <AppShell>
      <Header title={t.settings.clinicInfo} showBack />

      <PageContainer>
        <div className="lg:max-w-2xl lg:mx-auto space-y-6">
          {/* Logo Section */}
          <Card className="text-center">
            <div className="w-24 h-24 mx-auto bg-primary-100 rounded-2xl flex items-center justify-center">
              <Building className="w-12 h-12 text-primary-600" />
            </div>
            <button className="mt-4 inline-flex items-center gap-2 text-sm text-primary-600 font-medium hover:underline">
              <Camera className="w-4 h-4" />
              {t.settings.changeLogo}
            </button>
          </Card>

          {/* Basic Info */}
          <Card>
            <h3 className="font-semibold text-slate-800 mb-4">{t.settings.basicInfo}</h3>
            <div className="space-y-4">
              <Input
                label={t.settings.clinicName}
                placeholder={t.settings.clinicNamePlaceholder}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                icon={<Building className="w-5 h-5" />}
              />

              <Input
                label={t.settings.address}
                placeholder={t.settings.addressPlaceholder}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                icon={<MapPin className="w-5 h-5" />}
              />

              <Input
                label={t.common.phone}
                placeholder="+1 234 567 8900"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                icon={<Phone className="w-5 h-5" />}
              />

              <Input
                label={t.common.email}
                placeholder="contacto@clinica.com"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                icon={<Mail className="w-5 h-5" />}
              />

              <Input
                label={t.settings.website}
                placeholder="www.clinica.com"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                icon={<Globe className="w-5 h-5" />}
              />
            </div>
          </Card>

          {/* Regional Settings */}
          <Card>
            <h3 className="font-semibold text-slate-800 mb-4">{t.settings.regionalSettings}</h3>
            <div className="space-y-4">
              <Select
                label={t.settings.timezone}
                value={formData.timezone}
                onChange={(value) => setFormData({ ...formData, timezone: value })}
                options={timezones}
              />

              <Select
                label={t.settings.currency}
                value={formData.currency}
                onChange={(value) => setFormData({ ...formData, currency: value })}
                options={currencies}
              />
            </div>
          </Card>

          {/* Business Hours */}
          <Card>
            <h3 className="font-semibold text-slate-800 mb-4">{t.settings.businessHours}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={t.settings.openTime}
                  type="time"
                  value={formData.openTime}
                  onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
                  icon={<Clock className="w-5 h-5" />}
                />
                <Input
                  label={t.settings.closeTime}
                  type="time"
                  value={formData.closeTime}
                  onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
                  icon={<Clock className="w-5 h-5" />}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t.settings.workDays}
                </label>
                <div className="flex flex-wrap gap-2">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        const newWorkDays = formData.workDays.includes(day)
                          ? formData.workDays.filter(d => d !== day)
                          : [...formData.workDays, day]
                        setFormData({ ...formData, workDays: newWorkDays })
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        formData.workDays.includes(day)
                          ? 'bg-primary-500 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {t.settings.days[day as keyof typeof t.settings.days]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Save Button */}
          <Button fullWidth onClick={handleSave}>
            {saved ? t.common.saved : t.common.save}
          </Button>
        </div>
      </PageContainer>
    </AppShell>
  )
}
