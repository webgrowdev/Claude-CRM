'use client'

import { useState } from 'react'
import { Lock, Eye, EyeOff, Check, X } from 'lucide-react'
import { Header, PageContainer, AppShell } from '@/components/layout'
import { Card, Input, Button } from '@/components/ui'
import { useLanguage } from '@/i18n'

export default function PasswordPage() {
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const passwordRequirements = [
    { label: t.settings.passwordMinLength, met: formData.newPassword.length >= 8 },
    { label: t.settings.passwordUppercase, met: /[A-Z]/.test(formData.newPassword) },
    { label: t.settings.passwordLowercase, met: /[a-z]/.test(formData.newPassword) },
    { label: t.settings.passwordNumber, met: /[0-9]/.test(formData.newPassword) },
  ]

  const allRequirementsMet = passwordRequirements.every((req) => req.met)
  const passwordsMatch = formData.newPassword === formData.confirmPassword && formData.confirmPassword !== ''

  const handleSave = () => {
    setError('')

    if (!formData.currentPassword) {
      setError(t.settings.enterCurrentPassword)
      return
    }

    if (!allRequirementsMet) {
      setError(t.settings.passwordRequirementsNotMet)
      return
    }

    if (!passwordsMatch) {
      setError(t.settings.passwordsDoNotMatch)
      return
    }

    // In a real app, this would call an API
    setSaved(true)
    setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <AppShell>
      <Header title={t.settings.changePassword} showBack />

      <PageContainer>
        <div className="lg:max-w-md lg:mx-auto">
          <Card>
            <div className="space-y-4">
              {/* Current Password */}
              <div className="relative">
                <Input
                  label={t.settings.currentPassword}
                  placeholder="••••••••"
                  type={showPasswords.current ? 'text' : 'password'}
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  icon={<Lock className="w-5 h-5" />}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
                >
                  {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* New Password */}
              <div className="relative">
                <Input
                  label={t.settings.newPassword}
                  placeholder="••••••••"
                  type={showPasswords.new ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  icon={<Lock className="w-5 h-5" />}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
                >
                  {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Password Requirements */}
              {formData.newPassword && (
                <div className="p-3 bg-slate-50 rounded-lg space-y-2">
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      {req.met ? (
                        <Check className="w-4 h-4 text-success-500" />
                      ) : (
                        <X className="w-4 h-4 text-slate-300" />
                      )}
                      <span className={req.met ? 'text-success-700' : 'text-slate-500'}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Confirm Password */}
              <div className="relative">
                <Input
                  label={t.settings.confirmPassword}
                  placeholder="••••••••"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  icon={<Lock className="w-5 h-5" />}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
                >
                  {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Match indicator */}
              {formData.confirmPassword && (
                <div className={`flex items-center gap-2 text-sm ${passwordsMatch ? 'text-success-600' : 'text-error-600'}`}>
                  {passwordsMatch ? (
                    <>
                      <Check className="w-4 h-4" />
                      {t.settings.passwordsMatch}
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4" />
                      {t.settings.passwordsDoNotMatch}
                    </>
                  )}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-error-50 text-error-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Success Message */}
              {saved && (
                <div className="p-3 bg-success-50 text-success-700 rounded-lg text-sm flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  {t.settings.passwordChanged}
                </div>
              )}

              <Button
                fullWidth
                onClick={handleSave}
                disabled={!formData.currentPassword || !allRequirementsMet || !passwordsMatch}
              >
                {t.settings.updatePassword}
              </Button>
            </div>
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  )
}
